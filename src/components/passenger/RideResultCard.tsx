import React from 'react';
import { MapPin, Navigation, Calendar, Clock, Star, Users, ArrowRight, Milestone } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import type { Ride } from '../../contexts/PassengerContext';
import { cn } from '../../utils/cn';

interface RideResultCardProps {
  ride: Ride;
  onViewDetails: (id: string) => void;
  className?: string;
}

export const RideResultCard: React.FC<RideResultCardProps> = ({
  ride,
  onViewDetails,
  className,
}) => {
  return (
    <Card hoverEffect={true} className={cn("border border-brand-border/40 text-left bg-brand-card/20 relative p-4 sm:p-5 select-none", className)}>
      
      {/* Top row: Driver details & Fare */}
      <div className="flex justify-between items-start gap-3 mb-4 pb-3.5 border-b border-brand-border/30">
        
        {/* Driver profile summary */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Avatar name={ride.driver.name} size="md" />
          
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-bold text-brand-text leading-none truncate max-w-[160px] sm:max-w-none">{ride.driver.name}</h4>
              <div className="flex items-center gap-0.5 text-amber-400 text-xs font-bold">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{ride.driver.rating}</span>
              </div>
            </div>
            
            {ride.driver.officeName && (
              <p className="text-[10px] text-brand-textMuted font-medium leading-none truncate">
                Verified: {ride.driver.officeName.split(' ')[0]}
              </p>
            )}
          </div>
        </div>

        {/* Cost details */}
        <div className="text-right flex-shrink-0">
          <p className="text-lg sm:text-xl font-extrabold text-brand-primaryLight leading-none">
            {ride.farePerPassenger}
          </p>
          <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide">
            PKR / Seat
          </span>
        </div>

      </div>

      {/* Grid: Route details and travel information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
        
        {/* Route checkpoints */}
        <div className="space-y-2 text-xs text-brand-text">
          <div className="flex gap-2 items-center">
            <MapPin className="h-4 w-4 text-brand-primary flex-shrink-0" />
            <span className="truncate">From: <strong className="font-semibold text-brand-text">{ride.pickupArea}</strong></span>
          </div>

          <div className="flex gap-2 items-center">
            <Navigation className="h-4 w-4 text-brand-accent flex-shrink-0" />
            <span className="truncate">To: <strong className="font-semibold text-brand-text">{ride.destination}</strong></span>
          </div>

          <div className="flex gap-2 items-start text-brand-textMuted pl-6 italic">
            <span className="text-[10px] truncate">Stop: "{ride.meetingPoint}"</span>
          </div>
        </div>

        {/* Departure parameters */}
        <div className="space-y-2 text-xs md:border-l md:border-brand-border/30 md:pl-5">
          <div className="flex gap-2 items-center text-brand-textMuted">
            <Calendar className="h-4 w-4 text-brand-muted flex-shrink-0" />
            <span>Date: <strong className="text-brand-text font-semibold">{ride.date}</strong></span>
          </div>
          
          <div className="flex gap-2 items-center text-brand-textMuted">
            <Clock className="h-4 w-4 text-brand-muted flex-shrink-0" />
            <span>Time: <strong className="text-brand-text font-semibold">{ride.departureTime}</strong></span>
          </div>

          <div className="flex gap-2 items-center text-brand-textMuted">
            <Milestone className="h-4 w-4 text-brand-muted flex-shrink-0" />
            <span>Duration: <strong className="text-brand-text font-semibold">{ride.estimatedDuration}</strong></span>
          </div>
        </div>

      </div>

      {/* Footer metadata & Action Button */}
      <div className="pt-3.5 border-t border-brand-border/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Seats left indicator */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 text-xs text-brand-textMuted flex-wrap">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-brand-muted" />
            <span>
              Seats Open: <strong className="text-brand-text">{ride.availableSeats} of {ride.totalSeats}</strong>
            </span>
          </div>
          <span className="text-[10px] text-brand-muted bg-white/[0.03] px-2 py-0.5 rounded-lg border border-brand-border/30 capitalize">
            {ride.driver.vehicleModel} ({ride.driver.vehicleType})
          </span>
        </div>

        <Button
          variant="glass"
          size="sm"
          onClick={() => onViewDetails(ride.id)}
          className="w-full sm:w-auto min-h-[44px] border-brand-primary/20 text-brand-primaryLight hover:bg-brand-primary/10 font-bold justify-center"
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          View Details
        </Button>

      </div>

    </Card>
  );
};
