import React from 'react';
import { MapPin, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { PassengerHistoryEntry } from '../../contexts/PassengerContext';
import { cn } from '../../utils/cn';

interface PassengerTimelineCardProps {
  entries: PassengerHistoryEntry[];
}

export const PassengerTimelineCard: React.FC<PassengerTimelineCardProps> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <Card hoverEffect={false} className="border border-brand-border/40 p-8 text-center bg-brand-card/25 select-none">
        <p className="text-sm text-brand-textMuted leading-relaxed">
          No historical commutes logged yet.
        </p>
      </Card>
    );
  }

  const statusVariants = {
    Completed: 'success' as const,
    Cancelled: 'warning' as const,
    Rejected: 'muted' as const,
  };

  return (
    <div className="relative border-l border-brand-border/40 ml-4 pl-6 sm:pl-8 py-2 space-y-8 select-none text-left">
      {entries.map((entry) => (
        <div key={entry.id} className="relative">
          
          {/* Timeline Dot Indicator */}
          <span className={cn(
            "absolute -left-[35px] sm:-left-[43px] top-1 h-5 w-5 rounded-full border-4 border-brand-bg flex items-center justify-center shadow-lg",
            entry.status === 'Completed' && "bg-brand-primary",
            entry.status === 'Cancelled' && "bg-amber-500",
            entry.status === 'Rejected' && "bg-brand-border"
          )} />

          <Card hoverEffect={false} className="border border-brand-border/50 bg-brand-card/30 p-5 rounded-xl space-y-4">
            
            {/* Header section details */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-brand-border/30 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant={statusVariants[entry.status]}>
                  {entry.status}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-brand-textMuted font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{entry.date}</span>
                </div>
              </div>
              
              <div className="text-xs text-brand-textMuted font-medium">
                Driver: <strong className="text-brand-text">{entry.driverName}</strong>
              </div>
            </div>

            {/* Core Route details */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1 space-y-1 text-xs">
                <div className="flex items-center gap-2 text-brand-text">
                  <MapPin className="h-4 w-4 text-brand-primary" />
                  <span>Route: <strong className="font-semibold">{entry.route}</strong></span>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-5 pt-2 sm:pt-0">
                <div className="text-left text-xs">
                  <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide block">Fare Paid</span>
                  <span className="text-sm font-extrabold text-brand-primaryLight">
                    {entry.fare} PKR
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
