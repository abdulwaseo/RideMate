import React from 'react';
import type { TrackingSessionStatus } from '../../types/tracking';
import { CheckCircle2, Clock, Car, MapPin, Navigation, Flag } from 'lucide-react';

interface TimelineStep {
  status: TrackingSessionStatus;
  label: string;
  icon: React.ReactNode;
}

const STEPS: TimelineStep[] = [
  { status: 'Preparing', label: 'Getting Ready', icon: <Clock className="w-4 h-4" /> },
  { status: 'DriverEnRoute', label: 'Driver En Route', icon: <Car className="w-4 h-4" /> },
  { status: 'PassengerPickup', label: 'Picking Up', icon: <MapPin className="w-4 h-4" /> },
  { status: 'RideInProgress', label: 'Ride Started', icon: <Navigation className="w-4 h-4" /> },
  { status: 'DestinationApproaching', label: 'Approaching', icon: <Navigation className="w-4 h-4" /> },
  { status: 'Completed', label: 'Arrived!', icon: <Flag className="w-4 h-4" /> },
];

const STATUS_ORDER: TrackingSessionStatus[] = [
  'Preparing',
  'DriverEnRoute',
  'PassengerPickup',
  'RideInProgress',
  'DestinationApproaching',
  'Completed',
];

function getStepIndex(status: TrackingSessionStatus | null) {
  if (!status) return -1;
  return STATUS_ORDER.indexOf(status as any);
}

interface TrackingTimelineProps {
  currentStatus: TrackingSessionStatus | null;
  className?: string;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ currentStatus, className = '' }) => {
  const currentIdx = getStepIndex(currentStatus);

  return (
    <div className={`flex flex-col gap-0 ${className}`}>
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isActive = idx === currentIdx;

        return (
          <div key={step.status} className="flex items-stretch gap-3">
            {/* Icon column */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 animate-pulse'
                    : 'bg-slate-800 border border-slate-700 text-slate-600'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[20px] my-1 transition-all duration-500 ${
                    idx < currentIdx ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                />
              )}
            </div>

            {/* Label */}
            <div className="flex items-center pb-5">
              <span
                className={`text-sm font-medium transition-all ${
                  isActive ? 'text-emerald-300' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {step.label}
              </span>
              {isActive && (
                <span className="ml-2 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5 uppercase tracking-wide">
                  Live
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
