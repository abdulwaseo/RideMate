import React from 'react';
import { MapPin } from 'lucide-react';

interface DistanceWidgetProps {
  remainingKm?: number | null;
  totalKm?: number | null;
  className?: string;
}

export const DistanceWidget: React.FC<DistanceWidgetProps> = ({
  remainingKm,
  totalKm,
  className = '',
}) => {
  const traveled = totalKm != null && remainingKm != null ? Math.max(0, totalKm - remainingKm) : null;

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Distance</span>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-black text-white tracking-tight leading-none">
          {remainingKm != null ? `${remainingKm.toFixed(1)}` : '—'}
        </span>
        <span className="text-sm text-slate-400 pb-0.5">km left</span>
      </div>

      {traveled != null && (
        <p className="text-xs text-slate-500 mt-1">
          {traveled.toFixed(1)} km covered{totalKm ? ` of ${totalKm.toFixed(1)} km` : ''}
        </p>
      )}
    </div>
  );
};
