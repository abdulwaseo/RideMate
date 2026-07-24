#!/usr/bin/env python3
"""
RideMate Idempotent Database Seeding Script
Populates PostgreSQL with realistic Karachi corporate commute demo data.
"""

import sys
import os
from datetime import date, datetime, time, timedelta

# Ensure backend directory is in python module search path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.base import Base
from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, DriverProfile, PassengerProfile
from app.models.vehicle import Vehicle
from app.models.ride import Ride
from app.models.rating import Rating
from app.models.notification import NotificationPreference
from app.schemas.enums import UserRole, VerificationStatus, VehicleType, RideStatus

def seed_database():
    db = SessionLocal()
    print("=" * 65)
    print("      RideMate PostgreSQL Database Seeding System")
    print("=" * 65)

    try:
        common_password_hash = get_password_hash("password123")

        driver_count = 0
        passenger_count = 0
        vehicle_count = 0
        ride_count = 0
        rating_count = 0
        pref_count = 0

        # --------------------------------------------------
        # 1. Driver Users, Profiles & Vehicles (5 Drivers)
        # --------------------------------------------------
        drivers_data = [
            {
                "name": "Zainab Ahmed",
                "email": "zainab.driver@ridemate.pk",
                "mobile": "+92 321 9876543",
                "office": "VentureDive (Level 6)",
                "cnic": "42101-1234567-1",
                "license": "LIC-987651",
                "vehicle": {
                    "type": VehicleType.CAR,
                    "manufacturer": "Kia",
                    "model": "Kia Sportage 2021",
                    "reg": "AAA-123",
                    "color": "White",
                    "seats": 4,
                }
            },
            {
                "name": "Bilal Malik",
                "email": "bilal.driver@ridemate.pk",
                "mobile": "+92 300 2345678",
                "office": "Symmetry Group (Level 3)",
                "cnic": "42101-2345678-2",
                "license": "LIC-987652",
                "vehicle": {
                    "type": VehicleType.CAR,
                    "manufacturer": "Honda",
                    "model": "Honda Civic 2019",
                    "reg": "BXZ-987",
                    "color": "Black",
                    "seats": 4,
                }
            },
            {
                "name": "Asad Siddiqui",
                "email": "asad.driver@ridemate.pk",
                "mobile": "+92 333 4567890",
                "office": "Folio3 (Level 8)",
                "cnic": "42101-3456789-3",
                "license": "LIC-987653",
                "vehicle": {
                    "type": VehicleType.BIKE,
                    "manufacturer": "Honda",
                    "model": "Honda CG 125",
                    "reg": "KCD-456",
                    "color": "Red",
                    "seats": 1,
                }
            },
            {
                "name": "Tariq Mahmood",
                "email": "tariq.driver@ridemate.pk",
                "mobile": "+92 312 3456789",
                "office": "Systems Limited (Level 4)",
                "cnic": "42101-4567890-4",
                "license": "LIC-987654",
                "vehicle": {
                    "type": VehicleType.CAR,
                    "manufacturer": "Toyota",
                    "model": "Toyota Corolla 2022",
                    "reg": "LEB-554",
                    "color": "Silver",
                    "seats": 4,
                }
            },
            {
                "name": "Fatima Noor",
                "email": "fatima.driver@ridemate.pk",
                "mobile": "+92 345 6789012",
                "office": "10Pearls (Level 5)",
                "cnic": "42101-5678901-5",
                "license": "LIC-987655",
                "vehicle": {
                    "type": VehicleType.CAR,
                    "manufacturer": "Suzuki",
                    "model": "Suzuki Alto 2020",
                    "reg": "KHI-789",
                    "color": "Blue",
                    "seats": 3,
                }
            },
        ]

        created_drivers = []
        created_vehicles = []

        for d_info in drivers_data:
            driver_user = db.query(User).filter(
                (User.mobile_number == d_info["mobile"]) | (User.email == d_info["email"])
            ).first()

            if not driver_user:
                driver_user = User(
                    name=d_info["name"],
                    email=d_info["email"],
                    mobile_number=d_info["mobile"],
                    office_name=d_info["office"],
                    hashed_password=common_password_hash,
                    role=UserRole.DRIVER,
                    verification_status=VerificationStatus.VERIFIED,
                )
                db.add(driver_user)
                db.flush()
                driver_count += 1
                print(f"[+] Driver User created: {driver_user.name} ({driver_user.mobile_number})")
            else:
                print(f"[=] Driver User exists: {driver_user.name}")

            # Driver Profile Idempotent Lookup
            d_profile = db.query(DriverProfile).filter(
                (DriverProfile.user_id == driver_user.id) |
                (DriverProfile.cnic_number == d_info["cnic"]) |
                (DriverProfile.license_number == d_info["license"])
            ).first()

            if not d_profile:
                d_profile = DriverProfile(
                    user_id=driver_user.id,
                    cnic_number=d_info["cnic"],
                    license_number=d_info["license"],
                    verification_status=VerificationStatus.VERIFIED,
                    verification_notes="Verified Corporate Commuter Driver",
                )
                db.add(d_profile)
                db.flush()
                print(f"[+] Driver Profile created for: {driver_user.name}")
            else:
                print(f"[=] Driver Profile exists for: {driver_user.name}")

            # Vehicle Idempotent Lookup
            veh_info = d_info["vehicle"]
            vehicle = db.query(Vehicle).filter_by(registration_number=veh_info["reg"]).first()
            if not vehicle:
                vehicle = Vehicle(
                    driver_profile_id=d_profile.id,
                    vehicle_type=veh_info["type"],
                    manufacturer=veh_info["manufacturer"],
                    model=veh_info["model"],
                    registration_number=veh_info["reg"],
                    color=veh_info["color"],
                    seat_capacity=veh_info["seats"],
                    is_active=True,
                )
                db.add(vehicle)
                db.flush()
                vehicle_count += 1
                print(f"[+] Vehicle registered: {vehicle.model} [{vehicle.registration_number}]")
            else:
                print(f"[=] Vehicle exists: {vehicle.model} [{vehicle.registration_number}]")

            created_drivers.append((driver_user, d_profile))
            created_vehicles.append(vehicle)

        # --------------------------------------------------
        # 2. Passenger Users & Profiles (10 Passengers)
        # --------------------------------------------------
        passengers_data = [
            ("Sarah Khan", "sarah.passenger@ridemate.pk", "+92 300 1112223", "VentureDive (Level 6)"),
            ("Zeeshan Ali", "zeeshan.passenger@ridemate.pk", "+92 300 1112224", "Symmetry Group (Level 3)"),
            ("Hina Rabbani", "hina.passenger@ridemate.pk", "+92 300 1112225", "Folio3 (Level 8)"),
            ("Hamza Usman", "hamza.passenger@ridemate.pk", "+92 300 1112226", "Systems Limited (Level 4)"),
            ("Ayesha Omar", "ayesha.passenger@ridemate.pk", "+92 300 1112227", "10Pearls (Level 5)"),
            ("Kamran Farooq", "kamran.passenger@ridemate.pk", "+92 300 1112228", "TPS Pakistan (Level 2)"),
            ("Nida Yasir", "nida.passenger@ridemate.pk", "+92 300 1112229", "Contour Software (Level 7)"),
            ("Usman Sheikh", "usman.passenger@ridemate.pk", "+92 300 1112230", "NetSol (Level 1)"),
            ("Maryam Nawaz", "maryam.passenger@ridemate.pk", "+92 300 1112231", "Avanza Solutions (Level 9)"),
            ("Omar Akmal", "omar.passenger@ridemate.pk", "+92 300 1112232", "TRG Pakistan (Level 10)"),
        ]

        created_passengers = []

        for name, email, mobile, office in passengers_data:
            p_user = db.query(User).filter(
                (User.mobile_number == mobile) | (User.email == email)
            ).first()

            if not p_user:
                p_user = User(
                    name=name,
                    email=email,
                    mobile_number=mobile,
                    office_name=office,
                    hashed_password=common_password_hash,
                    role=UserRole.PASSENGER,
                    verification_status=VerificationStatus.VERIFIED,
                )
                db.add(p_user)
                db.flush()
                passenger_count += 1
                print(f"[+] Passenger User created: {p_user.name} ({p_user.mobile_number})")
            else:
                print(f"[=] Passenger User exists: {p_user.name}")

            # Passenger Profile
            p_profile = db.query(PassengerProfile).filter_by(user_id=p_user.id).first()
            if not p_profile:
                p_profile = PassengerProfile(user_id=p_user.id, is_active=True)
                db.add(p_profile)
                db.flush()
                print(f"[+] Passenger Profile created for: {p_user.name}")

            created_passengers.append(p_user)

        # --------------------------------------------------
        # 3. Notification Preferences (All 15 Users)
        # --------------------------------------------------
        all_users = [d[0] for d in created_drivers] + created_passengers
        for user_obj in all_users:
            pref = db.query(NotificationPreference).filter_by(user_id=user_obj.id).first()
            if not pref:
                pref = NotificationPreference(
                    user_id=user_obj.id,
                    ride_updates=True,
                    booking_updates=True,
                    chat_messages=True,
                    system_notifications=True,
                    marketing_notifications=False,
                    email_notifications=True,
                    push_notifications=True,
                )
                db.add(pref)
                db.flush()
                pref_count += 1

        print("[+] Notification Preferences verified for all 15 users.")

        # --------------------------------------------------
        # 4. Published Rides (5 Corridors)
        # --------------------------------------------------
        today = date.today()

        rides_data = [
            {
                "driver": created_drivers[0],
                "vehicle": created_vehicles[0],
                "pickup_area": "Gulshan-e-Iqbal",
                "pickup_point": "Disco Bakery Signal",
                "dest_area": "Dilkusha Towers",
                "dest_point": "Dilkusha Towers Main Entrance",
                "date": today,
                "time": time(8, 30),
                "seats": 3,
                "fare": 400.0,
                "notes": "Corporate commuters only. Leaving strictly at 8:30 AM.",
            },
            {
                "driver": created_drivers[1],
                "vehicle": created_vehicles[1],
                "pickup_area": "Clifton",
                "pickup_point": "BBQ Tonight Clifton Main Gate",
                "dest_area": "Dilkusha Towers",
                "dest_point": "Dilkusha Towers Basement Parking",
                "date": today,
                "time": time(8, 45),
                "seats": 2,
                "fare": 450.0,
                "notes": "Direct commute via Clifton Bridge. AC on full.",
            },
            {
                "driver": created_drivers[2],
                "vehicle": created_vehicles[2],
                "pickup_area": "Nazimabad",
                "pickup_point": "Nazimabad No. 3 Underpass Stop",
                "dest_area": "Dilkusha Towers",
                "dest_point": "Dilkusha Towers Front Plaza",
                "date": today,
                "time": time(8, 15),
                "seats": 1,
                "fare": 200.0,
                "notes": "Quick bike ride. Helmet available for passenger.",
            },
            {
                "driver": created_drivers[3],
                "vehicle": created_vehicles[3],
                "pickup_area": "Defence Phase 5",
                "pickup_point": "26th Street Shell Pump Signal",
                "dest_area": "Dilkusha Towers",
                "dest_point": "Dilkusha Towers Tower A Gate",
                "date": today + timedelta(days=1),
                "time": time(9, 00),
                "seats": 3,
                "fare": 500.0,
                "notes": "Smooth drive via Korangi Road. Non-smoking vehicle.",
            },
            {
                "driver": created_drivers[4],
                "vehicle": created_vehicles[4],
                "pickup_area": "PECHS Block 6",
                "pickup_point": "Nursery Bus Stop",
                "dest_area": "Dilkusha Towers",
                "dest_point": "Dilkusha Towers Dropoff Circle",
                "date": today + timedelta(days=1),
                "time": time(8, 30),
                "seats": 2,
                "fare": 300.0,
                "notes": "Economy ride via Shahrah-e-Faisal.",
            },
        ]

        for r_info in rides_data:
            d_user, d_prof = r_info["driver"]
            veh = r_info["vehicle"]

            existing_ride = db.query(Ride).filter_by(
                driver_profile_id=d_prof.id,
                pickup_area=r_info["pickup_area"],
                departure_date=r_info["date"],
            ).first()

            if not existing_ride:
                ride = Ride(
                    driver_profile_id=d_prof.id,
                    vehicle_id=veh.id,
                    pickup_area=r_info["pickup_area"],
                    pickup_point=r_info["pickup_point"],
                    destination_area=r_info["dest_area"],
                    destination_point=r_info["dest_point"],
                    departure_date=r_info["date"],
                    departure_time=r_info["time"],
                    available_seats=r_info["seats"],
                    fare_per_passenger=r_info["fare"],
                    ride_notes=r_info["notes"],
                    status=RideStatus.UPCOMING,
                )
                db.add(ride)
                db.flush()
                ride_count += 1
                print(f"[+] Published Ride created: {ride.pickup_area} -> {ride.destination_area} ({ride.departure_time})")
            else:
                print(f"[=] Published Ride exists for driver {d_user.name}")

        # --------------------------------------------------
        # 5. Ratings & Reviews
        # --------------------------------------------------
        sample_ride = db.query(Ride).first()
        if sample_ride:
            driver_user = created_drivers[0][0]
            passenger_user = created_passengers[0]

            existing_rating = db.query(Rating).filter_by(
                ride_id=sample_ride.id,
                reviewer_id=passenger_user.id
            ).first()

            if not existing_rating:
                rating = Rating(
                    ride_id=sample_ride.id,
                    reviewer_id=passenger_user.id,
                    reviewee_id=driver_user.id,
                    score=5,
                    review="Punctual driver! Very smooth commute to Dilkusha Towers.",
                )
                db.add(rating)
                db.flush()
                rating_count += 1
                print(f"[+] Rating seeded: 5-Star review from {passenger_user.name} to {driver_user.name}")
            else:
                print(f"[=] Rating exists for ride {sample_ride.id}")

        db.commit()

        # Database Total Record Count Summary
        total_users = db.query(User).count()
        total_drivers = db.query(DriverProfile).count()
        total_passengers = db.query(PassengerProfile).count()
        total_vehicles = db.query(Vehicle).count()
        total_rides = db.query(Ride).count()
        total_ratings = db.query(Rating).count()

        print("=" * 65)
        print("SEEDING SUMMARY & DATABASE RECORD VERIFICATION")
        print("=" * 65)
        print(f"  • Users Table Total:                 {total_users} (Drivers: 5, Passengers: 10)")
        print(f"  • Driver Profiles Table Total:        {total_drivers}")
        print(f"  • Passenger Profiles Table Total:     {total_passengers}")
        print(f"  • Vehicles Table Total:               {total_vehicles}")
        print(f"  • Published Rides Table Total:        {total_rides}")
        print(f"  • Ratings Table Total:                {total_ratings}")
        print("=" * 65)
        print("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY (IDEMPOTENT & VERIFIED)")
        print("=" * 65)

    except Exception as e:
        db.rollback()
        print(f"❌ Error during database seeding: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
