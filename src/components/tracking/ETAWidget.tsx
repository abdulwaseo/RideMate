import React from 'react';
import type { ETAData } from '../../types/tracking';
import { Clock, AlertTriangle } from 'lucide-react';

function formatETA(isoString?: string): string {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatMinutes(mins?: number | null): string {
  if (mins == null) return '—';
  if (mins < 1) return '< 1 min';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

interface ETAWidgetProps {
  etaData: ETAData | null;
  isLoading?: boolean;
  className?: string;
}

export const ETAWidget: React.FC<ETAWidgetProps> = ({ etaData, isLoading, className = '' }) => {
  const countdown = formatMinutes(etaData?.eta_minutes);
  const arrivalTime = formatETA(etaData?.current_eta_iso);
  const isDelayed = etaData?.is_delayed;

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ETA</span>
        </div>
        {isDelayed && (
          <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 rounded-full px-2 py-0.5">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            <span className="text-[10px] font-bold text-orange-400">Delayed</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="h-10 bg-slate-800 rounded-lg animate-pulse" />
      ) : (
        <div className="flex items-end gap-3">
          <span className="text-4xl font-black text-white tracking-tight leading-none">
            {countdown}
          </span>
          {etaData?.current_eta_iso && (
            <span className="text-sm text-slate-400 pb-1">Arriving {arrivalTime}</span>
          )}
        </div>
      )}

      {etaData?.remaining_distance_km != null && (
        <p className="text-xs text-slate-500 mt-2">
          {etaData.remaining_distance_km.toFixed(1)} km remaining
        </p>
      )}
    </div>
  );
};
