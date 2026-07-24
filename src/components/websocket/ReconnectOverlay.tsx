import React from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { RefreshCw, WifiOff } from 'lucide-react';

export const ReconnectOverlay: React.FC = () => {
  const { status, reconnect } = useWebSocket();

  if (status !== 'RECONNECTING' && status !== 'DISCONNECTED') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl space-y-4">
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-500">
          {status === 'RECONNECTING' ? (
            <RefreshCw className="w-7 h-7 animate-spin" />
          ) : (
            <WifiOff className="w-7 h-7" />
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">
            {status === 'RECONNECTING' ? 'Reconnecting to Server' : 'Connection Disconnected'}
          </h3>
          <p className="text-sm text-slate-400">
            {status === 'RECONNECTING'
              ? 'Attempting to restore live real-time stream...'
              : 'Real-time WebSocket server connection lost.'}
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={reconnect}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20"
          >
            Reconnect Now
          </button>
        </div>
      </div>
    </div>
  );
};
