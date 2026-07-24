import React from 'react';
import { MapPin, Navigation, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Ride } from '../../contexts/DriverContext';
import { cn } from '../../utils/cn';

interface RideTimelineProps {
  rides: Ride[];
}

export const RideTimeline: React.FC<RideTimelineProps> = ({ rides }) => {
  if (rides.length === 0) {
    return (
      <Card hoverEffect={false} className="border border-brand-border/40 p-8 text-center bg-brand-card/25 select-none">
        <p className="text-sm text-brand-textMuted leading-relaxed">
          No historical commutes logged yet.
        </p>
      </Card>
    );
  }

  const statusVariants = {
    Upcoming: 'primary' as const,
    Active: 'accent' as const,
    Full: 'warning' as const,
    Completed: 'success' as const,
    Cancelled: 'muted' as const,
  };

  return (
    <div className="relative border-l border-brand-border/40 ml-4 pl-6 sm:pl-8 py-2 space-y-8 select-none text-left">
      {rides.map((ride) => (
        <div key={ride.id} className="relative">
          
          {/* Timeline Dot Indicator */}
          <span className={cn(
            "absolute -left-[35px] sm:-left-[43px] top-1 h-5 w-5 rounded-full border-4 border-brand-bg flex items-center justify-center shadow-lg",
            ride.status === 'Completed' && "bg-brand-primary",
            ride.status === 'Cancelled' && "bg-amber-500",
            (ride.status === 'Upcoming' || ride.status === 'Active' || ride.status === 'Full') && "bg-brand-accent animate-pulse"
          )} />

          <Card hoverEffect={false} className="border border-brand-border/50 bg-brand-card/30 p-5 rounded-xl space-y-4">
            
            {/* Header section info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-brand-border/30 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant={statusVariants[ride.status]}>
                  {ride.status}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-brand-textMuted font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{ride.date} • {ride.departureTime}</span>
                </div>
              </div>
              
              <div className="text-xs text-brand-textMuted font-medium uppercase tracking-wider">
                Vehicle: {ride.driver.vehicleModel}
              </div>
            </div>

            {/* Core Route Details */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-brand-text">
                  <MapPin className="h-4 w-4 text-brand-primary" />
                  <span>Pickup: <strong className="font-semibold">{ride.pickupArea}</strong></span>
                </div>
                
                <div className="flex items-center gap-2 text-brand-text">
                  <Navigation className="h-4 w-4 text-brand-accent" />
                  <span>Destination: <strong className="font-semibold">{ride.destination}</strong></span>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-5 pt-2 sm:pt-0">
                <div className="text-left">
                  <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide block">Fare Collected</span>
                  <span className="text-sm font-extrabold text-brand-primaryLight">
                    {ride.farePerPassenger * (ride.totalSeats - ride.availableSeats)} PKR
                  </span>
                </div>
                
                <div className="h-6 w-px bg-brand-border" />

                <div className="text-left">
                  <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide block">Passengers</span>
                  <span className="text-sm font-extrabold text-brand-text">
                    {ride.totalSeats - ride.availableSeats} Commuters
                  </span>
                </div>
              </div>
            </div>

          </Card>
        </div>
      ))}
    </div>
  );
};
