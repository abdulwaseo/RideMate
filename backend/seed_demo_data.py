#!/usr/bin/env python3
"""
RideMate Database Seeding Script
Populates PostgreSQL with exact user accounts:
- Driver: Abdul Waseo (03243633432)
- Passenger 1: Wasay (03161108768)
- Passenger 2: Wasi (03332297246)
Password for all: 123456789
"""

import sys
import os
from datetime import date, time, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.db.base
from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, DriverProfile, PassengerProfile
from app.models.vehicle import Vehicle
from app.models.ride import Ride
from app.models.rating import Rating
from app.models.booking import Booking, RideRequest
from app.models.chat import ChatRoom, ChatMessage
from app.models.notification import Notification, NotificationPreference
from app.schemas.enums import UserRole, VerificationStatus, VehicleType, RideStatus

def seed_database():
    db = SessionLocal()
    print("=" * 65)
    print("      RideMate Database Seeding System (3 User Setup)")
    print("=" * 65)

    try:
        print("Clearing old data...")
        db.query(ChatMessage).delete()
        db.query(ChatRoom).delete()
        db.query(Booking).delete()
        db.query(RideRequest).delete()
        db.query(Rating).delete()
        db.query(Ride).delete()
        db.query(Vehicle).delete()
        db.query(NotificationPreference).delete()
        db.query(Notification).delete()
        db.query(DriverProfile).delete()
        db.query(PassengerProfile).delete()
        db.query(User).delete()
        db.commit()

        hashed_pw = get_password_hash("123456789")

        # 1. Driver: Abdul Waseo
        driver_user = User(
            name="Abdul Waseo",
            email="abdulwaseo@ridemate.pk",
            mobile_number="+92 324 3633432",
            office_name="Dilkusha Towers",
            hashed_password=hashed_pw,
            role=UserRole.DRIVER,
            verification_status=VerificationStatus.VERIFIED,
        )
        db.add(driver_user)
        db.flush()

        d_profile = DriverProfile(
            user_id=driver_user.id,
            cnic_number="42101-1234567-9",
            license_number="LIC-123456",
            verification_status=VerificationStatus.VERIFIED,
            verification_notes="Verified Corporate Commuter Driver",
        )
        db.add(d_profile)
        db.flush()

        vehicle = Vehicle(
            driver_profile_id=d_profile.id,
            vehicle_type=VehicleType.CAR,
            manufacturer="Honda",
            model="Honda Civic 2022",
            registration_number="AB-1234",
            color="White",
            seat_capacity=4,
            is_active=True,
        )
        db.add(vehicle)
        db.flush()

        db.add(PassengerProfile(user_id=driver_user.id, is_active=True))

        # 2. Passenger 1: Wasay
        p1_user = User(
            name="Wasay",
            email="wasay@ridemate.pk",
            mobile_number="+92 316 1108768",
            office_name="Dilkusha Towers",
            hashed_password=hashed_pw,
            role=UserRole.PASSENGER,
            verification_status=VerificationStatus.VERIFIED,
        )
        db.add(p1_user)
        db.flush()
        db.add(PassengerProfile(user_id=p1_user.id, is_active=True))

        # 3. Passenger 2: Wasi
        p2_user = User(
            name="Wasi",
            email="wasi@ridemate.pk",
            mobile_number="+92 333 2297246",
            office_name="Dilkusha Towers",
            hashed_password=hashed_pw,
            role=UserRole.PASSENGER,
            verification_status=VerificationStatus.VERIFIED,
        )
        db.add(p2_user)
        db.flush()
        db.add(PassengerProfile(user_id=p2_user.id, is_active=True))

        # Preferences
        for u in [driver_user, p1_user, p2_user]:
            db.add(NotificationPreference(
                user_id=u.id,
                ride_updates=True,
                booking_updates=True,
                chat_messages=True,
                system_notifications=True,
                marketing_notifications=False,
                email_notifications=True,
                push_notifications=True,
            ))

        # Published Ride
        today = date.today()
        ride = Ride(
            driver_profile_id=d_profile.id,
            vehicle_id=vehicle.id,
            pickup_area="Gulshan-e-Iqbal",
            pickup_point="Disco Bakery Signal",
            destination_area="Dilkusha Towers",
            destination_point="Dilkusha Towers Main Entrance",
            departure_date=today,
            departure_time=time(8, 30),
            available_seats=3,
            fare_per_passenger=400.0,
            ride_notes="Daily commute to Dilkusha Towers. Leaving at 8:30 AM sharp.",
            status=RideStatus.UPCOMING,
        )
        db.add(ride)

        db.commit()

        print("=" * 65)
        print("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY FOR 3 USERS:")
        print("  1. Driver:      Abdul Waseo (03243633432) - Password: 123456789")
        print("  2. Passenger 1: Wasay       (03161108768) - Password: 123456789")
        print("  3. Passenger 2: Wasi        (03332297246) - Password: 123456789")
        print("=" * 65)

    except Exception as e:
        db.rollback()
        print(f"❌ Error during database seeding: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
