from datetime import datetime, timedelta, timezone
from typing import List, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.rating import Rating
from app.models.ride import Ride
from app.models.user import DriverProfile, User
from app.repositories.booking import BookingRepository
from app.repositories.driver import DriverRepository
from app.repositories.rating import RatingRepository
from app.repositories.ride import RideRepository
from app.schemas.enums import ConfirmedBookingStatus, RideStatus
from app.schemas.rating import (
    BatchRatingCreate,
    RatingCreate,
    RatingResponse,
    RatingUpdate,
    UserRatingSummary,
)


class RatingService:
    """Business logic for reputation ratings and reviews."""

    def __init__(self, db: Session):
        self.db = db
        self.rating_repo = RatingRepository(db)
        self.ride_repo = RideRepository(db)
        self.driver_repo = DriverRepository(db)
        self.booking_repo = BookingRepository(db)

    def create_rating(self, user: User, payload: RatingCreate) -> RatingResponse:
        """
        Submits a rating and review for a completed ride.

        Business Rules:
        - Score range: 1 to 5.
        - Cannot rate oneself ([RATING_002]).
        - Ride must be in COMPLETED status ([RATING_003]).
        - Both reviewer and reviewee must be participants of the ride ([RATING_004]).
        - Duplicate rating for the same ride is forbidden ([RATING_005]).
        """
        # Rule 1: Cannot rate oneself
        if user.id == payload.reviewee_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[RATING_002] You cannot submit a rating for yourself.",
            )

        # Rule 2: Ride existence and completed status
        ride = self.ride_repo.get_by_id(payload.ride_id)
        if not ride:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.")

        if ride.status != RideStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[RATING_003] Only completed rides can be rated.",
            )

        # Rule 3: Check ride participants
        driver_profile = self.driver_repo.get_by_user_id(user.id)
        is_reviewer_driver = driver_profile and ride.driver_profile_id == driver_profile.id

        reviewer_booking = self.db.query(Booking).filter(
            Booking.ride_id == ride.id,
            Booking.passenger_id == user.id,
            Booking.booking_status.in_([ConfirmedBookingStatus.CONFIRMED, ConfirmedBookingStatus.COMPLETED]),
            Booking.is_deleted == False,
        ).first()

        if not is_reviewer_driver and not reviewer_booking:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="[RATING_004] You must be a confirmed participant of this ride to submit a rating.",
            )

        # Check reviewee is participant
        reviewee_driver_profile = self.driver_repo.get_by_user_id(payload.reviewee_id)
        is_reviewee_driver = reviewee_driver_profile and ride.driver_profile_id == reviewee_driver_profile.id

        reviewee_booking = self.db.query(Booking).filter(
            Booking.ride_id == ride.id,
            Booking.passenger_id == payload.reviewee_id,
            Booking.booking_status.in_([ConfirmedBookingStatus.CONFIRMED, ConfirmedBookingStatus.COMPLETED]),
            Booking.is_deleted == False,
        ).first()

        if not is_reviewee_driver and not reviewee_booking:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[RATING_004] Target reviewee was not a participant of this ride.",
            )

        # Rule 4: Single rating per (rater, ratee, ride) constraint
        existing = self.rating_repo.get_by_ride_reviewer_and_reviewee(payload.ride_id, user.id, payload.reviewee_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="[RATING_005] You have already submitted a rating for this user on this ride.",
            )

        rating = self.rating_repo.create(
            ride_id=payload.ride_id,
            reviewer_id=user.id,
            reviewee_id=payload.reviewee_id,
            score=payload.score,
            review=payload.review,
        )

        self.db.commit()
        self.db.refresh(rating)

        # Broadcast RATING_UPDATED WebSocket event to reviewee so their rating counter updates in real time
        try:
            from app.schemas.websocket import WSEvent, WSEventType
            from app.websocket.connection_manager import safe_broadcast_to_room

            avg_score, total_count = self.rating_repo.calculate_user_rating(payload.reviewee_id)
            ws_event = WSEvent(
                event_type=WSEventType.RATING_UPDATED.value,
                payload={
                    "user_id": str(payload.reviewee_id),
                    "average_rating": avg_score,
                    "total_ratings": total_count,
                    "latest_score": payload.score,
                    "ride_id": str(payload.ride_id),
                },
            )
            safe_broadcast_to_room(f"user:{payload.reviewee_id}", ws_event)
        except Exception as e:
            import logging
            logging.warning(f"Failed to broadcast RATING_UPDATED WebSocket event: {e}")

        return self._format_rating_response(rating)

    def batch_create_ratings(self, user: User, payload: BatchRatingCreate) -> List[RatingResponse]:
        """Submit ratings for multiple users in a single request."""
        responses = []
        for item in payload.ratings:
            try:
                resp = self.create_rating(user, item)
                responses.append(resp)
            except HTTPException as e:
                # If a single item in batch is already submitted, skip gracefully
                if e.status_code == status.HTTP_409_CONFLICT:
                    continue
                raise e
        return responses

    def update_rating(self, user: User, rating_id: UUID, payload: RatingUpdate) -> RatingResponse:
        """Update existing rating within 24 hours of creation."""
        rating = self.rating_repo.get_by_id(rating_id)
        if not rating or rating.reviewer_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found.")

        # Immutability check after 24 hours
        created_time = rating.created_at.replace(tzinfo=timezone.utc) if rating.created_at.tzinfo is None else rating.created_at
        if datetime.now(timezone.utc) - created_time > timedelta(hours=24):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="[RATING_006] Rating is immutable after 24 hours from submission.",
            )

        updated = self.rating_repo.update(
            rating,
            score=payload.score,
            review=payload.review,
        )

        self.db.commit()
        self.db.refresh(updated)
        return self._format_rating_response(updated)

    def get_my_ratings(self, user: User) -> List[RatingResponse]:
        """List all ratings submitted by or received by current user."""
        ratings = self.rating_repo.list_by_reviewer(user.id)
        return [self._format_rating_response(r) for r in ratings]

    def get_public_user_ratings(self, user_id: UUID) -> UserRatingSummary:
        """Retrieves public rating summary and reviews for a user."""
        target_user = self.db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        avg_rating, total_count = self.rating_repo.calculate_user_rating(user_id)
        recent_ratings = self.rating_repo.list_by_reviewee(user_id, limit=20)

        return UserRatingSummary(
            user_id=target_user.id,
            user_name=target_user.name,
            average_rating=avg_rating,
            total_ratings=total_count,
            recent_reviews=[self._format_rating_response(r) for r in recent_ratings],
        )

    def _format_rating_response(self, rating: Rating) -> RatingResponse:
        return RatingResponse(
            id=rating.id,
            ride_id=rating.ride_id,
            reviewer_id=rating.reviewer_id,
            reviewee_id=rating.reviewee_id,
            score=rating.score,
            review=rating.review,
            reviewer_name=rating.reviewer.name if rating.reviewer else None,
            reviewee_name=rating.reviewee.name if rating.reviewee else None,
            created_at=rating.created_at,
            updated_at=rating.updated_at,
        )
