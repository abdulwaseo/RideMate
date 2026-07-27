import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Car, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useDriver } from '../../hooks/useDriver';
import { publishRideSchema } from '../../utils/validation';
import type { PublishRideFormValues } from '../../utils/validation';

import { MapProvider, useMapContext } from '../../contexts/MapContext';
import { MapContainer, LocationSearchInput, FareEstimateCard } from '../../components/maps';
import type { LocationData } from '../../types/location';

const PublishRideFormInner: React.FC = () => {
  const { user } = useAuth();
  const { activeRide, publishRide } = useDriver();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    selectedPickup,
    setSelectedPickup,
    selectedDestination,
    setSelectedDestination,
    calculateRoute,
    currentRoute,
  } = useMapContext();

  const now = new Date();
  const getLocalDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const defaultDeparture = `${String(now.getHours() < 23 ? now.getHours() + 1 : 9).padStart(2, '0')}:00`;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm<PublishRideFormValues>({
    resolver: zodResolver(publishRideSchema),
    mode: 'onChange',
    defaultValues: {
      vehicleType: user?.vehicleType || 'Car',
      vehicleModel: user?.vehicleModel || '',
      pickupArea: '',
      destination: '',
      meetingPoint: '',
      date: getLocalDateStr(now),
      departureTime: defaultDeparture,
      availableSeats: 1,
      farePerPassenger: 0,
      description: '',
    }
  });

  // Auto sync suggested fare when route updates
  React.useEffect(() => {
    if (currentRoute?.fare_estimate) {
      setValue('farePerPassenger', currentRoute.fare_estimate.recommended_fare, { shouldValidate: true });
    }
  }, [currentRoute, setValue]);

  const handlePickupSelect = (location: LocationData) => {
    setSelectedPickup(location);
    setValue('pickupArea', location.name || location.formatted_address, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    if (selectedDestination) {
      calculateRoute(location, selectedDestination);
    }
  };

  const handleDestinationSelect = (location: LocationData) => {
    setSelectedDestination(location);
    setValue('destination', location.name || location.formatted_address, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    if (selectedPickup) {
      calculateRoute(selectedPickup, location);
    }
  };

  const onSubmit = async (values: PublishRideFormValues) => {
    if (!values.farePerPassenger || values.farePerPassenger <= 0) {
      setErrorMsg('Fare per passenger must be greater than 0 PKR.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const success = await publishRide({
        vehicleType: values.vehicleType,
        vehicleModel: user?.vehicleModel || values.vehicleModel || 'Registered Vehicle',
        pickupArea: values.pickupArea,
        destination: values.destination,
        meetingPoint: values.meetingPoint || 'Central Landmark',
        date: values.date,
        departureTime: values.departureTime,
        availableSeats: values.availableSeats,
        farePerPassenger: values.farePerPassenger,
        description: values.description || undefined,
      });

      if (success) {
        navigate('/dashboard/driver/active-ride');
      } else {
        setErrorMsg('Could not publish ride. Please verify parameters.');
        trigger(['pickupArea', 'destination']);
      }
    } catch (err) {
      setErrorMsg('Failed to publish the ride. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeRide) {
    return (
      <div className="space-y-8 text-left select-none">
        <PageHeader 
          title="Publish Ride" 
          description="Offer empty vehicle seats to verified coworkers commuting to Dilkusha Towers."
        />

        <Card hoverEffect={false} className="max-w-xl mx-auto border border-brand-accent/30 bg-sky-50/80 p-8 text-center space-y-6">
          <div className="mx-auto p-4 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent w-fit animate-pulse">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-brand-text">Active Ride Block</h3>
            <p className="text-sm text-brand-textMuted max-w-sm mx-auto leading-relaxed">
              You already have an active ride published. Drivers are restricted to hosting exactly one active commute corridor at a time.
            </p>
          </div>

          <Card hoverEffect={false} className="border border-brand-border/40 p-4 text-xs text-brand-textMuted text-left bg-white/[0.01]">
            <span className="font-bold text-brand-text uppercase block mb-1">Current Active Corridor:</span>
            {activeRide.pickupArea} → {activeRide.destination} ({activeRide.departureTime})
          </Card>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/dashboard/driver/active-ride" className="w-full sm:w-auto">
              <Button variant="primary" size="sm" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View Active Ride
              </Button>
            </Link>
            <Link to="/dashboard/driver" className="w-full sm:w-auto">
              <Button variant="glass" size="sm" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left select-none">
      <PageHeader 
        title="Publish Ride" 
        description="Fill empty seats in your vehicle with verified staff commuting along PECHS corridor."
      />

      {errorMsg && (
        <Card hoverEffect={false} className="p-4 border border-red-500/25 bg-red-500/10 text-red-400 text-sm max-w-2xl font-semibold">
          {errorMsg}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Route Controls */}
        <div className="lg:col-span-6 space-y-6">
          <Card hoverEffect={false} className="border border-brand-border p-6 sm:p-8 bg-brand-card shadow-glass">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Section 1: Route details with Places Autocomplete */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border/40 pb-1.5 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Commute Path & Route Selection</span>
                </h4>

                <div className="space-y-4">
                  <LocationSearchInput
                    label="Pickup Location"
                    placeholder="Search pickup area (e.g., Gulshan Block 13, Clifton)..."
                    type="pickup"
                    value={selectedPickup?.formatted_address || watch('pickupArea')}
                    onSelectLocation={handlePickupSelect}
                    onClear={() => {
                      setSelectedPickup(null);
                      setValue('pickupArea', '', { shouldValidate: true });
                    }}
                  />
                  
                  <LocationSearchInput
                    label="Destination Point"
                    placeholder="Search destination (e.g., Dilkusha Towers, Karachi)..."
                    type="destination"
                    value={selectedDestination?.formatted_address || watch('destination')}
                    onSelectLocation={handleDestinationSelect}
                    onClear={() => {
                      setSelectedDestination(null);
                      setValue('destination', '', { shouldValidate: true });
                    }}
                  />
                </div>

                <Input
                  label="Specific Meeting / Landmark Stop (Optional)"
                  placeholder="e.g. Opposite Disco Bakery near main traffic signal"
                  leftIcon={<ClipboardList className="h-4.5 w-4.5 text-brand-muted" />}
                  error={errors.meetingPoint?.message}
                  disabled={isSubmitting}
                  {...register('meetingPoint')}
                />
              </div>

              {/* Section 2: Timing & Costs */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border/40 pb-1.5 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Schedule & Fare Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Available Seats (1 to 6)"
                    type="number"
                    placeholder="e.g. 3"
                    leftIcon={<Users className="h-4.5 w-4.5 text-brand-muted" />}
                    error={errors.availableSeats?.message}
                    disabled={isSubmitting}
                    {...register('availableSeats', { valueAsNumber: true })}
                  />

                  <Input
                    label="Fare per Passenger (PKR)"
                    type="number"
                    placeholder="e.g. 350"
                    leftIcon={<DollarSign className="h-4.5 w-4.5 text-brand-primaryLight" />}
                    error={errors.farePerPassenger?.message}
                    disabled={isSubmitting}
                    {...register('farePerPassenger', { valueAsNumber: true })}
                  />
                </div>
              </div>

              {/* Section 3: Registered Vehicle Auto-Association */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border/40 pb-1.5 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <span>Registered Vehicle & Notes</span>
                </h4>

                {/* Auto-Associated Vehicle Card (BUG-005) */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{user?.vehicleModel || 'Registered Vehicle'}</span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {user?.vehicleType || 'Car'} • Plate: {user?.vehicleRegistrationNumber || 'Registered'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Auto-Selected
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold tracking-wide text-brand-textMuted uppercase">
                    Description / Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add details about baggage limits, smoking rules, or specific pick-up guidelines..."
                    className="w-full px-4 py-3 bg-brand-surface border border-brand-border rounded-xl text-brand-text text-sm transition-all focus:outline-none placeholder:text-brand-muted/70 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 focus:shadow-glow resize-none"
                    disabled={isSubmitting}
                    {...register('description')}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3.5 rounded-2xl"
                  disabled={!isValid || isSubmitting}
                  isLoading={isSubmitting}
                >
                  Publish Commute Route
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Route Map Preview & Intelligent Fare Engine */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-4 shadow-glass">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              Route Polyline & Distance Map
            </h4>
            <MapContainer height="380px" />
          </div>

          <FareEstimateCard />
        </div>
      </div>
    </div>
  );
};

export const PublishRide: React.FC = () => {
  return (
    <MapProvider>
      <PublishRideFormInner />
    </MapProvider>
  );
};

export default PublishRide;
