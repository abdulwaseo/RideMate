import React, { useState } from 'react';
import type { ChatRoom } from '../../types/chat';
import { UnreadBadge } from './UnreadBadge';
import { RealtimeIndicator } from '../websocket/RealtimeIndicator';
import { MessageSquare, Search, Car } from 'lucide-react';

interface ChatSidebarProps {
  rooms: ChatRoom[];
  activeRoomId?: string;
  onSelectRoom: (roomId: string) => void;
  isLoading?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = rooms.filter((r) => {
    const term = searchQuery.toLowerCase();
    const participants = r.participants.map((p) => p.name.toLowerCase()).join(' ');
    return participants.includes(term) || r.ride_id.toLowerCase().includes(term);
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            Ride Chats
          </h2>
          <RealtimeIndicator size="sm" />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-sm pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500/50 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-3 p-3 animate-pulse rounded-xl">
                <div className="w-12 h-12 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-2/3" />
                  <div className="h-2 bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
            <Car className="w-10 h-10 text-slate-600" />
            <p className="text-sm text-slate-500">
              {searchQuery ? 'No conversations match your search.' : 'No ride chats yet. Book a ride to start chatting!'}
            </p>
          </div>
        ) : (
          <ul className="p-2 space-y-1">
            {filtered.map((room) => {
              const isActive = room.id === activeRoomId;
              const driver = room.participants.find((p) => p.role.toLowerCase() === 'driver');
              const lastContent = room.last_message?.content;
              const lastTime = room.last_message?.created_at;

              return (
                <li key={room.id}>
                  <button
                    onClick={() => onSelectRoom(room.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition group ${
                      isActive
                        ? 'bg-emerald-600/15 border border-emerald-500/25'
                        : 'hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                        <Car className="w-5 h-5" />
                      </div>
                      {room.is_active && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-semibold text-slate-100 truncate">
                          {driver ? driver.name : 'Ride Room'}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                          {lastTime && (
                            <span className="text-[10px] text-slate-500">{timeAgo(lastTime)}</span>
                          )}
                          <UnreadBadge count={room.unread_count} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {lastContent || `${room.participants.length} participants • Active chat`}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
