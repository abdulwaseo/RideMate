import React from 'react';
import type { ChatRoom } from '../../types/chat';
import { RealtimeIndicator } from '../websocket/RealtimeIndicator';
import { Users, Car, Clock } from 'lucide-react';

interface ChatHeaderProps {
  room: ChatRoom;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ room }) => {
  const driver = room.participants.find((p) => p.role.toLowerCase() === 'driver');

  return (
    <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
          <Car className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Ride Chat Room</h2>
            <RealtimeIndicator size="sm" />
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>Driver: {driver ? driver.name : 'Verified Driver'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              {room.participants.length} Participants
            </span>
          </p>
        </div>
      </div>

      {room.expires_at && (
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          <span>Expires 24h post ride</span>
        </div>
      )}
    </div>
  );
};
