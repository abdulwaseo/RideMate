import React from 'react';

interface RideProgressBarProps {
  progressPercent?: number | null;
  className?: string;
  showLabel?: boolean;
}

export const RideProgressBar: React.FC<RideProgressBarProps> = ({
  progressPercent,
  className = '',
  showLabel = true,
}) => {
  const pct = Math.max(0, Math.min(100, progressPercent ?? 0));
  const isNearEnd = pct >= 85;

  return (
    <div className={`${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500 font-medium">Route Progress</span>
          <span className={`text-xs font-bold ${isNearEnd ? 'text-emerald-400' : 'text-slate-300'}`}>
            {pct.toFixed(0)}%
          </span>
        </div>
      )}

      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-in-out ${
            isNearEnd
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
              : 'bg-gradient-to-r from-blue-600 to-emerald-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Milestone markers */}
      <div className="relative mt-1 h-1.5">
        {[25, 50, 75].map((marker) => (
          <div
            key={marker}
            className={`absolute top-0 w-px h-full ${pct >= marker ? 'bg-emerald-500/40' : 'bg-slate-700'}`}
            style={{ left: `${marker}%` }}
          />
        ))}
      </div>
    </div>
  );
};
