import React from 'react';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const ConnectionStatus: React.FC<{ showLabel?: boolean }> = ({ showLabel = true }) => {
  const { status } = useConnectionStatus();

  switch (status) {
    case 'CONNECTED':
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <Wifi className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
          {showLabel && <span>Live Real-Time</span>}
        </div>
      );
    case 'RECONNECTING':
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
          {showLabel && <span>Reconnecting...</span>}
        </div>
      );
    case 'CONNECTING':
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
          {showLabel && <span>Connecting...</span>}
        </div>
      );
    case 'DISCONNECTED':
    default:
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <WifiOff className="w-3.5 h-3.5 text-rose-500" />
          {showLabel && <span>Offline</span>}
        </div>
      );
  }
};
