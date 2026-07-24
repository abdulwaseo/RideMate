import React from 'react';
import type { TrackingSession, TrackingSessionStatus } from '../../types/tracking';
import { RideProgressBar } from './RideProgressBar';
import { ConnectionQualityBadge } from './ConnectionQualityBadge';
import { Users, Radio } from 'lucide-react';

const STATUS_LABELS: Record<TrackingSessionStatus, string> = {
  Preparing: 'Getting Ready',
  DriverEnRoute: 'Driver En Route',
  PassengerPickup: 'Picking Up Passengers',
  RideInProgress: 'Ride In Progress',
  DestinationApproaching: 'Approaching Destination',
  Completed: 'Ride Completed',
  Cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<TrackingSessionStatus, string> = {
  Preparing: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  DriverEnRoute: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  PassengerPickup: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  RideInProgress: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  DestinationApproaching: 'text-teal-400 bg-teal-400/10 border-teal-400/30',
  Completed: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
  Cancelled: 'text-red-400 bg-red-400/10 border-red-400/30',
};

interface TrackingStatusCardProps {
  session: TrackingSession | null;
  passengerCount?: number;
  gpsAccuracy?: number | null;
  wsConnected?: boolean;
  className?: string;
}

export const TrackingStatusCard: React.FC<TrackingStatusCardProps> = ({
  session,
  passengerCount = 0,
  gpsAccuracy,
  wsConnected = true,
  className = '',
}) => {
  const status = session?.current_status ?? null;
  const colorClass = status ? STATUS_COLORS[status] : 'text-slate-400 bg-slate-400/10 border-slate-400/30';
  const label = status ? STATUS_LABELS[status] : 'Not Tracking';

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 ${className}`}>
      {/* Status pill + live indicator */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold border rounded-full px-3 py-1 ${colorClass}`}>
          {label}
        </span>
        {session && !session.ended_at && (
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="text-xs font-semibold text-red-400">LIVE</span>
          </div>
        )}
      </div>

      {/* Route progress */}
      {session && !session.ended_at && (
        <RideProgressBar progressPercent={session.progress_percent} />
      )}

      {/* Footer info */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Users className="w-3.5 h-3.5" />
          <span>{passengerCount} passenger{passengerCount !== 1 ? 's' : ''} connected</span>
        </div>
        <ConnectionQualityBadge accuracy={gpsAccuracy} wsConnected={wsConnected} />
      </div>
    </div>
  );
};
