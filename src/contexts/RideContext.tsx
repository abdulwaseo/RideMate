import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

// Reusable interfaces for Sprint 5 lifecycle coordinating
export interface Driver {
  name: string;
  avatar?: string;
  rating: number;
  officeName?: string;
  vehicleType: 'Car' | 'Bike';
  vehicleModel: string;
  vehicleRegistrationNumber: string;
  mobileNumber: string;
}

export interface Ride {
  id: string;
  driverId: string; // Driver's mobile number matching auth context
  driver: Driver;
  pickupArea: string;
  destination: string;
  meetingPoint: string;
  date: string;
  departureTime: string;
  availableSeats: number;
  totalSeats: number;
  farePerPassenger: number;
  description?: string;
  estimatedDuration: string;
  status: 'Upcoming' | 'Active' | 'Full' | 'Completed' | 'Cancelled';
}

export interface BookingRequest {
  id: string;
  rideId: string;
  ride: Ride;
  passengerId: string; // Passenger's mobile number matching auth context
  passengerName: string;
  passengerRating: number;
  requestedSeats: number;
  officeName: string;
  requestTime: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';
  requestDate: string;
}

export interface PassengerHistoryEntry {
  id: string;
  route: string;
  date: string;
  driverName: string;
  fare: number;
  status: 'Completed' | 'Cancelled' | 'Rejected';
}

export interface SearchFilters {
  pickupArea: string;
  destination: string;
  date: string;
  departureTime: string;
  vehicleType: 'Car' | 'Bike' | 'All';
  minSeats: number;
  minRating: number;
}

