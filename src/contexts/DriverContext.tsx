import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRide } from './RideContext';

// Forwarding interfaces
export type Ride = import('./RideContext').Ride;
export type PassengerRequest = import('./RideContext').BookingRequest;

interface DriverContextType {
  activeRide: Ride | null;
  requests: PassengerRequest[];
  rideHistory: Ride[];
  isLoading: boolean;
  publishRide: (rideData: Omit<Ride, 'id' | 'driverId' | 'driver' | 'status' | 'totalSeats' | 'estimatedDuration'> & { vehicleType: 'Car' | 'Bike'; vehicleModel: string }) => Promise<boolean>;
  editRide: (rideData: Partial<Omit<Ride, 'id' | 'driverId' | 'driver' | 'status' | 'totalSeats' | 'estimatedDuration'>>) => Promise<boolean>;
  cancelRide: () => Promise<boolean>;
  completeRide: () => Promise<boolean>;
  acceptRequest: (requestId: string) => Promise<boolean>;
  rejectRequest: (requestId: string) => Promise<boolean>;
  refreshAllData?: () => Promise<void>;
}

const DriverContext = createContext<DriverContextType | undefined>(undefined);

export const DriverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { 
    rides, 
    driverRides,
    bookingRequests, 
    isLoading,
    publishRide: centralPublish,
    editRide: centralEdit,
    cancelRide: centralCancel,
    completeRide: centralComplete,
    acceptBookingRequest,
    rejectBookingRequest,
    refreshAllData,
  } = useRide();

  // Active ride — use driverRides (fetched from /api/v1/rides/driver/rides)
  // Fall back to matching by mobile or driver.name against the general rides list.
  const activeRide = (
    driverRides.find((ride) => ride.status !== 'Completed' && ride.status !== 'Cancelled')
    || rides.find(
        (ride) =>
          (ride.driverId === (user?.mobileNumber || '') || ride.driver.name === (user?.name || '')) &&
          ride.status !== 'Completed' &&
          ride.status !== 'Cancelled'
      )
  ) || null;

  // History includes all completed or cancelled rides by this driver
  const rideHistory = driverRides.filter(
    (ride) => ride.status === 'Completed' || ride.status === 'Cancelled'
  );

  // Requests are booking requests made on the driver's active ride
  const requests = activeRide 
    ? bookingRequests.filter((req) => req.rideId === activeRide.id)
    : [];

  const publishRide = async (rideData: Omit<Ride, 'id' | 'driverId' | 'driver' | 'status' | 'totalSeats' | 'estimatedDuration'> & { vehicleType: 'Car' | 'Bike'; vehicleModel: string }): Promise<boolean> => {
    if (!user) return false;
    const { vehicleType, vehicleModel, ...rest } = rideData;
    return centralPublish(
      user.mobileNumber,
      user.name,
      user.officeName || '',
      vehicleType,
      vehicleModel,
      user.vehicleRegistrationNumber || '',
      rest
    );
  };

  const editRide = async (rideData: Partial<Omit<Ride, 'id' | 'driverId' | 'driver' | 'status' | 'totalSeats' | 'estimatedDuration'>>): Promise<boolean> => {
    if (!activeRide) return false;
    return centralEdit(activeRide.id, rideData);
  };

  const cancelRide = async (): Promise<boolean> => {
    if (!activeRide) return false;
    return centralCancel(activeRide.id);
  };
  const completeRide = async (): Promise<boolean> => {
    if (!activeRide) return false;
    return centralComplete(activeRide.id);
  };
  const acceptRequest = async (requestId: string): Promise<boolean> => {
    return acceptBookingRequest(requestId);
  };

  const rejectRequest = async (requestId: string): Promise<boolean> => {
    return rejectBookingRequest(requestId);
  };

  return (
    <DriverContext.Provider
      value={{
        activeRide,
        requests,
        rideHistory,
        isLoading,
        publishRide,
        editRide,
        cancelRide,
        completeRide,
        acceptRequest,
        rejectRequest,
        refreshAllData,
      }}
    >
      {children}
    </DriverContext.Provider>
  );
};

export const useDriver = () => {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return context;
};
export default DriverProvider;
