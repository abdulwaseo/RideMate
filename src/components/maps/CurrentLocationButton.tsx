import React from 'react';
import { useMapContext } from '../../contexts/MapContext';

export const CurrentLocationButton: React.FC = () => {
  const { requestUserLocation, isLocatingUser, locationPermissionError } = useMapContext();

  return (
    <div className="relative inline-block">
      <button
        onClick={() => requestUserLocation()}
        disabled={isLocatingUser}
        title="Recenter to Current Location"
        className="p-3 bg-gray-900/90 hover:bg-gray-800 text-indigo-400 border border-gray-700/80 rounded-xl shadow-lg backdrop-blur-md transition-all duration-200 flex items-center justify-center group disabled:opacity-50"
      >
        {isLocatingUser ? (
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg
            className="w-5 h-5 group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )}
      </button>

      {locationPermissionError && (
        <div className="absolute right-0 top-14 w-64 bg-red-950/90 border border-red-500/30 text-red-200 text-xs rounded-xl p-3 shadow-xl backdrop-blur-md z-50">
          <p>{locationPermissionError}</p>
        </div>
      )}
    </div>
  );
};
