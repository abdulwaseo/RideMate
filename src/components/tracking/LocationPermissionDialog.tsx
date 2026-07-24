import React from 'react';
import { useMapContext } from '../../contexts/MapContext';

export const LocationPermissionDialog: React.FC = () => {
  const { permissionStatus, gpsError, requestGpsPermission } = useMapContext();

  if (permissionStatus === 'granted' && !gpsError) return null;

  return (
    <div className="bg-gray-900/95 border border-amber-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-2xl text-left space-y-4 max-w-md mx-auto">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <div>
          <h3 className="text-base font-bold text-white">GPS Location Required</h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            RideMate requires active location access to broadcast your live route progress to matched passengers.
          </p>
        </div>
      </div>

      {gpsError && (
        <div className="bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl p-3">
          {gpsError}
        </div>
      )}

      {permissionStatus === 'denied' ? (
        <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-500/20 rounded-xl p-3 space-y-1">
          <p className="font-semibold">Permission denied in browser settings.</p>
          <p className="text-gray-400">To fix: Click the lock icon in your browser address bar and enable Location access for this site.</p>
        </div>
      ) : (
        <button
          onClick={requestGpsPermission}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg"
        >
          Grant Location Permission
        </button>
      )}
    </div>
  );
};
