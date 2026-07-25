import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Car, 
  Trash2, 
  Edit, 
  Share2, 
  Users, 
  CheckCircle,
  X,
  DollarSign,
  Check
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { RideCard } from '../../components/driver/RideCard';
import { ConfirmationModal } from '../../components/driver/ConfirmationModal';
import { useDriver } from '../../hooks/useDriver';
import { publishRideSchema } from '../../utils/validation';
import type { PublishRideFormValues } from '../../utils/validation';

import { MapProvider, useMapContext } from '../../contexts/MapContext';
import { useTrackingContext } from '../../contexts/TrackingContext';
import { MapContainer } from '../../components/maps';
import { TrackingStatus, LocationPermissionDialog } from '../../components/tracking';
import { TrackingControls } from '../../components/tracking/TrackingControls';
import { TrackingStatusCard } from '../../components/tracking/TrackingStatusCard';
import { TrackingTimeline } from '../../components/tracking/TrackingTimeline';
import { ETAWidget } from '../../components/tracking/ETAWidget';
import { DistanceWidget } from '../../components/tracking/DistanceWidget';

const ActiveRideInner: React.FC = () => {
  const { activeRide, editRide, cancelRide, completeRide } = useDriver();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { trackingStatus, startDriverTracking, stopDriverTracking } = useMapContext();
  const { activeSession, etaData, driverLocation, isTracking } = useTrackingContext();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<PublishRideFormValues>({
    resolver: zodResolver(publishRideSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (activeRide) {
      reset({
        vehicleType: activeRide.driver.vehicleType,
        vehicleModel: activeRide.driver.vehicleModel,
        pickupArea: activeRide.pickupArea,
        destination: activeRide.destination,
        meetingPoint: activeRide.meetingPoint,
        date: activeRide.date,
        departureTime: activeRide.departureTime,
        availableSeats: activeRide.availableSeats,
        farePerPassenger: activeRide.farePerPassenger,
        description: activeRide.description || '',
      });
    }
  }, [activeRide, reset, showEditModal]);

  const handleCancelConfirm = async () => {
    setIsSubmitting(true);
    try {
      stopDriverTracking();
      const success = await cancelRide();
      if (success) {
        setShowCancelModal(false);
        navigate('/dashboard/driver');
      } else {
        setErrorMsg('Failed to cancel ride. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to cancel ride. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      stopDriverTracking();
      const success = await completeRide();
      if (success) {
        setShowCompleteModal(false);
        navigate('/dashboard/driver');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (values: PublishRideFormValues) => {
    setIsSubmitting(true);
    try {
      const success = await editRide({
        date: values.date,
        departureTime: values.departureTime,
        availableSeats: values.availableSeats,
        farePerPassenger: values.farePerPassenger,
        meetingPoint: values.meetingPoint,
        description: values.description || undefined,
      });

      if (success) {
        setShowEditModal(false);
        setSuccessMsg('Ride details updated successfully.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareClick = () => {
    alert('Ride sharing invitation link copied to clipboard.');
  };

  const toggleLocationBroadcast = () => {
    if (trackingStatus === 'tracking') {
      stopDriverTracking();
    } else {
      startDriverTracking(activeRide?.id);
    }
  };

  if (!activeRide) {
    return (
      <div className="space-y-8 text-left select-none">
        <PageHeader 
          title="Active Ride" 
          description="Manage your current carpool schedule, route passengers, or update departure settings."
        />
        
        <EmptyState 
          icon={Car}
          title="No Active Commute Route"
          description="You haven't published any shared drives for today's Dilkusha commute corridor yet."
          actionText="Publish Ride"
          onAction={() => navigate('/dashboard/driver/publish')}
          className="max-w-2xl mx-auto"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left select-none relative">
      <PageHeader 
        title="My Active Ride" 
        description="Your carpool corridor is published and matching with commuters heading to PECHS."
      />

      {successMsg && (
        <Card hoverEffect={false} className="p-4 border border-brand-primary/25 bg-brand-primary/10 text-brand-primaryLight text-sm max-w-2xl font-bold flex items-center gap-2">
          <CheckCircle className="h-4.5 w-4.5" />
          <span>{successMsg}</span>
        </Card>
      )}

      {errorMsg && (
        <Card hoverEffect={false} className="p-4 border border-red-500/25 bg-red-500/10 text-red-400 text-sm max-w-2xl font-semibold">
          {errorMsg}
        </Card>
      )}

      <LocationPermissionDialog />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Ride Card & Controls */}
        <div className="lg:col-span-6 space-y-6">
          <RideCard 
            ride={activeRide}
            actions={
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="glass"
                  size="sm"
                  leftIcon={<Share2 className="h-4 w-4" />}
                  onClick={handleShareClick}
                >
                  Share Ride
                </Button>
                <Button
                  variant="glass"
                  size="sm"
                  leftIcon={<Edit className="h-4 w-4" />}
                  onClick={() => setShowEditModal(true)}
                >
                  Edit Ride
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-brand-primary text-brand-bg hover:bg-brand-primaryLight font-bold"
                  leftIcon={<Check className="h-4 w-4" />}
                  onClick={() => setShowCompleteModal(true)}
                >
                  Complete Ride
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Ride
                </Button>
              </div>
            }
          />
        </div>

        {/* Right Column: Live GPS Tracking Map + Tracking Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-4 shadow-glass space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Live GPS Broadcast Map
              </h4>
              <button
                onClick={toggleLocationBroadcast}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md ${
                  trackingStatus === 'tracking'
                    ? 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                {trackingStatus === 'tracking' ? '⏹ Stop GPS Broadcast' : '▶ Start Live GPS Broadcast'}
              </button>
            </div>

            <MapContainer height="280px" />
            <TrackingStatus />
          </div>

          {/* Sprint 10C: Real-Time Tracking Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Ride Tracking</h4>

            {/* Tracking controls for driver */}
            {activeRide?.id && (
              <TrackingControls rideId={activeRide.id} session={activeSession} />
            )}

            {/* Status card */}
            <TrackingStatusCard
              session={activeSession}
              gpsAccuracy={driverLocation?.accuracy}
              wsConnected={true}
            />

            {/* ETA + Distance row */}
            {etaData && (
              <div className="grid grid-cols-2 gap-3">
                <ETAWidget etaData={etaData} />
                <DistanceWidget
                  remainingKm={etaData.remaining_distance_km}
                  totalKm={activeSession?.total_distance_km}
                />
              </div>
            )}

            {/* Phase Timeline */}
            {isTracking && (
              <TrackingTimeline currentStatus={activeSession?.current_status ?? null} />
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Cancellation */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Active Ride?"
        message="Are you sure you want to cancel this published commute corridor? Coworkers holding matching booking reservations will be notified immediately."
        confirmText="Confirm Cancellation"
        isLoading={isSubmitting}
      />

      {/* Confirmation Modal for Completion */}
      <ConfirmationModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={handleCompleteConfirm}
        title="Complete Active Ride?"
        message="Are you sure you have arrived at your destination and completed this commute corridor? All accepted coworkers bookings will be logged as successfully completed."
        confirmText="Complete Commute"
        isLoading={isSubmitting}
      />

      {/* Inline Modal for Edit Form */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          
          <div className="relative w-full max-w-lg z-10">
            <Card hoverEffect={false} className="border border-brand-border bg-brand-card shadow-glass p-6 sm:p-8 rounded-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/[0.02] border border-brand-border text-brand-textMuted hover:text-brand-text"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-brand-text">Edit Commute Route</h3>
                <p className="text-xs text-brand-textMuted mt-1">
                  Adjust scheduling or available space. Pickup zones and destinations cannot be updated once published.
                </p>
              </div>

              <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-3 opacity-60">
                  <Input label="Pickup Area" disabled={true} {...register('pickupArea')} />
                  <Input label="Destination" disabled={true} {...register('destination')} />
                </div>

                <Input
                  label="Meeting Stop Landmark"
                  placeholder="e.g. Opposite Disco Bakery"
                  error={errors.meetingPoint?.message}
                  disabled={isSubmitting}
                  {...register('meetingPoint')}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Commute Date"
                    type="date"
                    error={errors.date?.message}
                    disabled={isSubmitting}
                    {...register('date')}
                  />
                  <Input
                    label="Departure Time"
                    type="time"
                    error={errors.departureTime?.message}
                    disabled={isSubmitting}
                    {...register('departureTime')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Open Seats (1 to 6)"
                    type="number"
                    leftIcon={<Users className="h-4 w-4 text-brand-muted" />}
                    error={errors.availableSeats?.message}
                    disabled={isSubmitting}
                    {...register('availableSeats', { valueAsNumber: true })}
                  />
                  <Input
                    label="Fare per Seat (PKR)"
                    type="number"
                    leftIcon={<DollarSign className="h-4 w-4 text-brand-primary" />}
                    error={errors.farePerPassenger?.message}
                    disabled={isSubmitting}
                    {...register('farePerPassenger', { valueAsNumber: true })}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold tracking-wide text-brand-textMuted uppercase">
                    Description Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-3 bg-brand-surface border border-brand-border rounded-xl text-brand-text text-sm transition-all focus:outline-none placeholder:text-brand-muted/70 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 resize-none"
                    disabled={isSubmitting}
                    {...register('description')}
                  />
                </div>

                <div className="pt-4 flex gap-3 justify-end border-t border-brand-border/40">
                  <Button variant="glass" size="sm" type="button" onClick={() => setShowEditModal(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={!isValid || isSubmitting} isLoading={isSubmitting}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export const ActiveRide: React.FC = () => {
  return (
    <MapProvider>
      <ActiveRideInner />
    </MapProvider>
  );
};

export default ActiveRide;
