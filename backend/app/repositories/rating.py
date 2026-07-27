from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.rating import Rating
from app.models.user import User


class RatingRepository:
    """Database operations for Rating entity."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, rating_id: UUID) -> Optional[Rating]:
        return self.db.query(Rating).options(
            joinedload(Rating.reviewer),
            joinedload(Rating.reviewee),
        ).filter(
            Rating.id == rating_id,
            Rating.is_deleted == False,
        ).first()

    def get_by_ride_and_reviewer(self, ride_id: UUID, reviewer_id: UUID) -> Optional[Rating]:
        """Find existing rating submitted by reviewer for specific ride."""
        return self.db.query(Rating).filter(
            Rating.ride_id == ride_id,
            Rating.reviewer_id == reviewer_id,
            Rating.is_deleted == False,
        ).first()

    def get_by_ride_reviewer_and_reviewee(self, ride_id: UUID, reviewer_id: UUID, reviewee_id: UUID) -> Optional[Rating]:
        """Find existing rating submitted by reviewer for specific reviewee on a ride."""
        return self.db.query(Rating).filter(
            Rating.ride_id == ride_id,
            Rating.reviewer_id == reviewer_id,
            Rating.reviewee_id == reviewee_id,
            Rating.is_deleted == False,
        ).first()

    def list_by_reviewee(self, reviewee_id: UUID, limit: int = 20) -> List[Rating]:
        """List reviews received by reviewee."""
        return self.db.query(Rating).options(
            joinedload(Rating.reviewer),
            joinedload(Rating.reviewee),
        ).filter(
            Rating.reviewee_id == reviewee_id,
            Rating.is_deleted == False,
        ).order_by(Rating.created_at.desc()).limit(limit).all()

    def list_by_reviewer(self, reviewer_id: UUID, limit: int = 20) -> List[Rating]:
        """List reviews submitted by reviewer."""
        return self.db.query(Rating).options(
            joinedload(Rating.reviewer),
            joinedload(Rating.reviewee),
        ).filter(
            Rating.reviewer_id == reviewer_id,
            Rating.is_deleted == False,
        ).order_by(Rating.created_at.desc()).limit(limit).all()

    def calculate_user_rating(self, user_id: UUID) -> Tuple[float, int]:
        """
        Calculates average rating and total ratings count received by user.

        Returns (average_rating, total_ratings).
        """
        result = self.db.query(
            func.avg(Rating.score),
            func.count(Rating.id),
        ).filter(
            Rating.reviewee_id == user_id,
            Rating.is_deleted == False,
        ).first()

        avg_score = round(float(result[0]), 2) if result and result[0] is not None else 0.0
        total_count = int(result[1]) if result and result[1] is not None else 0

        return avg_score, total_count

    def create(
        self,
        *,
        ride_id: UUID,
        reviewer_id: UUID,
        reviewee_id: UUID,
        score: int,
        review: Optional[str] = None,
    ) -> Rating:
        rating = Rating(
            ride_id=ride_id,
            reviewer_id=reviewer_id,
            reviewee_id=reviewee_id,
            score=score,
            review=review,
        )
        self.db.add(rating)
        self.db.flush()
        return rating

    def update(self, rating: Rating, **kwargs) -> Rating:
        for key, value in kwargs.items():
            if value is not None and hasattr(rating, key):
                setattr(rating, key, value)
        self.db.flush()
        return rating

    def soft_delete(self, rating: Rating) -> None:
        rating.is_deleted = True
        rating.deleted_at = datetime.now(timezone.utc)
        self.db.flush()
