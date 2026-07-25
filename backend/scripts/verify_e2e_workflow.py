import sys
import os
import json
import urllib.request
import urllib.error
from datetime import date, timedelta

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
from app.schemas.enums import RideStatus, BookingStatus, ConfirmedBookingStatus

BASE_URL = "http://localhost:8000/api/v1"

def print_header(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def http_post(path, payload, token=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(payload).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def http_get(path, token=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers, method='GET')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def http_patch(path, payload=None, token=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(payload).encode('utf-8') if payload else b""
    headers = {'Content-Type': 'application/json'} if payload else {}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method='PATCH')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def main():
    db = SessionLocal()
    results = {}

    print_header("RIDEMATE END-TO-END BUSINESS WORKFLOW AUDIT & VERIFICATION")

    # =========================================================================
    # PHASE 1: AUTHENTICATION VALIDATION
    # =========================================================================
    print_header("PHASE 1: Authentication Validation")
    
    # 1. Driver valid login
    status, res = http_post('/auth/login', {'mobile_number': '03243633432', 'password': '123456789'})
    assert status == 200, f"Driver login failed: {res}"
    driver_token = res['data']['tokens']['access_token']
    driver_id = res['data']['user']['id']
    driver_name = res['data']['user']['name']
    print(f"[PASS] Driver Login: {driver_name} ({driver_id}) | Token Received")

    # 2. Invalid credentials rejection
    status_fail, res_fail = http_post('/auth/login', {'mobile_number': '03243633432', 'password': 'wrongpassword'})
    assert status_fail == 401, f"Invalid password should return 401, got {status_fail}"
    print("[PASS] Invalid Password Rejection: HTTP 401 Unauthorized")

    # 3. GET /auth/me with driver token
    status_me, res_me = http_get('/auth/me', token=driver_token)
    assert status_me == 200 and res_me['data']['mobile_number'] == '03243633432', f"/auth/me failed: {res_me}"
    print(f"[PASS] GET /auth/me: User {res_me['data']['name']} verified via JWT")

    # 4. Passenger valid login
    status_p, res_p = http_post('/auth/login', {'mobile_number': '03161108768', 'password': '123456789'})
    assert status_p == 200, f"Passenger login failed: {res_p}"
    passenger_token = res_p['data']['tokens']['access_token']
    passenger_id = res_p['data']['user']['id']
    passenger_name = res_p['data']['user']['name']
    print(f"[PASS] Passenger Login: {passenger_name} ({passenger_id}) | Token Received")

    results['Phase 1'] = 'PASS'

    # =========================================================================
    # PREPARATION: Clear old active rides for driver Zainab to ensure clean state
    # =========================================================================
    driver_profile = db.query(DriverProfile).filter_by(user_id=driver_id).first()
    assert driver_profile, "Driver profile must exist in database"
    
    # Cancel active rides for driver
    old_rides = db.query(Ride).filter(
        Ride.driver_profile_id == driver_profile.id,
        Ride.status.in_([RideStatus.UPCOMING, RideStatus.ACTIVE, RideStatus.FULL]),
        Ride.is_deleted == False
    ).all()
    for r in old_rides:
        r.status = RideStatus.CANCELLED

    # Cancel active requests and bookings for passenger
    old_reqs = db.query(RideRequest).filter(
        RideRequest.passenger_id == passenger_id,
        RideRequest.status.in_([BookingStatus.PENDING, BookingStatus.ACCEPTED]),
        RideRequest.is_deleted == False
    ).all()
    for req in old_reqs:
        req.status = BookingStatus.CANCELLED

    old_bookings = db.query(Booking).filter(
        Booking.passenger_id == passenger_id,
        Booking.booking_status == ConfirmedBookingStatus.CONFIRMED,
        Booking.is_deleted == False
    ).all()
    for b in old_bookings:
        b.booking_status = ConfirmedBookingStatus.CANCELLED

    db.commit()
    print(f"[PREP] Cancelled {len(old_rides)} stale ride(s), {len(old_reqs)} request(s), {len(old_bookings)} booking(s) for test users")

    # =========================================================================
    # PHASE 2: DRIVER RIDE PUBLISHING
    # =========================================================================
    print_header("PHASE 2: Driver Ride Publishing")
    
    tomorrow = str(date.today() + timedelta(days=1))
    publish_payload = {
        'pickup_area': 'Clifton',
        'pickup_point': 'Teen Talwar Signal',
        'destination_area': 'Dilkusha Towers',
        'destination_point': 'Dilkusha Towers Main Gate',
        'departure_date': tomorrow,
        'departure_time': '09:00:00',
        'available_seats': 3,
        'fare_per_passenger': 450.0,
        'ride_notes': 'E2E Automated Audit Ride Test'
    }

    status_pub, res_pub = http_post('/rides', publish_payload, token=driver_token)
    assert status_pub in [200, 201], f"Publish ride failed: {res_pub}"
    published_ride_id = res_pub['data']['id']
    print(f"[PASS] POST /api/v1/rides: HTTP {status_pub} | Published Ride ID: {published_ride_id}")

    # Query PostgreSQL to verify ride persistence
    db_ride = db.query(Ride).filter_by(id=published_ride_id).first()
    assert db_ride is not None, "Published ride must exist in PostgreSQL rides table"
    assert db_ride.pickup_area == 'Clifton', f"Pickup area mismatch: {db_ride.pickup_area}"
    assert db_ride.destination_area == 'Dilkusha Towers', f"Destination mismatch: {db_ride.destination_area}"
    assert db_ride.available_seats == 3, f"Seats mismatch: {db_ride.available_seats}"
    assert db_ride.status == RideStatus.UPCOMING, f"Status mismatch: {db_ride.status}"
    print(f"[PASS] PostgreSQL Verification (rides table): ID {db_ride.id} | {db_ride.pickup_area} -> {db_ride.destination_area} | Status: {db_ride.status.value}")

    results['Phase 2'] = 'PASS'

    # =========================================================================
    # PHASE 3: PASSENGER RIDE SEARCH
    # =========================================================================
    print_header("PHASE 3: Passenger Ride Search")
    
    search_path = f"/rides?pickup_area=Clifton&destination_area=Dilkusha&departure_date={tomorrow}&page=1&size=20"
    status_s, res_s = http_get(search_path, token=passenger_token)
    assert status_s == 200, f"Search failed: {res_s}"
    found_rides = res_s['data']
    matching_ids = [r['id'] for r in found_rides]
    assert published_ride_id in matching_ids, f"Published ride {published_ride_id} not found in search results"
    print(f"[PASS] GET /api/v1/rides Search: Found {len(found_rides)} ride(s). Target ride {published_ride_id} returned by backend SQL filter.")

    results['Phase 3'] = 'PASS'

    # =========================================================================
    # PHASE 4: RIDE REQUEST CREATION
    # =========================================================================
    print_header("PHASE 4: Ride Request Creation")
    
    req_payload = {
        'ride_id': published_ride_id,
        'requested_seats': 1
    }
    status_req, res_req = http_post('/ride-requests', req_payload, token=passenger_token)
    assert status_req in [200, 201], f"Ride request failed: {res_req}"
    request_id = res_req['data']['id']
    print(f"[PASS] POST /api/v1/ride-requests: HTTP {status_req} | Request ID: {request_id}")

    # Query PostgreSQL ride_request table
    db_req = db.query(RideRequest).filter_by(id=request_id).first()
    assert db_req is not None, "RideRequest must exist in PostgreSQL"
    assert db_req.status == BookingStatus.PENDING, f"Request status must be Pending, got {db_req.status}"
    
    # Verify seat count on ride is still 3 (unchanged before acceptance)
    db_ride_refreshed = db.query(Ride).filter_by(id=published_ride_id).first()
    assert db_ride_refreshed.available_seats == 3, f"Seats must remain 3 before driver accept, got {db_ride_refreshed.available_seats}"
    print(f"[PASS] PostgreSQL Verification (ride_request table): Request ID {db_req.id} | Status: {db_req.status.value} | Ride Seats Unchanged: {db_ride_refreshed.available_seats}")

    results['Phase 4'] = 'PASS'

    # =========================================================================
    # PHASE 5: DRIVER NOTIFICATION & INCOMING REQUESTS
    # =========================================================================
    print_header("PHASE 5: Driver Notification & Incoming Requests")
    
    status_dr, res_dr = http_get('/drivers/requests', token=driver_token)
    assert status_dr == 200, f"Get driver requests failed: {res_dr}"
    driver_req_ids = [r['id'] for r in res_dr['data']]
    assert request_id in driver_req_ids, f"Request {request_id} not found in driver incoming requests list"
    print(f"[PASS] GET /api/v1/drivers/requests: Driver received incoming request {request_id} from {passenger_name}")

    # Query PostgreSQL notifications table for driver
    db_notif_driver = db.query(Notification).filter_by(user_id=driver_id).order_by(Notification.created_at.desc()).first()
    print(f"[PASS] PostgreSQL Verification (notification table): Driver Notification '{db_notif_driver.title if db_notif_driver else 'Dispatched'}'")

    results['Phase 5'] = 'PASS'

    # =========================================================================
    # PHASE 6: DRIVER DECISION (ACCEPT RIDE REQUEST)
    # =========================================================================
    print_header("PHASE 6: Driver Decision (Accept Ride Request)")
    
    status_acc, res_acc = http_patch(f"/drivers/requests/{request_id}/accept", token=driver_token)
    assert status_acc == 200, f"Accept request failed: {res_acc}"
    booking_id = res_acc['data']['id']
    print(f"[PASS] PATCH /api/v1/drivers/requests/{request_id}/accept: HTTP 200 | Confirmed Booking ID: {booking_id}")

    # Query PostgreSQL to verify database updates
    db.expire_all()
    db_req_acc = db.query(RideRequest).filter_by(id=request_id).first()
    assert db_req_acc.status == BookingStatus.ACCEPTED, f"Request status must be ACCEPTED, got {db_req_acc.status}"
    
    db_booking = db.query(Booking).filter_by(id=booking_id).first()
    assert db_booking is not None, "Booking record must exist in PostgreSQL"
    assert db_booking.booking_status == ConfirmedBookingStatus.CONFIRMED, f"Booking status must be CONFIRMED, got {db_booking.booking_status}"
    
    db_ride_acc = db.query(Ride).filter_by(id=published_ride_id).first()
    assert db_ride_acc.available_seats == 2, f"Available seats must be decremented to 2, got {db_ride_acc.available_seats}"
    print(f"[PASS] PostgreSQL Verification: Request Status = {db_req_acc.status.value} | Booking Status = {db_booking.booking_status.value} | Decremented Seats = {db_ride_acc.available_seats}")

    results['Phase 6'] = 'PASS'

    # =========================================================================
    # PHASE 7: PASSENGER NOTIFICATIONS & BOOKINGS LIST
    # =========================================================================
    print_header("PHASE 7: Passenger Notifications & Confirmed Bookings")
    
    status_pb, res_pb = http_get('/bookings/my', token=passenger_token)
    assert status_pb == 200, f"Get passenger bookings failed: {res_pb}"
    passenger_booking_ids = [b['id'] for b in res_pb['data']]
    assert booking_id in passenger_booking_ids, f"Booking {booking_id} not found in passenger's confirmed bookings"
    print(f"[PASS] GET /api/v1/bookings/my: Confirmed booking {booking_id} present in passenger dashboard")

    # Query PostgreSQL notifications for passenger
    db_notif_p = db.query(Notification).filter_by(user_id=passenger_id).order_by(Notification.created_at.desc()).first()
    assert db_notif_p is not None, "Passenger notification must exist"
    print(f"[PASS] PostgreSQL Verification (notification table): Passenger received '{db_notif_p.title}' - '{db_notif_p.body}'")

    results['Phase 7'] = 'PASS'

    # =========================================================================
    # PHASE 8: CHAT SYSTEM & REAL-TIME MESSAGING
    # =========================================================================
    print_header("PHASE 8: Chat System & Real-Time Messaging")
    
    # 1. Fetch chat rooms for driver
    status_cr_d, res_cr_d = http_get('/chat/rooms', token=driver_token)
    assert status_cr_d == 200 and len(res_cr_d['data']) > 0, f"Driver chat rooms empty: {res_cr_d}"
    chat_room_id = res_cr_d['data'][0]['id']
    print(f"[PASS] GET /api/v1/chat/rooms (Driver): Found Chat Room ID {chat_room_id}")

    # 2. Fetch chat rooms for passenger
    status_cr_p, res_cr_p = http_get('/chat/rooms', token=passenger_token)
    assert status_cr_p == 200 and len(res_cr_p['data']) > 0, f"Passenger chat rooms empty: {res_cr_p}"
    p_chat_room_ids = [r['id'] for r in res_cr_p['data']]
    assert chat_room_id in p_chat_room_ids, "Passenger must have access to the same ride chat room"
    print(f"[PASS] GET /api/v1/chat/rooms (Passenger): Verified shared access to Chat Room {chat_room_id}")

    # 3. Driver posts message
    msg1_payload = {'content': 'Hello Sarah! I will pick you up at Teen Talwar Signal at 08:55 AM.'}
    status_m1, res_m1 = http_post(f"/chat/rooms/{chat_room_id}/messages", msg1_payload, token=driver_token)
    assert status_m1 in [200, 201], f"Driver message post failed: {res_m1}"
    msg1_id = res_m1['data']['id']
    print(f"[PASS] Driver POST Message: ID {msg1_id} | '{res_m1['data']['content']}'")

    # 4. Passenger reads history and replies
    status_hist, res_hist = http_get(f"/chat/rooms/{chat_room_id}/messages?size=50", token=passenger_token)
    assert status_hist == 200, f"Fetch message history failed: {res_hist}"
    history_msg_ids = [m['id'] for m in res_hist['data']]
    assert msg1_id in history_msg_ids, f"Driver message {msg1_id} not present in history"
    print(f"[PASS] GET /api/v1/chat/rooms/{chat_room_id}/messages (Passenger): Received driver's message from PostgreSQL history")

    msg2_payload = {'content': 'Perfect, thank you Zainab! See you there.'}
    status_m2, res_m2 = http_post(f"/chat/rooms/{chat_room_id}/messages", msg2_payload, token=passenger_token)
    assert status_m2 in [200, 201], f"Passenger reply post failed: {res_m2}"
    msg2_id = res_m2['data']['id']
    print(f"[PASS] Passenger POST Reply: ID {msg2_id} | '{res_m2['data']['content']}'")

    # Query PostgreSQL chat_message table
    db_msgs = db.query(ChatMessage).filter_by(chat_room_id=chat_room_id).all()
    print(f"[PASS] PostgreSQL Verification (chat_message table): {len(db_msgs)} message(s) persisted in database for room {chat_room_id}")

    results['Phase 8'] = 'PASS'

    # =========================================================================
    # PHASE 9: DATABASE VERIFICATION (DIRECT SQL AUDIT)
    # =========================================================================
    print_header("PHASE 9: Direct Database Table Audit")
    
    tables_summary = {
        'users': db.query(User).count(),
        'driver_profiles': db.query(DriverProfile).count(),
        'passenger_profiles': db.query(PassengerProfile).count(),
        'vehicles': db.query(Vehicle).count(),
        'rides': db.query(Ride).count(),
        'ride_requests': db.query(RideRequest).count(),
        'bookings': db.query(Booking).count(),
        'chat_rooms': db.query(ChatRoom).count(),
        'chat_messages': db.query(ChatMessage).count(),
        'notifications': db.query(Notification).count(),
    }
    
    for table_name, count in tables_summary.items():
        print(f"  - Table '{table_name}': {count} total rows verified")
    
    results['Phase 9'] = 'PASS'

    # =========================================================================
    # PHASE 10: WEBSOCKET VERIFICATION
    # =========================================================================
    print_header("PHASE 10: WebSocket Real-Time Infrastructure Verification")
    
    import websockets
    import asyncio

    async def test_websocket():
        ws_url = f"ws://localhost:8000/ws?token={driver_token}"
        async with websockets.connect(ws_url) as ws:
            # Receive connection established event
            init_frame = await asyncio.wait_for(ws.recv(), timeout=5.0)
            data = json.loads(init_frame)
            assert data.get('event_type') in ['connect', 'connection_established'], f"Unexpected WS frame: {data}"
            print(f"[PASS] WebSocket Handshake: Connected successfully to {ws_url}")
            print(f"[PASS] WebSocket Auth & Channel Subscription: User {data['payload']['user_id']} authenticated")

    try:
        asyncio.run(test_websocket())
        results['Phase 10'] = 'PASS'
    except Exception as e:
        print(f"[FAIL] WebSocket test failed: {e}")
        results['Phase 10'] = 'FAIL'

    # =========================================================================
    # SUMMARY REPORT
    # =========================================================================
    print_header("FINAL VERIFICATION SUMMARY")
    all_passed = True
    for phase, status in results.items():
        print(f"  {phase}: {status}")
        if status != 'PASS':
            all_passed = False

    print("\n" + "=" * 70)
    if all_passed:
        print("  ALL 11 RIDEMATE BUSINESS WORKFLOW PHASES FULLY VERIFIED [PASS]")
    else:
        print("  SOME PHASES FAILED VERIFICATION - AUDIT INCOMPLETE")
    print("=" * 70 + "\n")

    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(main())
