import React, { useState } from 'react';
import type { TrackingSession } from '../../types/tracking';
import { useTrackingContext } from '../../contexts/TrackingContext';
import { Play, Square, Navigation, UserCheck, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrackingControlsProps {
  rideId: string;
  session: TrackingSession | null;
  className?: string;
}

export const TrackingControls: React.FC<TrackingControlsProps> = ({
  rideId,
  session,
  className = '',
}) => {
  const { startTracking, stopTracking, advancePhase } = useTrackingContext();
  const [isLoading, setIsLoading] = useState(false);

  const isActive = !!session && !session.ended_at;
  const phase = session?.current_status;

  const handleStart = async () => {
    setIsLoading(true);
    await startTracking(rideId);
    setIsLoading(false);
  };

  const handleStop = async () => {
    setIsLoading(true);
    await stopTracking(rideId);
    setIsLoading(false);
  };

  const handlePhase = (eventType: string) => {
    advancePhase(rideId, eventType);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Primary control */}
      <AnimatePresence mode="wait">
        {!isActive ? (
          <motion.button
            key="start"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={handleStart}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition text-sm"
          >
            <Play className="w-4 h-4 fill-white" />
            {isLoading ? 'Starting...' : 'Start Live Tracking'}
          </motion.button>
        ) : (
          <motion.button
            key="stop"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={handleStop}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition text-sm"
          >
            <Square className="w-4 h-4 fill-white" />
            {isLoading ? 'Stopping...' : 'Stop Tracking'}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Phase action buttons — visible only when tracking is active */}
      {isActive && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handlePhase('ride_started')}
            disabled={phase === 'RideInProgress'}
            className="flex flex-col items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium py-3 px-2 rounded-xl transition"
          >
            <Navigation className="w-4 h-4 text-blue-400" />
            Ride Started
          </button>
          <button
            onClick={() => handlePhase('passenger_picked_up')}
            disabled={phase === 'PassengerPickup' || phase === 'Preparing'}
            className="flex flex-col items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium py-3 px-2 rounded-xl transition"
          >
            <UserCheck className="w-4 h-4 text-orange-400" />
            Picked Up
          </button>
          <button
            onClick={() => handlePhase('ride_completed')}
            disabled={phase === 'Completed'}
            className="flex flex-col items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium py-3 px-2 rounded-xl transition"
          >
            <Flag className="w-4 h-4 text-emerald-400" />
            Complete
          </button>
        </div>
      )}
    </div>
  );
};
