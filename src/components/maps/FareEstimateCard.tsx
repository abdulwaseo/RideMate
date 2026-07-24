import React from 'react';
import { useMapContext } from '../../contexts/MapContext';
import type { VehicleType } from '../../types/route';

interface FareEstimateCardProps {
  className?: string;
  onVehicleChange?: (type: VehicleType) => void;
}

export const FareEstimateCard: React.FC<FareEstimateCardProps> = ({ className = '', onVehicleChange }) => {
  const { currentRoute, selectedVehicleType, setSelectedVehicleType, calculateRoute, isCalculatingRoute } = useMapContext();

  const vehicles: { type: VehicleType; label: string; icon: string }[] = [
    { type: 'car', label: 'Car', icon: '🚗' },
    { type: 'bike', label: 'Bike', icon: '🏍️' },
    { type: 'suv', label: 'SUV', icon: '🚙' },
    { type: 'van', label: 'Van', icon: '🚐' },
  ];

  const handleSelectVehicle = (type: VehicleType) => {
    setSelectedVehicleType(type);
    if (onVehicleChange) onVehicleChange(type);
    if (currentRoute) {
      calculateRoute(currentRoute.pickup_location, currentRoute.destination_location, type);
    }
  };

  if (!currentRoute) return null;

  const fare = currentRoute.fare_estimate;

  return (
    <div className={`bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Intelligent Fare Estimate</span>
          </h3>
          <p className="text-xs text-gray-400">Calculated based on distance, duration & vehicle type</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-emerald-400">
            {fare.currency} {fare.recommended_fare}
          </span>
          <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Recommended Fare</span>
        </div>
      </div>

      {/* Vehicle Type Selector */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
          Select Vehicle Type
        </label>
        <div className="grid grid-cols-4 gap-2">
          {vehicles.map((v) => {
            const isSelected = selectedVehicleType === v.type;
            return (
              <button
                key={v.type}
                onClick={() => handleSelectVehicle(v.type)}
                disabled={isCalculatingRoute}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg'
                    : 'bg-gray-800/40 border-gray-700/60 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <span className="text-lg">{v.icon}</span>
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fare Range (Min / Rec / Max) */}
      <div className="grid grid-cols-3 gap-3 bg-gray-950/60 border border-gray-800 rounded-xl p-3.5 text-center">
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Minimum</span>
          <span className="text-sm font-bold text-gray-300">{fare.currency} {fare.minimum_fare}</span>
        </div>
        <div className="border-x border-gray-800 px-2">
          <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">Suggested</span>
          <span className="text-base font-extrabold text-emerald-400">{fare.currency} {fare.recommended_fare}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Maximum</span>
          <span className="text-sm font-bold text-gray-300">{fare.currency} {fare.maximum_fare}</span>
        </div>
      </div>

      {/* Detailed Cost Breakdown */}
      <div className="space-y-2 border-t border-gray-800 pt-4 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Base Fare</span>
          <span className="text-gray-200">{fare.currency} {fare.base_fare}</span>
        </div>
        <div className="flex justify-between">
          <span>Distance ({currentRoute.distance_km} km)</span>
          <span className="text-gray-200">{fare.currency} {fare.distance_fare}</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Time ({currentRoute.estimated_duration} mins)</span>
          <span className="text-gray-200">{fare.currency} {fare.time_fare}</span>
        </div>
      </div>
    </div>
  );
};
