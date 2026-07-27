from typing import Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.booking import Booking
from app.models.rating import Rating
from app.models.ride import Ride
from app.models.user import DriverProfile, User
from app.repositories.rating import RatingRepository
from app.schemas.dashboard import (
    DashboardResponse,
    DriverDashboardStats,
    PassengerDashboardStats,
    ProfileSummaryResponse,
)
from app.schemas.enums import ConfirmedBookingStatus, RideStatus, UserRole


class StatisticsService:
    """Helper service computing user ride and commute statistics."""

    def __init__(self, db: Session):
        self.db = db
        self.rating_repo = RatingRepository(db)

    def get_driver_stats(self, user_id: UUID) -> DriverDashboardStats:
        driver_profile = self.db.query(DriverProfile).filter(DriverProfile.user_id == user_id).first()
        if not driver_profile:
            return DriverDashboardStats()

        # Rides query
        rides = self.db.query(Ride).filter(
            Ride.driver_profile_id == driver_profile.id,
            Ride.is_deleted == False,
        ).all()

        total_rides = len(rides)
        completed_rides = sum(1 for r in rides if r.status == RideStatus.COMPLETED)
        cancelled_rides = sum(1 for r in rides if r.status == RideStatus.CANCELLED)
        upcoming_rides = sum(1 for r in rides if r.status in [RideStatus.UPCOMING, RideStatus.ACTIVE, RideStatus.FULL])

        # Ratings
        avg_rating, total_ratings = self.rating_repo.calculate_user_rating(user_id)

        # Passenger count and earnings
        completed_ride_ids = [r.id for r in rides if r.status == RideStatus.COMPLETED]
        confirmed_bookings = []
        if completed_ride_ids:
            confirmed_bookings = self.db.query(Booking).filter(
                Booking.ride_id.in_(completed_ride_ids),
                Booking.booking_status.in_([ConfirmedBookingStatus.CONFIRMED, ConfirmedBookingStatus.COMPLETED]),
                Booking.is_deleted == False,
            ).all()

        unique_passengers = set(b.passenger_id for b in confirmed_bookings)
        passenger_count = len(unique_passengers)

        # Total earnings calculation
        total_earnings = 0.0
        for r in rides:
            if r.status == RideStatus.COMPLETED:
                seats_sold = sum(1 for b in confirmed_bookings if b.ride_id == r.id)
                total_earnings += (seats_sold * r.fare_per_passenger)

        return DriverDashboardStats(
            total_rides=total_rides,
            completed_rides=completed_rides,
            cancelled_rides=cancelled_rides,
            upcoming_rides=upcoming_rides,
            average_rating=avg_rating,
            total_ratings_received=total_ratings,
            total_earnings=total_earnings,
            passenger_count=passenger_count,
        )

    def get_passenger_stats(self, user_id: UUID) -> PassengerDashboardStats:
        bookings = self.db.query(Booking).options().filter(
            Booking.passenger_id == user_id,
            Booking.is_deleted == False,
        ).all()

        completed_trips = 0
        upcoming_trips = 0
        cancelled_trips = sum(1 for b in bookings if b.booking_status == ConfirmedBookingStatus.CANCELLED)

        for b in bookings:
            if b.booking_status in [ConfirmedBookingStatus.CONFIRMED, ConfirmedBookingStatus.COMPLETED] and b.ride:
                if b.ride.status == RideStatus.COMPLETED:
                    completed_trips += 1
                elif b.ride.status in [RideStatus.UPCOMING, RideStatus.ACTIVE, RideStatus.FULL]:
                    upcoming_trips += 1

        # Average rating given by passenger
        result = self.db.query(func.avg(Rating.score)).filter(
            Rating.reviewer_id == user_id,
            Rating.is_deleted == False,
        ).first()
        avg_given = round(float(result[0]), 2) if result and result[0] is not None else 0.0

        # Estimates
        money_saved = completed_trips * 350.0  # PKR saved vs solo taxi
        co2_saved_kg = completed_trips * 4.2   # kg CO2 emissions offset

        return PassengerDashboardStats(
            completed_trips=completed_trips,
            upcoming_trips=upcoming_trips,
            cancelled_trips=cancelled_trips,
            average_driver_rating_given=avg_given,
            money_saved=money_saved,
            co2_saved_kg=co2_saved_kg,
        )


class DashboardService:
    """Business logic for Dashboard analytics and Profile Summary."""

    def __init__(self, db: Session):
        self.db = db
        self.stats_svc = StatisticsService(db)
        self.rating_repo = RatingRepository(db)

    def get_dashboard(self, user: User) -> DashboardResponse:
        """Returns analytics dashboard payload adapted to user role."""
        driver_stats = self.stats_svc.get_driver_stats(user.id)
        passenger_stats = self.stats_svc.get_passenger_stats(user.id)

        return DashboardResponse(
            user_id=user.id,
            user_name=user.name,
            role=user.role.value if hasattr(user.role, "value") else str(user.role),
            driver_stats=driver_stats,
            passenger_stats=passenger_stats,
        )

    def get_profile_summary(self, user: User) -> ProfileSummaryResponse:
        """Returns unified profile summary with stats and reputation metrics."""
        avg_rating, total_ratings = self.rating_repo.calculate_user_rating(user.id)

        driver_stats = self.stats_svc.get_driver_stats(user.id)
        passenger_stats = self.stats_svc.get_passenger_stats(user.id)

        combined_stats = {
            "driver": driver_stats.model_dump(),
            "passenger": passenger_stats.model_dump(),
        }

        return ProfileSummaryResponse(
            id=user.id,
            name=user.name,
            mobile_number=user.mobile_number,
            email=user.email,
            role=user.role.value if hasattr(user.role, "value") else str(user.role),
            member_since=user.created_at,
            average_rating=avg_rating,
            total_ratings=total_ratings,
            completed_rides=driver_stats.completed_rides,
            completed_trips=passenger_stats.completed_trips,
            statistics=combined_stats,
        )
