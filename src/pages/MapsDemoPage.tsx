import React from 'react';
import { MapProvider, useMapContext } from '../contexts/MapContext';
import { MapContainer, LocationSearchInput, FareEstimateCard } from '../components/maps';
import { TrackingStatus, LocationPermissionDialog } from '../components/tracking';
import type { LocationData } from '../types/location';

const MapsDemoContent: React.FC = () => {
  const {
    selectedPickup,
    setSelectedPickup,
    selectedDestination,
    setSelectedDestination,
    calculateRoute,
    isCalculatingRoute,
    routeError,
    currentRoute,
    trackingStatus,
    startDriverTracking,
    stopDriverTracking,
  } = useMapContext();

  const handleCalculateRoute = () => {
    if (selectedPickup && selectedDestination) {
      calculateRoute(selectedPickup, selectedDestination);
    }
  };

  const toggleTracking = () => {
    if (trackingStatus === 'tracking') {
      stopDriverTracking();
    } else {
      startDriverTracking('demo_ride_9c');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-gray-800 pb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                Sprint 9C
              </span>
              <span className="text-xs text-gray-500">Live GPS Telemetry & Tracking Foundation</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Maps & GPS Tracking Command Center
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Google Maps API, Route polyline engine, intelligent fare matrix, and real-time GPS telemetry broadcast.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTracking}
              className={`px-5 py-3 rounded-xl border text-xs font-bold transition-all shadow-xl flex items-center space-x-2 ${
                trackingStatus === 'tracking'
                  ? 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse"></span>
              <span>{trackingStatus === 'tracking' ? 'Stop GPS Simulation' : 'Simulate Live Driver GPS'}</span>
            </button>

            <button
              onClick={handleCalculateRoute}
              disabled={!selectedPickup || !selectedDestination || isCalculatingRoute}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xl transition-all flex items-center space-x-2"
            >
              {isCalculatingRoute ? (
                <span>Calculating...</span>
              ) : (
                <span>Calculate Route & Fare</span>
              )}
            </button>
          </div>
        </div>

        <LocationPermissionDialog />

        {routeError && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-300 text-sm rounded-xl p-4 flex items-center space-x-3">
            <span>{routeError}</span>
          </div>
        )}

        {/* Search Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/60 p-6 rounded-2xl border border-gray-800 backdrop-blur-xl">
          <div>
            <LocationSearchInput
              label="Pickup Location"
              placeholder="Search pickup point (e.g., Clifton Beach, Karachi)..."
              type="pickup"
              value={selectedPickup?.formatted_address || ''}
              onSelectLocation={(loc: LocationData) => {
                setSelectedPickup(loc);
                if (selectedDestination) calculateRoute(loc, selectedDestination);
              }}
              onClear={() => setSelectedPickup(null)}
            />
          </div>

          <div>
            <LocationSearchInput
              label="Destination Point"
              placeholder="Search destination point (e.g., Gulshan-e-Iqbal, Karachi)..."
              type="destination"
              value={selectedDestination?.formatted_address || ''}
              onSelectLocation={(loc: LocationData) => {
                setSelectedDestination(loc);
                if (selectedPickup) calculateRoute(selectedPickup, loc);
              }}
              onClear={() => setSelectedDestination(null)}
            />
          </div>
        </div>

        {/* Map Canvas & Side Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <MapContainer height="550px" />
            <TrackingStatus />
          </div>

          <div>
            {currentRoute ? (
              <FareEstimateCard />
            ) : (
              <div className="h-full min-h-[300px] bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-gray-500">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3 text-2xl">
                  🧭
                </div>
                <h4 className="text-sm font-semibold text-gray-300 mb-1">No Active Route Selected</h4>
                <p className="text-xs max-w-xs">Select pickup and destination points or click "Simulate Live Driver GPS" to test live telemetry streaming.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MapsDemoPage: React.FC = () => {
  return (
    <MapProvider>
      <MapsDemoContent />
    </MapProvider>
  );
};

export default MapsDemoPage;
