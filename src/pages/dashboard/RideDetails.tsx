import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Calendar, 
  Clock, 
  Star, 
  Users, 
  ChevronLeft, 
  Car, 
  AlertTriangle,
  FileText,
  UserCheck,
  Loader2
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { usePassenger } from '../../hooks/usePassenger';
import { getAuthToken } from '../../utils/token';
import type { Ride } from '../../contexts/RideContext';

export const RideDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { ridesList, searchResults, bookingRequests, createBookingRequest } = usePassenger();
  const navigate = useNavigate();

  // Initial local state lookup from context list / search results
  const contextRide = ridesList.find((r) => r.id === id) || searchResults.find((r) => r.id === id) || null;
  const [ride, setRide] = useState<Ride | null>(contextRide);
  const [isFetching, setIsFetching] = useState<boolean>(!contextRide);

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync ride when contextRide updates
  useEffect(() => {
    if (contextRide) {
      setRide(contextRide);
      setIsFetching(false);
    }
  }, [contextRide]);

  // Direct backend fetch by ID on mount or ID change
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const fetchRideDirectly = async () => {
      if (!contextRide) {
        setIsFetching(true);
      }
      try {
        const token = getAuthToken();
        const res = await fetch(`http://localhost:8000/api/v1/rides/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok && isMounted) {
          const json = await res.json();
          const r = json.data;
          if (r) {
            const mappedRide: Ride = {
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
            };
            setRide(mappedRide);
          }
        }
      } catch (err) {
        console.warn('[RideDetails] Direct ride fetch error:', err);
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    fetchRideDirectly();

    return () => {
      isMounted = false;
    };
  }, [id, contextRide]);

  // Check if passenger already has an active request (Pending or Accepted on an un-completed ride)
  const activeRequest = bookingRequests.find(
    (req) => (req.status === 'Pending' || req.status === 'Accepted') && req.ride.status !== 'Completed'
  );

  const hasActiveRequest = !!activeRequest;

  // Show loading indicator while fetching
  if (isFetching && !ride) {
    return (
      <div className="space-y-6 text-left select-none max-w-xl mx-auto pt-16 text-center">
        <Card hoverEffect={false} className="border border-brand-border p-10 bg-brand-card/20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
          <p className="text-sm font-semibold text-brand-textMuted">Loading commute corridor details...</p>
        </Card>
      </div>
    );
  }

  // Only show missing/expired screen AFTER fetch completes and ride is definitively missing
  if (!ride) {
    return (
      <div className="space-y-6 text-left select-none max-w-xl mx-auto pt-12">
        <Card hoverEffect={false} className="border border-brand-border p-8 text-center bg-brand-card/10 space-y-4">
          <p className="text-sm text-brand-textMuted leading-relaxed">
            Commute corridor details not found or ride expired.
          </p>
          <Button variant="glass" size="sm" onClick={() => navigate('/dashboard/passenger/search')}>
            Back to Search
          </Button>
        </Card>
      </div>
    );
  }

  const handleRequestConfirm = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const success = await createBookingRequest(ride.id);
      if (success) {
        setShowConfirmModal(false);
        navigate('/dashboard/passenger/requests');
      } else {
        setErrorMsg('Could not send booking request. Check if an active request already exists.');
      }
    } catch {
      setErrorMsg('Failed to submit booking request. Please check connections.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-left select-none max-w-5xl">
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/dashboard/passenger/search')}
        className="flex items-center gap-1 text-xs text-brand-textMuted hover:text-brand-text font-bold"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to Search Results</span>
      </button>

      {/* Page Header */}
      <PageHeader 
        title="Ride Details" 
        description="Verify commute checklists, passenger safety details, and driver ratings before booking."
      />

      {errorMsg && (
        <Card hoverEffect={false} className="p-4 border border-red-500/25 bg-red-500/10 text-red-400 text-sm font-semibold max-w-3xl">
          {errorMsg}
        </Card>
      )}

      {/* Active Booking warning block */}
      {hasActiveRequest && (
        <Card hoverEffect={false} className="border border-brand-accent/30 bg-sky-50/80 p-5 flex gap-4 text-left max-w-3xl">
          <div className="p-2.5 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent h-fit">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-brand-accentLight">Active Request Block</h4>
            <p className="text-xs text-brand-textMuted leading-relaxed max-w-2xl">
              You already have a matching active request (Status: <strong className="text-brand-text uppercase">{activeRequest.status}</strong>). Passengers are restricted to having exactly **one active booking request** at a time. If you wish to match with this driver instead, you must first cancel your active request.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Details Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Corridor Detail block */}
          <Card hoverEffect={false} className="border border-brand-border bg-brand-card p-6 sm:p-8 space-y-6 shadow-glass">
            
            {/* Route paths */}
            <div className="flex justify-between items-start gap-4 border-b border-brand-border/40 pb-5">
              <div className="space-y-1">
                <Badge variant="primary">Shared Commute Route</Badge>
                <h3 className="text-xl font-bold text-brand-text pt-1">
                  {ride.pickupArea} → {ride.destination}
                </h3>
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-brand-primaryLight">{ride.farePerPassenger} PKR</p>
                <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Per Passenger</span>
              </div>
            </div>

            {/* Travel details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-brand-text">
              
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="p-1 rounded bg-brand-primary/10 text-brand-primary mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wider block">Pickup Area</span>
                    <strong className="text-sm font-semibold mt-0.5 block">{ride.pickupArea}</strong>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="p-1 rounded bg-brand-accent/10 text-brand-accent mt-0.5">
                    <Navigation className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wider block">Destination</span>
                    <strong className="text-sm font-semibold mt-0.5 block">{ride.destination}</strong>
                  </div>
                </div>

                <div className="flex gap-3 items-start pl-7 border-l border-brand-border/40">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wider block">Specific Meeting Landmark</span>
                    <p className="text-xs text-brand-textMuted mt-0.5 leading-relaxed">{ride.meetingPoint}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:border-l sm:border-brand-border/30 sm:pl-6 text-brand-textMuted">
                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wider block mb-0.5">Commute Date</span>
                  <div className="flex items-center gap-1.5 text-brand-text font-semibold">
                    <Calendar className="h-4.5 w-4.5 text-brand-muted" />
                    <span>{ride.date}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wider block mb-0.5">Departure Time</span>
                  <div className="flex items-center gap-1.5 text-brand-text font-semibold">
                    <Clock className="h-4.5 w-4.5 text-brand-muted" />
                    <span>{ride.departureTime}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wider block mb-0.5">Seats Remaining</span>
                  <div className="flex items-center gap-1.5 text-brand-text font-semibold">
                    <Users className="h-4.5 w-4.5 text-brand-muted" />
                    <span>{ride.availableSeats} open / {ride.totalSeats} total</span>
                  </div>
                </div>
              </div>

            </div>

            {ride.description && (
              <div className="p-4 rounded-xl bg-white/[0.01] border border-brand-border/40 text-xs text-brand-textMuted italic leading-relaxed">
                "{ride.description}"
              </div>
            )}

          </Card>

          {/* Passenger reviews placeholder */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-brand-text uppercase tracking-wider flex items-center gap-2">
              <Star className="h-4.5 w-4.5 text-brand-primary" />
              <span>Commuter Reviews ({ride.driver.name})</span>
            </h4>

            <div className="space-y-3">
              {[
                { name: 'Faizan Sheikh', rating: 5, date: '1 week ago', comment: 'Always punctual and drives very safely. Highly recommended.' },
                { name: 'Amna Siddiqui', rating: 4, date: '2 weeks ago', comment: 'Punctual driver, comfortable ride. Meeting point is easy to locate.' }
              ].map((rev, i) => (
                <Card key={i} hoverEffect={false} className="border border-brand-border/30 bg-brand-card/10 p-4 text-xs text-left">
                  <div className="flex justify-between items-center mb-1">
                    <strong className="text-brand-text">{rev.name}</strong>
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-brand-textMuted">{rev.comment}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Safety & Booking terms */}
          <Card hoverEffect={false} className="border border-brand-border/30 p-5 space-y-3 text-xs bg-brand-card/15">
            <h4 className="font-bold text-brand-text flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-muted" />
              <span>Safety Instructions & Terms</span>
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-brand-textMuted leading-relaxed">
              <li>Verified corporate commuters only. Please show employee credentials at pickup.</li>
              <li>Wait maximum of 5 minutes at pickup landmark to prevent delays.</li>
              <li>Seat cancellations must be done at least 1 hour before departure.</li>
            </ul>
          </Card>

        </div>

        {/* Sidebar details: Driver & Vehicle Cards */}
        <div className="space-y-6">
          
          {/* Driver details card */}
          <Card hoverEffect={false} className="border border-brand-border bg-brand-card/45 p-6 flex flex-col items-center text-center space-y-4">
            <Avatar name={ride.driver.name} size="lg" className="scale-110" />
            
            <div className="space-y-1">
              <h4 className="font-bold text-brand-text text-base leading-none">{ride.driver.name}</h4>
              <div className="flex items-center justify-center gap-1 text-xs text-amber-400 font-bold">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{ride.driver.rating} trust score</span>
              </div>
              <Badge variant="primary" className="text-[9px] mt-1 inline-block">Verified Driver</Badge>
            </div>

            <div className="w-full h-px bg-brand-border/40" />

            <div className="w-full text-left space-y-2 text-xs text-brand-textMuted">
              <div>
                <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wide">Office</span>
                <p className="text-brand-text font-semibold">{ride.driver.officeName || 'Dilkusha Corporate'}</p>
              </div>
              <div>
                <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wide">Domain Verified</span>
                <p className="text-brand-primaryLight font-semibold">@company.com email check</p>
              </div>
            </div>
          </Card>

          {/* Vehicle details card */}
          <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/25 p-5 text-left space-y-3">
            <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider pb-1.5 border-b border-brand-border/30 flex items-center gap-2">
              <Car className="h-4.5 w-4.5" />
              <span>Vehicle Specifications</span>
            </h4>

            <div className="space-y-2 text-xs text-brand-textMuted">
              <div>
                <span className="text-[9px] uppercase font-bold text-brand-muted block">Vehicle Model</span>
                <strong className="text-brand-text">{ride.driver.vehicleModel}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-brand-muted block">Plate Number</span>
                <strong className="text-brand-accentLight uppercase tracking-wider">{ride.driver.vehicleRegistrationNumber}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-brand-muted block">Vehicle Type</span>
                <Badge variant={ride.driver.vehicleType === 'Car' ? 'primary' : 'accent'} className="text-[10px] mt-0.5">
                  {ride.driver.vehicleType}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Core Booking button */}
          <div className="pt-2">
            {ride.availableSeats > 0 && ride.status !== 'Full' ? (
              <Button
                variant="primary"
                className="w-full py-3 font-bold rounded-2xl"
                disabled={hasActiveRequest}
                onClick={() => setShowConfirmModal(true)}
              >
                Request Carpool Seat
              </Button>
            ) : (
              <div className="w-full py-3 rounded-2xl border border-dashed border-brand-border text-center bg-brand-card/10 text-xs font-semibold text-brand-muted">
                Ride is Fully Booked (0 Seats Left)
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md z-10"
            >
              <Card hoverEffect={false} className="border border-brand-border bg-brand-card shadow-glass p-6 sm:p-8 rounded-2xl text-left space-y-6">
                
                <div>
                  <h3 className="text-lg font-bold text-brand-text">Confirm Seat Request</h3>
                  <p className="text-xs text-brand-textMuted mt-1">
                    Send a booking query. Fares are settled during commute coordinates.
                  </p>
                </div>

                {/* Ride Summary in modal */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-brand-border/40 space-y-3 text-xs text-brand-textMuted">
                  <div className="flex justify-between items-center text-brand-text border-b border-brand-border/30 pb-2">
                    <span className="font-bold">Driver:</span>
                    <strong>{ride.driver.name}</strong>
                  </div>
                  <div>
                    <span className="block font-bold">Route Corridor:</span>
                    <span className="text-brand-text">{ride.pickupArea} → {ride.destination}</span>
                  </div>
                  <div>
                    <span className="block font-bold">Meeting Landmark Stop:</span>
                    <span className="text-brand-text">"{ride.meetingPoint}"</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-brand-border/30">
                    <span className="font-bold text-brand-primary">Fare Total:</span>
                    <strong className="text-sm font-extrabold text-brand-primaryLight">{ride.farePerPassenger} PKR</strong>
                  </div>
                </div>

                <p className="text-[10px] text-brand-muted leading-relaxed">
                  Upon clicking 'Confirm Request', the driver receives a match alert. You will be redirected to requests tab.
                </p>

                <div className="flex gap-3 justify-end pt-3 border-t border-brand-border/30">
                  <Button variant="glass" size="sm" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleRequestConfirm}
                    isLoading={isSubmitting}
                    className="font-bold"
                    leftIcon={<UserCheck className="h-4 w-4" />}
                  >
                    Confirm Request
                  </Button>
                </div>

              </Card>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default RideDetails;
