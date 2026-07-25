import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRide } from './RideContext';
import { getAuthToken } from '../utils/token';

// Forwarding interfaces
export type Ride = import('./RideContext').Ride;
export type BookingRequest = import('./RideContext').BookingRequest;
export type PassengerHistoryEntry = import('./RideContext').PassengerHistoryEntry;
export type SearchFilters = import('./RideContext').SearchFilters;

interface PassengerContextType {
  ridesList: Ride[];
  searchResults: Ride[];
  bookingRequests: BookingRequest[];
  rideHistory: PassengerHistoryEntry[];
  isLoading: boolean;
  searchRides: (filters: SearchFilters) => Promise<void>;
  createBookingRequest: (rideId: string) => Promise<boolean>;
  cancelBookingRequest: (requestId: string) => Promise<boolean>;
  refreshAllData?: () => Promise<void>;
}

const PassengerContext = createContext<PassengerContextType | undefined>(undefined);

/**
 * Maps a backend RideSummary (from GET /api/v1/rides) or RideResponse
 * (from GET /api/v1/rides/:id) into the frontend Ride shape.
 */
const mapSummaryToRide = (r: any): Ride => ({
  id: r.id,
  driverId: r.driver_summary?.mobile_number || r.driver?.mobile_number || '',
  driver: {
    name: r.driver_summary?.name || r.driver?.name || r.driver_name || 'Driver',
    rating: r.driver_summary?.rating || r.driver?.rating || 4.8,
    officeName: r.driver_summary?.office_name || r.driver?.office_name || 'Dilkusha Towers',
    vehicleType:
      (r.vehicle_summary?.vehicle_type || r.vehicle?.vehicle_type || r.vehicle_type) === 'Bike'
        ? 'Bike'
        : 'Car',
    vehicleModel: r.vehicle_summary?.model || r.vehicle?.model || 'Vehicle',
    vehicleRegistrationNumber:
      r.vehicle_summary?.registration_number || r.vehicle?.registration_number || '',
    mobileNumber: r.driver_summary?.mobile_number || r.driver?.mobile_number || '',
  },
  pickupArea: r.pickup_area,
  destination: r.destination_area,
  meetingPoint: r.pickup_point || r.pickup_area,
  date: r.departure_date,
  departureTime: r.departure_time,
  availableSeats: r.available_seats,
  totalSeats: r.total_seats || r.available_seats,
  farePerPassenger: r.fare_per_passenger,
  description: r.ride_notes || r.description,
  estimatedDuration: r.estimated_duration || '25 mins',
  status:
    r.status === 'Cancelled' || r.status === 'CANCELLED'
      ? 'Cancelled'
      : r.status === 'Completed' || r.status === 'COMPLETED'
      ? 'Completed'
      : r.status === 'Active' || r.status === 'ACTIVE'
      ? 'Active'
      : 'Upcoming',
});

export const PassengerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const {
    bookingRequests: centralRequests,
    createBookingRequest: centralCreateRequest,
    cancelBookingRequest: centralCancelRequest,
    refreshAllData,
  } = useRide();

  const [searchResults, setSearchResults] = useState<Ride[]>([]);
  const [ridesList, setRidesList] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const passengerId = user?.mobileNumber || '';

  const getToken = () => getAuthToken();

  // Initial load: fetch all upcoming rides from backend
  const fetchAllRides = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const res = await fetch('http://localhost:8000/api/v1/rides?page=1&size=50', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        const mapped = (json.data || []).map(mapSummaryToRide);
        setRidesList(mapped);
        setSearchResults(mapped);
      }
    } catch (err) {
      console.warn('[PassengerContext] Error fetching rides:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRides();
  }, [fetchAllRides]);

  // Booking requests submitted by this passenger
  const bookingRequests = centralRequests.filter((req) => {
    if (!passengerId) return false;
    const reqDigits = req.passengerId.replace(/\D/g, '');
    const userDigits = passengerId.replace(/\D/g, '');
    return req.passengerId === passengerId || (reqDigits.length > 0 && reqDigits === userDigits);
  });

  // Passenger ride history from completed/cancelled/rejected booking requests only
  const rideHistory: PassengerHistoryEntry[] = bookingRequests
    .filter(
      (req) =>
        req.status === 'Cancelled' ||
        req.status === 'Rejected' ||
        (req.status === 'Accepted' && req.ride.status === 'Completed')
    )
    .map((req) => ({
      id: req.id,
      route: `${req.ride.pickupArea} → ${req.ride.destination}`,
      date: req.ride.date,
      driverName: req.ride.driver.name,
      fare: req.ride.farePerPassenger * req.requestedSeats,
      status: (
        req.status === 'Accepted' && req.ride.status === 'Completed'
          ? 'Completed'
          : req.status === 'Rejected'
          ? 'Rejected'
          : 'Cancelled'
      ) as 'Completed' | 'Cancelled' | 'Rejected',
    }));

  /**
   * Call GET /api/v1/rides with backend query params.
   * The backend handles pickup_area, destination_area, departure_date,
   * vehicle_type, min_available_seats filtering natively.
   */
  const searchRides = async (filters: SearchFilters): Promise<void> => {
    setIsLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filters.pickupArea) params.append('pickup_area', filters.pickupArea);
      if (filters.destination) params.append('destination_area', filters.destination);
      if (filters.date) params.append('departure_date', filters.date);
      if (filters.vehicleType && filters.vehicleType !== 'All')
        params.append('vehicle_type', filters.vehicleType);
      if (filters.minSeats && filters.minSeats > 1)
        params.append('min_available_seats', String(filters.minSeats));
      params.append('page', '1');
      params.append('size', '50');

      console.log('[PassengerContext] Searching rides with params:', params.toString());

      const res = await fetch(`http://localhost:8000/api/v1/rides?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const json = await res.json();
        const mapped = (json.data || []).map(mapSummaryToRide);
        console.log(`[PassengerContext] Search returned ${mapped.length} rides`);
        setSearchResults(mapped);
      }
    } catch (err) {
      console.warn('[PassengerContext] Error searching rides:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createBookingRequest = async (rideId: string): Promise<boolean> => {
    if (!user) return false;
    return centralCreateRequest(
      user.mobileNumber,
      user.name,
      4.9,
      user.officeName || '',
      rideId,
      1 // 1 seat by default
    );
  };

  const cancelBookingRequest = async (requestId: string): Promise<boolean> => {
    return centralCancelRequest(requestId);
  };

  return (
    <PassengerContext.Provider
      value={{
        ridesList,
        searchResults,
        bookingRequests,
        rideHistory,
        isLoading,
        searchRides,
        createBookingRequest,
        cancelBookingRequest,
        refreshAllData,
      }}
    >
      {children}
    </PassengerContext.Provider>
  );
};

export const usePassenger = () => {
  const context = useContext(PassengerContext);
  if (!context) {
    throw new Error('usePassenger must be used within a PassengerProvider');
  }
  return context;
};
export default PassengerProvider;
