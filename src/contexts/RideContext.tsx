import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { getAuthToken, clearAuthToken } from '../utils/token';

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
  passengerMobileNumber?: string;
  passengerName: string;
  passengerRating: number;
  requestedSeats: number;
  officeName: string;
  requestTime: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' | 'Completed';
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
  refreshAllData: () => Promise<void>;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [driverRides, setDriverRides] = useState<Ride[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Ref-counter so concurrent async operations don't race on the shared flag.
  // isLoading stays true until ALL in-flight operations have finished.
  const loadingCount = useRef<number>(0);
  const startLoading = () => {
    loadingCount.current += 1;
    setIsLoading(true);
  };
  const stopLoading = () => {
    loadingCount.current = Math.max(0, loadingCount.current - 1);
    if (loadingCount.current === 0) setIsLoading(false);
  };

  const mapRide = (r: any): Ride => ({
    id: r.id,
    driverId: r.driver_summary?.mobile_number || r.driver?.mobile_number || r.driver_id || r.driver_name || '',
    driver: {
      name: r.driver_summary?.name || r.driver?.name || r.driver_name || 'Driver',
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
      startLoading();
      const token = getAuthToken();
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
      stopLoading();
    }
  }, []);

  const fetchDriverRides = useCallback(async () => {
    const token = getAuthToken();
    if (!token || user?.role !== 'driver') return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/rides/driver/rides', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) return;
      if (res.ok) {
        const json = await res.json();
        const rawRides = json.data || [];
        setDriverRides(rawRides.map(mapRide));
      }
    } catch (err) {
      console.warn('[RideContext] Error fetching driver rides:', err);
    }
  }, [user?.role]);

  // Shared mapper — works for both /ride-requests/my and /drivers/requests responses
  const mapRequestToBooking = (r: any): BookingRequest => ({
    id: r.id,
    rideId: r.ride_id || r.ride_summary?.id || '',
    ride: {
      id: r.ride_id || r.ride_summary?.id || '',
      driverId: r.ride_summary?.driver_id || '',
      driver: {
        name: r.ride_summary?.driver_name || 'Driver',
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
      status: (r.ride_summary?.status === 'Cancelled' || r.ride_summary?.status === 'CANCELLED') ? 'Cancelled'
            : (r.ride_summary?.status === 'Completed' || r.ride_summary?.status === 'COMPLETED') ? 'Completed'
            : (r.ride_summary?.status === 'Active' || r.ride_summary?.status === 'ACTIVE') ? 'Active'
            : (r.ride_summary?.status === 'Full' || r.ride_summary?.status === 'FULL') ? 'Full'
            : 'Upcoming',
    },
    passengerId: r.passenger_id || r.passenger_summary?.id || r.passenger_summary?.mobile_number || '',
    passengerMobileNumber: r.passenger_summary?.mobile_number || '',
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
    const token = getAuthToken();
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
    const token = getAuthToken();
    if (!token || user?.role !== 'driver') return [];
    try {
      const res = await fetch('http://localhost:8000/api/v1/drivers/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) return [];
      if (res.ok) {
        const json = await res.json();
        return (json.data || []).map(mapRequestToBooking);
      }
    } catch (err) {
      console.warn('[RideContext] Error fetching driver incoming requests:', err);
    }
    return [];
  }, [user?.role]);

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

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchRides(),
      fetchDriverRides(),
      refreshAllRequests(),
    ]);
  }, [fetchRides, fetchDriverRides, refreshAllRequests]);

  useEffect(() => {
    fetchRides();
    fetchDriverRides();
    refreshAllRequests();
  }, [fetchRides, fetchDriverRides, refreshAllRequests]);

  // Keep a stable ref to rides so WS handlers can read current rides
  // without needing rides in their dependency array (avoids subscription churn).
  const ridesRef = useRef<Ride[]>(rides);
  useEffect(() => { ridesRef.current = rides; }, [rides]);


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
        const targetRide: Ride = ridesRef.current.find((r) => r.id === rId) || {
          id: rId || '',
          driverId: data.ride?.driver?.mobile_number || data.ride?.driver_summary?.mobile_number || '',
          driver: {
            name: data.ride?.driver?.name || data.ride?.driver_summary?.name || 'Driver',
            rating: data.ride?.driver?.rating || data.ride?.driver_summary?.rating || 5.0,
            vehicleType: (data.ride?.vehicle?.vehicle_type || 'Car') as 'Car' | 'Bike',
            vehicleModel: data.ride?.vehicle?.model || 'Vehicle',
            vehicleRegistrationNumber: data.ride?.vehicle?.registration_number || '',
            mobileNumber: data.ride?.driver?.mobile_number || '',
          },
          pickupArea: data.pickup_area || data.ride?.pickup_area || '',
          destination: data.destination_area || data.ride?.destination_area || '',
          meetingPoint: data.ride?.meeting_point || data.pickup_area || '',
          date: data.ride?.departure_date || new Date().toISOString().split('T')[0],
          departureTime: data.ride?.departure_time || '',
          availableSeats: data.ride?.available_seats ?? 1,
          totalSeats: data.ride?.total_seats ?? 1,
          farePerPassenger: data.ride?.fare_per_passenger ?? 0,
          estimatedDuration: data.ride?.estimated_duration || '',
          status: 'Upcoming',
        };

        const newReq: BookingRequest = {
          id: id,
          rideId: targetRide.id,
          ride: targetRide,
          passengerId: data.passenger_id || data.passenger?.id || data.passenger?.mobile_number || '',
          passengerName: data.passenger_name || data.passenger_summary?.name || data.passenger?.name || 'Passenger',
          passengerRating: data.passenger_rating || data.passenger_summary?.rating || 5.0,
          requestedSeats: data.requested_seats || 1,
          officeName: data.passenger_summary?.office_name || data.office_name || '',
          requestTime: data.created_at ? new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          requestDate: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
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
      const rideId = data.ride_id;
      setBookingRequests((prev) =>
        prev.map((r) =>
          (reqId && r.id === reqId) || (rideId && r.rideId === rideId)
            ? { ...r, status: 'Cancelled' }
            : r
        )
      );
      fetchRides();
    });

    const unsubRideUpd = subscribe('ride_update', () => {
      fetchRides();
      fetchDriverRides();
      refreshAllRequests();
    });

    return () => {
      unsubReq();
      unsubAcc();
      unsubRej();
      unsubCan();
      unsubRideUpd();
    };
  }, [subscribe, fetchRides, fetchDriverRides, refreshAllRequests]);

  // Central backend-driven booking life-cycle operator
  const publishRide = async (
    _driverMobile: string,
    _driverName: string,
    _driverOffice: string,
    _vehicleType: 'Car' | 'Bike',
    _vehicleModel: string,
    _vehiclePlate: string,
    rideData: Omit<Ride, 'id' | 'driverId' | 'driver' | 'status' | 'totalSeats' | 'estimatedDuration'>
  ): Promise<boolean> => {
    startLoading();
    try {
      const token = getAuthToken();

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
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const departureDate = rideData.date && rideData.date >= todayStr ? rideData.date : todayStr;

      const payload = {
        pickup_area: rideData.pickupArea,
        pickup_point: rideData.meetingPoint || rideData.pickupArea,
        destination_area: rideData.destination,
        destination_point: rideData.destination,
        departure_date: departureDate,
        departure_time: formattedTime,
        available_seats: Number(rideData.availableSeats),
        fare_per_passenger: Number(rideData.farePerPassenger),
        ride_notes: rideData.description || null,
      };

      const res = await fetch('http://localhost:8000/api/v1/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        console.warn('[RideContext] Session expired (401 Unauthorized). Clearing stale tokens.');
        clearAuthToken();
        window.location.href = '/login';
        return false;
      }

      if (res.status === 409) {
        console.warn('[RideContext] Active ride already exists on backend (409 Conflict). Synchronizing driver rides...');
        await fetchDriverRides();
        return false;
      }

      if (res.ok || res.status === 201) {
        await fetchRides();
        await fetchDriverRides();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[RideContext] Error publishing ride to backend:', err);
      return false;
    } finally {
      stopLoading();
    }
  };

  const editRide = async (
    rideId: string,
    rideData: Partial<Omit<Ride, 'id' | 'driverId' | 'driver' | 'status' | 'totalSeats' | 'estimatedDuration'>>
  ): Promise<boolean> => {
    startLoading();
    try {
      const token = getAuthToken();
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
        return true;
      }
      return false;
    } catch (err) {
      console.error('[RideContext] Error editing ride:', err);
      return false;
    } finally {
      stopLoading();
    }
  };

  const cancelRide = async (rideId: string): Promise<boolean> => {
    startLoading();
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:8000/api/v1/rides/${rideId}/cancel`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await fetchRides();
        await fetchDriverRides();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[RideContext] Error cancelling ride:', err);
      return false;
    } finally {
      stopLoading();
    }
  };

  const completeRide = async (rideId: string): Promise<boolean> => {
    startLoading();
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:8000/api/v1/rides/${rideId}/complete`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await fetchRides();
        await fetchDriverRides();
        await refreshAllRequests();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[RideContext] Error completing ride:', err);
      return false;
    } finally {
      stopLoading();
    }
  };

  const createBookingRequest = async (
    _passengerMobile: string,
    _passengerName: string,
    _passengerRating: number,
    _passengerOffice: string,
    rideId: string,
    requestedSeats = 1
  ): Promise<boolean> => {
    startLoading();
    try {
      const token = getAuthToken();
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

      if (res.ok || res.status === 201) {
        await refreshAllRequests();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[RideContext] Error creating booking request:', err);
      return false;
    } finally {
      stopLoading();
    }
  };

  const cancelBookingRequest = async (requestId: string): Promise<boolean> => {
    startLoading();
    try {
      const token = getAuthToken();
      // Passenger cancels their own pending or accepted request via DELETE
      const res = await fetch(`http://localhost:8000/api/v1/ride-requests/${requestId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setBookingRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'Cancelled' } : r))
        );
        await refreshAllRequests();
        await fetchRides();
        return true;
      }

      const json = await res.json().catch(() => null);
      if (json?.detail) {
        console.warn('[RideContext] Cannot cancel booking request:', json.detail);
      }
      return false;
    } catch (err) {
      console.error('[RideContext] Error cancelling booking request:', err);
      return false;
    } finally {
      stopLoading();
    }
  };

  const acceptBookingRequest = async (requestId: string): Promise<boolean> => {
    startLoading();
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:8000/api/v1/drivers/requests/${requestId}/accept`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await refreshAllRequests();
        await fetchRides();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[RideContext] Error accepting booking request:', err);
      return false;
    } finally {
      stopLoading();
    }
  };

  const rejectBookingRequest = async (requestId: string): Promise<boolean> => {
    startLoading();
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:8000/api/v1/drivers/requests/${requestId}/reject`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await refreshAllRequests();
        return true;
      }
      return false;
    } catch (err) {
      console.error('[RideContext] Error rejecting booking request:', err);
      return false;
    } finally {
      stopLoading();
    }
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
        refreshAllData,
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
