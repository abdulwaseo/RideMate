import React from 'react';
import { MapPin, Navigation, Calendar, Clock, XCircle, Eye } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RideTimeline } from '../ui/RideTimeline';
import type { BookingRequest } from '../../contexts/PassengerContext';
import { cn } from '../../utils/cn';

interface BookingSummaryCardProps {
  request: BookingRequest;
  onCancelRequest?: (id: string) => void;
  onViewRideDetails?: (rideId: string) => void;
  className?: string;
}

export const BookingSummaryCard: React.FC<BookingSummaryCardProps> = ({
  request,
  onCancelRequest,
  onViewRideDetails,
  className,
}) => {
  const { ride, status, requestDate } = request;

  const statusColors = {
    Pending: 'primary' as const,
    Accepted: 'success' as const,
    Rejected: 'warning' as const,
    Cancelled: 'muted' as const,
  };

  return (
    <Card hoverEffect={false} className={cn("border border-brand-border/40 text-left bg-brand-card/30 p-5 relative select-none", className)}>
      
      {/* Top Header details */}
      <div className="flex justify-between items-start gap-4 mb-4 pb-3.5 border-b border-brand-border/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={statusColors[status]}>
              {status}
            </Badge>
            <span className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold">
              Requested: {requestDate}
            </span>
          </div>
          <p className="text-xs text-brand-textMuted pt-0.5">
            Driver: <span className="text-brand-text font-bold">{ride.driver.name}</span> ({ride.driver.officeName?.split(' ')[0]})
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-black text-brand-primaryLight">
            {ride.farePerPassenger} PKR
          </p>
          <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide block leading-none pt-0.5">
            Per Seat
          </span>
        </div>
      </div>

      {/* Ride path details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-xs text-brand-text">
        <div className="space-y-2.5">
          <div className="flex gap-2 items-center">
            <MapPin className="h-4 w-4 text-brand-primary flex-shrink-0" />
            <span>Pickup: <strong className="font-semibold">{ride.pickupArea}</strong></span>
          </div>

          <div className="flex gap-2 items-center">
            <Navigation className="h-4 w-4 text-brand-accent flex-shrink-0" />
            <span>Destination: <strong className="font-semibold">{ride.destination}</strong></span>
          </div>
        </div>

        <div className="space-y-2 sm:border-l sm:border-brand-border/30 sm:pl-5 text-brand-textMuted">
          <div className="flex gap-2 items-center">
            <Calendar className="h-4 w-4 text-brand-muted flex-shrink-0" />
            <span>Date: <strong className="text-brand-text font-semibold">{ride.date}</strong></span>
          </div>
          
          <div className="flex gap-2 items-center">
            <Clock className="h-4 w-4 text-brand-muted flex-shrink-0" />
            <span>Time: <strong className="text-brand-text font-semibold">{ride.departureTime}</strong></span>
          </div>
        </div>
      </div>

      {/* Landmark details */}
      <div className="mb-5 p-3 rounded-xl bg-white/[0.01] border border-brand-border/40 text-xs text-brand-textMuted italic">
        Meeting Stop: "{ride.meetingPoint}"
      </div>

      {/* Dynamic Stepper Timeline tracker */}
      <div className="py-2 border-t border-brand-border/20 my-4">
        <RideTimeline status={status} rideStatus={ride.status} />
      </div>

      {/* Action panel */}
      <div className="pt-3.5 border-t border-brand-border/30 flex items-center justify-end gap-2.5">
        
        {onViewRideDetails && (
          <Button
            variant="glass"
            size="sm"
            onClick={() => onViewRideDetails(ride.id)}
            leftIcon={<Eye className="h-4 w-4" />}
          >
            View Ride
          </Button>
        )}

        {onCancelRequest && (status === 'Pending' || status === 'Accepted') && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onCancelRequest(request.id)}
            className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
            leftIcon={<XCircle className="h-4 w-4" />}
          >
            Cancel Request
          </Button>
        )}

      </div>

    </Card>
  );
};