interface RideContextType {
  rides: Ride[];
  driverRides: Ride[];
  bookingRequests: BookingRequest[];
  isLoading: boolean;
  publishRide: (driverMobile: string, driverName: string, driverOffice: string, vehicleType: 'Car' | 'Bike', vehicleModel: string, vehiclePlate: string, rideData: Omit<Ride, 'id' | 'driverId' | 'driver' | 'status' | 'totalSeats' | 'estimatedDuration'>) => Promise<boolean>;
  editRide: (rideId: string, rideData: Partial<Omit<Ride, 'id' | 'driverId' | 'driver' | 'status' | 'totalSeats' | 'estimatedDuration'>>) => Promise<boolean>;
  cancelRide: (rideId: string) => Promise<boolean>;
  completeRide: (rideId: string) => Promise<boolean>;
  createBookingRequest: (passengerMobile: string, passengerName: string, passengerRating: number, passengerOffice: string, rideId: string, requestedSeats?: number) => Promise<boolean>;
  cancelBookingRequest: (requestId: string) => Promise<boolean>;
  acceptBookingRequest: (requestId: string) => Promise<boolean>;
  rejectBookingRequest: (requestId: string) => Promise<boolean>;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [driverRides, setDriverRides] = useState<Ride[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const mapRide = (r: any): Ride => ({
    id: r.id,
    driverId: r.driver_summary?.mobile_number || r.driver?.mobile_number || r.driver_id || '',
    driver: {
      name: r.driver_summary?.name || r.driver?.name || 'Driver',
      rating: r.driver_summary?.rating || r.driver?.rating || 4.8,
      officeName: r.driver_summary?.office_name || r.driver?.office_name || 'Dilkusha Towers',
      vehicleType: (r.vehicle_summary?.vehicle_type || r.vehicle?.vehicle_type) === 'Bike' ? 'Bike' : 'Car',
      vehicleModel: r.vehicle_summary?.model || r.vehicle?.model || 'Vehicle',
      vehicleRegistrationNumber: r.vehicle_summary?.registration_number || r.vehicle?.registration_number || 'AAA-123',
      mobileNumber: r.driver_summary?.mobile_number || r.driver?.mobile_number || '',
    },
    pickupArea: r.pickup_area,
    destination: r.destination_area,
    meetingPoint: r.pickup_point || r.pickup_area,
    date: r.departure_date,
    departureTime: r.departure_time,
    availableSeats: r.available_seats ?? r.total_seats,
    totalSeats: r.total_seats || r.available_seats,
    farePerPassenger: r.fare_per_passenger,
    description: r.ride_notes || r.description,
    estimatedDuration: r.estimated_duration || '25 mins',
    status: r.status === 'Cancelled' || r.status === 'CANCELLED' ? 'Cancelled'
           : r.status === 'Completed' || r.status === 'COMPLETED' ? 'Completed'
           : r.status === 'Active' || r.status === 'ACTIVE' ? 'Active'
           : 'Upcoming',
  });

  const fetchRides = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/v1/rides', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        const rawRides = json.data || [];
        setRides(rawRides.map(mapRide));
      }
    } catch (err) {
      console.warn('[RideContext] Error fetching rides from backend:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDriverRides = useCallback(async () => {
    const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/rides/driver/rides', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const rawRides = json.data || [];
        setDriverRides(rawRides.map(mapRide));
      }
    } catch (err) {
      console.warn('[RideContext] Error fetching driver rides:', err);
    }
  }, []);

  // Shared mapper — works for both /ride-requests/my and /drivers/requests responses
  const mapRequestToBooking = (r: any): BookingRequest => ({
    id: r.id,
    rideId: r.ride_id || r.ride_summary?.id || '',
    ride: {
      id: r.ride_id || r.ride_summary?.id || '',
      driverId: '',
      driver: {
        name: 'Driver',
        rating: 4.8,
        officeName: '',
        vehicleType: 'Car' as const,
        vehicleModel: 'Vehicle',
        vehicleRegistrationNumber: '',
        mobileNumber: '',
      },
      pickupArea: r.ride_summary?.pickup_area || '',
      destination: r.ride_summary?.destination_area || '',
      meetingPoint: r.ride_summary?.pickup_area || '',
      date: r.ride_summary?.departure_date || '',
      departureTime: r.ride_summary?.departure_time || '',
      availableSeats: r.ride_summary?.available_seats || 0,
      totalSeats: r.ride_summary?.available_seats || 0,
      farePerPassenger: r.ride_summary?.fare_per_passenger || 0,
      estimatedDuration: '25 mins',
      status: 'Upcoming' as const,
    },
    passengerId: r.passenger_summary?.mobile_number || r.passenger_id || '',
    passengerName: r.passenger_summary?.name || 'Passenger',
    passengerRating: 4.9,
    requestedSeats: r.requested_seats || 1,
    officeName: '',
    requestTime: r.created_at || 'Just now',
    requestDate: r.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    status: (r.status === 'Pending' || r.status === 'PENDING') ? 'Pending'
          : (r.status === 'Accepted' || r.status === 'ACCEPTED') ? 'Accepted'
          : (r.status === 'Rejected' || r.status === 'REJECTED') ? 'Rejected'
          : (r.status === 'Cancelled' || r.status === 'CANCELLED') ? 'Cancelled'
          : 'Pending',
  });

  const fetchPassengerRequests = useCallback(async () => {
    const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
    if (!token) return [];
    try {
      const res = await fetch('http://localhost:8000/api/v1/ride-requests/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        return (json.data || []).map(mapRequestToBooking);
      }
    } catch (err) {
      console.warn('[RideContext] Error fetching passenger requests:', err);
    }
    return [];
  }, []);

  const fetchDriverIncomingRequests = useCallback(async () => {
    const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
    if (!token) return [];
    try {
      const res = await fetch('http://localhost:8000/api/v1/drivers/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        return (json.data || []).map(mapRequestToBooking);
      }
    } catch (err) {
      console.warn('[RideContext] Error fetching driver incoming requests:', err);
    }
    return [];
  }, []);

  const refreshAllRequests = useCallback(async () => {
    const [passengerReqs, driverReqs] = await Promise.all([
      fetchPassengerRequests(),
      fetchDriverIncomingRequests(),
    ]);
    // Merge, de-duplicate by id (driver's incoming may overlap with passenger's own)
    const merged = [...driverReqs];
    for (const req of passengerReqs) {
      if (!merged.some((r) => r.id === req.id)) merged.push(req);
    }
    setBookingRequests(merged);
  }, [fetchPassengerRequests, fetchDriverIncomingRequests]);

  useEffect(() => {
    fetchRides();
    fetchDriverRides();
    refreshAllRequests();
  }, [fetchRides, fetchDriverRides, refreshAllRequests]);


  const { subscribe } = useWebSocket();

  // Backend Real-Time WebSocket Booking Subscriptions
  useEffect(() => {
    const unsubReq = subscribe('booking_requested', (evt) => {
      const data = evt.payload;
      if (!data) return;
      setBookingRequests((prev) => {
        const id = data.id || data.request_id;
        if (prev.some((r) => r.id === id)) return prev;

        const rId = data.ride_id || data.ride?.id;
        const targetRide: Ride = rides.find((r) => r.id === rId) || {
          id: rId || 'ride-101',
          driverId: '+92 321 9876543',
          driver: { name: 'Driver', rating: 4.8, vehicleType: 'Car', vehicleModel: 'Sedan', vehicleRegistrationNumber: 'AAA-123', mobileNumber: '+92 321 9876543' },
          pickupArea: data.pickup_area || data.ride?.pickup_area || 'Gulshan-e-Iqbal',
          destination: data.destination_area || data.ride?.destination_area || 'Dilkusha Towers',
          meetingPoint: 'Near Pickup Signal',
          date: new Date().toISOString().split('T')[0],
          departureTime: '08:30 AM',
          availableSeats: 3,
          totalSeats: 4,
          farePerPassenger: 400,
          estimatedDuration: '25 mins',
          status: 'Upcoming',
        };

        const newReq: BookingRequest = {
          id: id,
          rideId: targetRide.id,
          ride: targetRide,
          passengerId: data.passenger_id || data.passenger?.id || data.passenger?.mobile_number || 'passenger-1',
          passengerName: data.passenger_name || data.passenger?.name || 'Passenger',
          passengerRating: 4.9,
          requestedSeats: 1,
          officeName: 'VentureDive',
          requestTime: 'Just now',
          requestDate: new Date().toISOString().split('T')[0],
          status: 'Pending',
        };

        return [newReq, ...prev];
      });
    });

    const unsubAcc = subscribe('booking_accepted', (evt) => {
      const data = evt.payload;
      if (!data) return;
      const reqId = data.request_id || data.id;
      setBookingRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: 'Accepted' } : r))
      );
      fetchRides();
    });

    const unsubRej = subscribe('booking_rejected', (evt) => {
      const data = evt.payload;
      if (!data) return;
      const reqId = data.request_id || data.id;
      setBookingRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: 'Rejected' } : r))
      );
    });

    const unsubCan = subscribe('booking_cancelled', (evt) => {
      const data = evt.payload;
      if (!data) return;
      const reqId = data.request_id || data.id;
      setBookingRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: 'Cancelled' } : r))
      );
    });

    return () => {
      unsubReq();
      unsubAcc();
      unsubRej();
      unsubCan();
    };
  }, [subscribe, rides, fetchRides]);

  // Central backend-driven booking life-cycle operators
  const publishRide = async (
    _driverMobile: string,
    _driverName: string,
    _driverOffice: string,
    _vehicleType: 'Car' | 'Bike',
    _vehicleModel: string,
    _vehiclePlate: string,
    rideData: Omit<Ride, 'id' | 'driverId' | 'driver' | 'status' | 'totalSeats' | 'estimatedDuration'>
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');

      // Format departure_time to HH:MM:SS
      let formattedTime = rideData.departureTime || '08:30:00';
      if (formattedTime.length === 5) {
        formattedTime = `${formattedTime}:00`;
      } else if (formattedTime.includes('AM') || formattedTime.includes('PM')) {
        const [timePart, modifier] = formattedTime.split(' ');
        let [hours, minutes] = timePart.split(':');
        let h = parseInt(hours, 10);
        if (modifier === 'PM' && h < 12) h += 12;
        if (modifier === 'AM' && h === 12) h = 0;
        formattedTime = `${String(h).padStart(2, '0')}:${minutes}:00`;
      }

      // Format departure_date to YYYY-MM-DD (must not be past)
      const todayStr = new Date().toISOString().split('T')[0];
      const departureDate = rideData.date && rideData.date >= todayStr ? rideData.date : todayStr;

      const payload = {
        pickup_area: rideData.pickupArea || 'Gulshan-e-Iqbal',
        pickup_point: rideData.meetingPoint || rideData.pickupArea || 'Pickup Landmark Gate',
        destination_area: rideData.destination || 'Dilkusha Towers',
        destination_point: rideData.destination || 'Dilkusha Towers Main Entrance',
        departure_date: departureDate,
        departure_time: formattedTime,
        available_seats: Number(rideData.availableSeats),
        fare_per_passenger: Number(rideData.farePerPassenger),
        ride_notes: rideData.description || null,
      };

      console.log('[RideContext] Sending POST /api/v1/rides payload:', JSON.stringify(payload, null, 2));

      const res = await fetch('http://localhost:8000/api/v1/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      console.log('[RideContext] POST /api/v1/rides response status:', res.status, res.statusText);
      const json = await res.json();
      console.log('[RideContext] POST /api/v1/rides response data:', JSON.stringify(json, null, 2));

      if (res.ok || res.status === 201) {
        await fetchRides();
        await fetchDriverRides();
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('[RideContext] Error publishing ride to backend:', err);
    }
    setIsLoading(false);
    return false;
  };

  const editRide = async (
    rideId: string,
    rideData: Partial<Omit<Ride, 'id' | 'driverId' | 'driver' | 'status' | 'totalSeats' | 'estimatedDuration'>>
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/v1/rides/${rideId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          pickup_area: rideData.pickupArea,
          destination_area: rideData.destination,
          meeting_point: rideData.meetingPoint,
          departure_date: rideData.date,
          departure_time: rideData.departureTime,
          fare_per_passenger: rideData.farePerPassenger,
          description: rideData.description,
        }),
      });

      if (res.ok) {
        await fetchRides();
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('[RideContext] Error editing ride:', err);
    }
    setIsLoading(false);
    return false;
  };

  const cancelRide = async (rideId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/v1/rides/${rideId}/cancel`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await fetchRides();
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('[RideContext] Error cancelling ride:', err);
    }
    setIsLoading(false);
    return false;
  };

  const completeRide = async (rideId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/v1/rides/${rideId}/complete`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await fetchRides();
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('[RideContext] Error completing ride:', err);
    }
    setIsLoading(false);
    return false;
  };

  const createBookingRequest = async (
    _passengerMobile: string,
    _passengerName: string,
    _passengerRating: number,
    _passengerOffice: string,
    rideId: string,
    requestedSeats = 1
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/v1/ride-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ride_id: rideId,
          requested_seats: requestedSeats,
        }),
      });

      const json = await res.json();
      console.log('[RideContext] POST /api/v1/ride-requests:', res.status, JSON.stringify(json));

      if (res.ok || res.status === 201) {
        await refreshAllRequests();
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('[RideContext] Error creating booking request:', err);
    }
    setIsLoading(false);
    return false;
  };

  const cancelBookingRequest = async (requestId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
      // Passenger cancels their own pending request via DELETE
      const res = await fetch(`http://localhost:8000/api/v1/ride-requests/${requestId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setBookingRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'Cancelled' } : r))
        );
        await refreshAllRequests();
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('[RideContext] Error cancelling booking request:', err);
    }
    setIsLoading(false);
    return false;
  };

  const acceptBookingRequest = async (requestId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/v1/drivers/requests/${requestId}/accept`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await refreshAllRequests();
        await fetchRides();
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('[RideContext] Error accepting booking request:', err);
    }
    setIsLoading(false);
    return false;
  };

  const rejectBookingRequest = async (requestId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/v1/drivers/requests/${requestId}/reject`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await refreshAllRequests();
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('[RideContext] Error rejecting booking request:', err);
    }
    setIsLoading(false);
    return false;
  };

  return (
    <RideContext.Provider
      value={{
        rides,
        driverRides,
        bookingRequests,
        isLoading,
        publishRide,
        editRide,
        cancelRide,
        completeRide,
        createBookingRequest,
        cancelBookingRequest,
        acceptBookingRequest,
        rejectBookingRequest,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};

export const useRide = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};
