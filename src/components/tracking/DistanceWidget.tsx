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
    <div className={`bg-brand-surface border border-slate-200 rounded-2xl p-3 sm:p-4 ${className}`}>
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
        <MapPin className="w-4 h-4 text-blue-400" />
        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Distance</span>
      </div>

      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
          {remainingKm != null ? `${remainingKm.toFixed(1)}` : '—'}
        </span>
        <span className="text-xs sm:text-sm text-slate-400">km left</span>
      </div>

      {traveled != null && (
        <p className="text-xs text-slate-500 mt-1">
          {traveled.toFixed(1)} km covered{totalKm ? ` of ${totalKm.toFixed(1)} km` : ''}
        </p>
      )}
    </div>
  );
};
