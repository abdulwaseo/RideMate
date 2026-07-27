import React from 'react';
import { useMapContext } from '../../contexts/MapContext';
import { GPSIndicator } from './GPSIndicator';

export const TrackingStatus: React.FC = () => {
  const { driverLocation, trackingStatus, autoFollow, setAutoFollow, centerMap } = useMapContext();

  const speedKmh = driverLocation?.speed ? Math.round(driverLocation.speed * 3.6) : 0;

  return (
    <div className="bg-white/90 border border-slate-200 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-3 text-xs text-slate-800">
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
              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-600'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          {autoFollow ? '🎯 Auto-Follow ON' : '🎯 Auto-Follow OFF'}
        </button>
      </div>

      {trackingStatus === 'tracking' && driverLocation && (
        <div className="grid grid-cols-3 gap-2 bg-slate-50/80 border border-slate-200 rounded-xl p-2.5 text-center">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Speed</span>
            <span className="text-sm font-extrabold text-indigo-600">{speedKmh} km/h</span>
          </div>
          <div className="border-x border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Heading</span>
            <span className="text-sm font-extrabold text-emerald-600">{Math.round(driverLocation.heading || 0)}°</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Accuracy</span>
            <span className="text-sm font-extrabold text-amber-600">±{Math.round(driverLocation.accuracy || 0)}m</span>
          </div>
        </div>
      )}
    </div>
  );
};
