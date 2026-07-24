import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface RideTimelineProps {
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';
  rideStatus: 'Upcoming' | 'Active' | 'Full' | 'Completed' | 'Cancelled';
  className?: string;
}

export const RideTimeline: React.FC<RideTimelineProps> = ({
  status,
  rideStatus,
  className,
}) => {
  // If cancelled or rejected, show alternative timeline state
  const isFailed = status === 'Cancelled' || status === 'Rejected' || rideStatus === 'Cancelled';

  const steps = [
    { label: 'Published', desc: 'Ride posted by Driver', active: true, done: true },
    { 
      label: 'Requested', 
      desc: 'Seat match sent', 
      active: true, 
      done: true 
    },
    { 
      label: status === 'Rejected' ? 'Rejected' : 'Approved', 
      desc: status === 'Rejected' ? 'Driver declined match' : 'Driver verified seat', 
      active: status !== 'Pending', 
      done: status === 'Accepted' && !isFailed,
      failed: status === 'Rejected'
    },
    { 
      label: 'Commuting', 
      desc: 'Transit is active', 
      active: status === 'Accepted' && (rideStatus === 'Active' || rideStatus === 'Completed'), 
      done: status === 'Accepted' && rideStatus === 'Completed',
      failed: isFailed && status === 'Accepted' // if accepted but ride cancelled
    },
    { 
      label: isFailed ? 'Terminated' : 'Completed', 
      desc: isFailed ? 'Commute corridor cancelled' : 'Arrived at destination', 
      active: rideStatus === 'Completed' || isFailed, 
      done: rideStatus === 'Completed' && !isFailed,
      failed: isFailed
    }
  ];

  return (
    <div className={cn("w-full py-6 select-none", className)}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          
          return (
            <div key={idx} className="flex-1 w-full relative">
              
              {/* Connector line for desktop layout */}
              {!isLast && (
                <div className="hidden md:block absolute top-[15px] left-[30px] right-0 h-0.5 bg-brand-border/40 z-0">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      step.done ? 'bg-brand-primary' : step.failed ? 'bg-red-500' : 'bg-transparent'
                    )} 
                  />
                </div>
              )}

              {/* Connector line for mobile layout */}
              {!isLast && (
                <div className="md:hidden absolute left-[15px] top-[30px] bottom-0 w-0.5 bg-brand-border/40 z-0 h-8" />
              )}

              {/* Step info row */}
              <div className="flex md:flex-col items-center md:items-start text-left gap-3.5 md:gap-2.5 relative z-10">
                
                {/* Step indicator circle */}
                <div className="flex-shrink-0">
                  {step.failed ? (
                    <div className="h-8 w-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  ) : step.done ? (
                    <div className="h-8 w-8 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primaryLight">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  ) : step.active ? (
                    <div className="h-8 w-8 rounded-full bg-brand-accent/10 border-2 border-brand-accent flex items-center justify-center text-brand-accentLight animate-pulse">
                      <Circle className="h-3 w-3 fill-current" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-white/[0.02] border border-brand-border/60 flex items-center justify-center text-brand-muted">
                      <Circle className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                {/* Step content */}
                <div className="space-y-0.5 md:pt-1">
                  <p className={cn(
                    "text-xs font-bold uppercase tracking-wider leading-none",
                    step.failed ? 'text-red-400' : step.done ? 'text-brand-primaryLight' : step.active ? 'text-brand-accentLight' : 'text-brand-textMuted'
                  )}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-brand-muted leading-tight md:max-w-[120px]">
                    {step.desc}
                  </p>
                </div>

              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
