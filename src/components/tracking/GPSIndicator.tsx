import React from 'react';
import { useMapContext } from '../../contexts/MapContext';

export const GPSIndicator: React.FC = () => {
  const { trackingStatus, driverLocation } = useMapContext();

  const getStatusColor = () => {
    switch (trackingStatus) {
      case 'tracking':
        return 'bg-emerald-500 text-emerald-400 border-emerald-500/30';
      case 'locating':
        return 'bg-amber-500 text-amber-400 border-amber-500/30';
      case 'error':
        return 'bg-red-500 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="flex items-center space-x-2 bg-white/90 border border-slate-200 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-lg">
      <div className="relative flex items-center justify-center">
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`}></div>
        {trackingStatus === 'tracking' && (
          <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
        )}
      </div>

      <div className="flex flex-col text-left">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
          {trackingStatus === 'tracking'
            ? 'GPS Active'
            : trackingStatus === 'locating'
            ? 'Acquiring Signal'
            : trackingStatus === 'error'
            ? 'GPS Error'
            : 'GPS Idle'}
        </span>
        {driverLocation?.accuracy && (
          <span className="text-[9px] text-slate-500">±{Math.round(driverLocation.accuracy)}m accuracy</span>
        )}
      </div>
    </div>
  );
};
