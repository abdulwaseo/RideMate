import React from 'react';
import { MapPin, Calendar, Clock, Users, Navigation } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Ride } from '../../contexts/DriverContext';
import { cn } from '../../utils/cn';

interface RideCardProps {
  ride: Ride;
  actions?: React.ReactNode;
  className?: string;
}

export const RideCard: React.FC<RideCardProps> = ({ ride, actions, className }) => {
  const statusColors = {
    Upcoming: 'primary' as const,
    Active: 'accent' as const,
    Full: 'warning' as const,
    Completed: 'success' as const,
    Cancelled: 'muted' as const,
  };

  return (
    <Card hoverEffect={false} className={cn("border border-brand-border/50 text-left bg-brand-card/30 relative", className)}>
      
      {/* Top Header Row */}
      <div className="flex justify-between items-start gap-4 mb-5 border-b border-brand-border/40 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={statusColors[ride.status]}>
              {ride.status}
            </Badge>
            <span className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold">
              ID: {ride.id}
            </span>
          </div>
          <p className="text-xs text-brand-textMuted pt-0.5">
            Vehicle: <span className="text-brand-text font-medium">{ride.driver.vehicleModel}</span> ({ride.driver.vehicleType})
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-extrabold text-brand-primaryLight leading-none">
            {ride.farePerPassenger}
          </p>
          <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide">
            PKR / Seat
          </span>
        </div>
      </div>

      {/* Main Route Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Route Details */}
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <div className="p-1 rounded-md bg-brand-primary/10 text-brand-primary mt-0.5">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Pickup Zone</p>
              <p className="text-sm font-semibold text-brand-text mt-0.5">{ride.pickupArea}</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="p-1 rounded-md bg-brand-accent/10 text-brand-accent mt-0.5">
              <Navigation className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Destination</p>
              <p className="text-sm font-semibold text-brand-text mt-0.5">{ride.destination}</p>
            </div>
          </div>
          
          <div className="flex gap-3 items-start pl-7 border-l border-brand-border/60">
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Meeting Point Details</p>
              <p className="text-xs text-brand-textMuted mt-0.5 leading-relaxed">{ride.meetingPoint}</p>
            </div>
          </div>
        </div>

        {/* Departure Details */}
        <div className="space-y-4 md:border-l md:border-brand-border/40 md:pl-6">
          <div className="flex gap-3 items-center">
            <Calendar className="h-4.5 w-4.5 text-brand-muted" />
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Commute Date</p>
              <p className="text-xs font-semibold text-brand-text mt-0.5">{ride.date}</p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <Clock className="h-4.5 w-4.5 text-brand-muted" />
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Departure Time</p>
              <p className="text-xs font-semibold text-brand-text mt-0.5">{ride.departureTime}</p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <Users className="h-4.5 w-4.5 text-brand-muted" />
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Available Seats</p>
              <p className="text-xs font-semibold text-brand-text mt-0.5">
                {ride.availableSeats} of {ride.totalSeats} seats open
              </p>
            </div>
          </div>
        </div>
      </div>

      {ride.description && (
        <div className="mb-6 p-3 rounded-xl bg-white/[0.01] border border-brand-border/40 text-xs text-brand-textMuted italic leading-relaxed">
          "{ride.description}"
        </div>
      )}

      {/* Action panel */}
      {actions && (
        <div className="pt-4 border-t border-brand-border/40 flex items-center justify-end gap-3 w-full">
          {actions}
        </div>
      )}
    </Card>
  );
};
