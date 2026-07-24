import React from 'react';
import { useMapContext } from '../../contexts/MapContext';

export const RouteSummaryBadge: React.FC = () => {
  const { currentRoute, selectAlternativeRoute } = useMapContext();

  if (!currentRoute) return null;

  return (
    <div className="absolute bottom-6 left-6 right-6 z-10 md:left-6 md:right-auto md:max-w-md bg-gray-900/90 border border-gray-700/80 text-gray-100 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-3">
      {/* Route Metrics Row */}
      <div className="flex items-center justify-between space-x-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Distance</span>
            <span className="text-base font-bold text-indigo-400">{currentRoute.distance_km} km</span>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-700"></div>

        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">ETA</span>
            <span className="text-base font-bold text-emerald-400">{currentRoute.estimated_duration} mins</span>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-700"></div>

        <div className="text-right">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Suggested</span>
          <span className="text-base font-extrabold text-amber-400">
            PKR {currentRoute.fare_estimate.recommended_fare}
          </span>
        </div>
      </div>

      {/* Alternative Routes Selector */}
      {currentRoute.alternative_routes && currentRoute.alternative_routes.length > 0 && (
        <div className="border-t border-gray-800 pt-2.5">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">
            Alternative Routes Available
          </span>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {currentRoute.alternative_routes.map((alt, idx) => (
              <button
                key={alt.route_id}
                onClick={() => selectAlternativeRoute(alt.route_id)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-300 font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5"
              >
                <span>Alt {idx + 1}:</span>
                <span className="text-indigo-400">{alt.distance_km}km</span>
                <span className="text-gray-500">•</span>
                <span className="text-emerald-400">{alt.estimated_duration}m</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
