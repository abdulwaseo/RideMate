import sys
import os
from uuid import uuid4

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

from app.db.base import Base
from app.db.session import SessionLocal
from app.models.user import User, DriverProfile, PassengerProfile
from app.models.vehicle import Vehicle
from app.models.ride import Ride
from app.models.booking import RideRequest, Booking
from app.models.chat import ChatRoom, ChatMessage
from app.models.notification import Notification
from app.models.token import RefreshToken
from app.core.security import get_password_hash
from app.schemas.enums import UserRole, VehicleType, VerificationStatus

def reset_and_seed():
    db = SessionLocal()
    try:
        print("1. Cleaning up all existing database records...")
        db.query(Notification).delete()
        db.query(ChatMessage).delete()
        db.query(ChatRoom).delete()
        db.query(Booking).delete()
        db.query(RideRequest).delete()
        db.query(Ride).delete()
        db.query(Vehicle).delete()
        db.query(PassengerProfile).delete()
        db.query(DriverProfile).delete()
        db.query(RefreshToken).delete()
        db.query(User).delete()
        db.commit()
        print("   Database wiped clean successfully.")

        print("\n2. Creating Driver Account (Abdul Waseo)...")
        hashed_pw = get_password_hash("123456789")

        # Driver: Abdul Waseo
        driver_user = User(
            id=uuid4(),
            name="Abdul Waseo",
            mobile_number="03243633432",
            hashed_password=hashed_pw,
            role=UserRole.DRIVER,
            office_name="Dilkusha Towers",
            verification_status=VerificationStatus.VERIFIED,
        )
        db.add(driver_user)
        db.flush()

        driver_profile = DriverProfile(
            id=uuid4(),
            user_id=driver_user.id,
            verification_status=VerificationStatus.VERIFIED,
            license_number="LIC-03243633432",
            cnic_number="42101-3243633-4",
        )
        db.add(driver_profile)
        db.flush()

        driver_passenger_profile = PassengerProfile(
            id=uuid4(),
            user_id=driver_user.id,
            is_active=True,
        )
        db.add(driver_passenger_profile)

        driver_vehicle = Vehicle(
            id=uuid4(),
            driver_profile_id=driver_profile.id,
            vehicle_type=VehicleType.CAR,
            manufacturer="Toyota",
            model="Corolla Altis",
            registration_number="KHI-36334",
            color="White",
            seat_capacity=4,
            is_active=True,
        )
        db.add(driver_vehicle)
        print(f"   [DRIVER] Name: Abdul Waseo | Mobile: 03243633432 | Password: 123456789 | Vehicle: {driver_vehicle.manufacturer} {driver_vehicle.model}")

        print("\n3. Creating Passenger Accounts...")

        # Passenger 1: Wasay
        p1_user = User(
            id=uuid4(),
            name="Wasay",
            mobile_number="03161108768",
            hashed_password=hashed_pw,
            role=UserRole.PASSENGER,
            office_name="Dilkusha Towers",
            verification_status=VerificationStatus.VERIFIED,
        )
        db.add(p1_user)
        db.flush()

        p1_profile = PassengerProfile(
            id=uuid4(),
            user_id=p1_user.id,
            is_active=True,
        )
        db.add(p1_profile)
        print(f"   [PASSENGER 1] Name: Wasay | Mobile: 03161108768 | Password: 123456789")

        # Passenger 2: Wasi
        p2_user = User(
            id=uuid4(),
            name="Wasi",
            mobile_number="03332297246",
            hashed_password=hashed_pw,
            role=UserRole.PASSENGER,
            office_name="Dilkusha Towers",
            verification_status=VerificationStatus.VERIFIED,
        )
        db.add(p2_user)
        db.flush()

        p2_profile = PassengerProfile(
            id=uuid4(),
            user_id=p2_user.id,
            is_active=True,
        )
        db.add(p2_profile)
        print(f"   [PASSENGER 2] Name: Wasi | Mobile: 03332297246 | Password: 123456789")

        db.commit()
        print("\n=======================================================================")
        print("  DATABASE SEEDED SUCCESSFULLY WITH EXACT REQUESTED CREDENTIALS")
        print("=======================================================================")
        print("  DRIVER (1 Total):")
        print("    - Name: Abdul Waseo")
        print("    - Mobile: 03243633432")
        print("    - Password: 123456789")
        print("\n  PASSENGERS (2 Total):")
        print("    1. Name: Wasay | Mobile: 03161108768 | Password: 123456789")
        print("    2. Name: Wasi  | Mobile: 03332297246 | Password: 123456789")
        print("=======================================================================\n")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_seed()
