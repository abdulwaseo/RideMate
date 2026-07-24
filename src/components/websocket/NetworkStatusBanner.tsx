import React from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WifiOff, RefreshCw } from 'lucide-react';

export const NetworkStatusBanner: React.FC = () => {
  const { status, reconnect } = useWebSocket();

  if (status === 'CONNECTED') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white text-xs py-2 px-4 shadow-md flex items-center justify-between z-50">
      <div className="flex items-center gap-2 font-medium">
        {status === 'RECONNECTING' || status === 'CONNECTING' ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>WebSocket stream interrupted. Attempting automatic reconnection...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>WebSocket real-time connection lost. Live updates paused.</span>
          </>
        )}
      </div>

      {status === 'DISCONNECTED' && (
        <button
          onClick={reconnect}
          className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-white font-semibold transition"
        >
          Retry Connect
        </button>
      )}
    </div>
  );
};
