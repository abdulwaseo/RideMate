import React from 'react';
import { Signal, Wifi, WifiOff } from 'lucide-react';

interface ConnectionQualityBadgeProps {
  gpsQuality?: 'excellent' | 'good' | 'poor' | 'unavailable';
  wsConnected?: boolean;
  className?: string;
}

const GPS_LABELS = {
  excellent: 'GPS Excellent',
  good: 'GPS Good',
  poor: 'GPS Poor',
  unavailable: 'No GPS',
};

const GPS_COLORS = {
  excellent: 'text-emerald-400',
  good: 'text-yellow-400',
  poor: 'text-orange-400',
  unavailable: 'text-red-400',
};

function getGPSQuality(accuracy?: number | null): 'excellent' | 'good' | 'poor' | 'unavailable' {
  if (accuracy == null) return 'unavailable';
  if (accuracy <= 5) return 'excellent';
  if (accuracy <= 15) return 'good';
  return 'poor';
}

export const ConnectionQualityBadge: React.FC<ConnectionQualityBadgeProps & { accuracy?: number | null }> = ({
  gpsQuality,
  wsConnected = true,
  accuracy,
  className = '',
}) => {
  const quality = gpsQuality ?? getGPSQuality(accuracy);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* GPS */}
      <div className={`flex items-center gap-1 text-xs font-medium ${GPS_COLORS[quality]}`}>
        <Signal className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{GPS_LABELS[quality]}</span>
      </div>

      {/* WebSocket */}
      <div className={`flex items-center gap-1 text-xs font-medium ${wsConnected ? 'text-emerald-400' : 'text-red-400'}`}>
        {wsConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">{wsConnected ? 'Live' : 'Offline'}</span>
      </div>
    </div>
  );
};
