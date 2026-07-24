import React from 'react';
import { useMapContext } from '../../contexts/MapContext';
import { GPSIndicator } from './GPSIndicator';

export const TrackingStatus: React.FC = () => {
  const { driverLocation, trackingStatus, autoFollow, setAutoFollow, centerMap } = useMapContext();

  const speedKmh = driverLocation?.speed ? Math.round(driverLocation.speed * 3.6) : 0;

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-3 text-xs text-gray-200">
      <div className="flex items-center justify-between">
        <GPSIndicator />

        <button
          onClick={() => {
            const newFollow = !autoFollow;
            setAutoFollow(newFollow);
            if (newFollow && driverLocation) {
              centerMap({ lat: driverLocation.latitude, lng: driverLocation.longitude }, 16);
            }
          }}
          className={`px-3 py-1.5 rounded-xl border font-semibold text-[11px] transition-all ${
            autoFollow
              ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
          }`}
        >
          {autoFollow ? '🎯 Auto-Follow ON' : '🎯 Auto-Follow OFF'}
        </button>
      </div>

      {trackingStatus === 'tracking' && driverLocation && (
        <div className="grid grid-cols-3 gap-2 bg-gray-950/60 border border-gray-800 rounded-xl p-2.5 text-center">
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Speed</span>
            <span className="text-sm font-extrabold text-indigo-400">{speedKmh} km/h</span>
          </div>
          <div className="border-x border-gray-800">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Heading</span>
            <span className="text-sm font-extrabold text-emerald-400">{Math.round(driverLocation.heading || 0)}°</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Accuracy</span>
            <span className="text-sm font-extrabold text-amber-400">±{Math.round(driverLocation.accuracy || 0)}m</span>
          </div>
        </div>
      )}
    </div>
  );
};
