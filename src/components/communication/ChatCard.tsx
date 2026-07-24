import React from 'react';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Calendar, Clock, MapPin, Navigation } from 'lucide-react';
import type { ChatRoom } from '../../contexts/CommunicationContext';
import { cn } from '../../utils/cn';

interface ChatCardProps {
  room: ChatRoom;
  onClick: () => void;
  className?: string;
}

export const ChatCard: React.FC<ChatCardProps> = ({ room, onClick, className }) => {
  const { pickupArea, destination, date, time, driver, lastMessage, unreadCount, lastActivity } = room;

  return (
    <Card 
      onClick={onClick}
      hoverEffect={true} 
      className={cn(
        "border border-brand-border/40 p-4.5 cursor-pointer bg-brand-card/20 text-left hover:border-brand-primary/30 flex gap-4 items-center relative overflow-hidden transition-all duration-200 select-none", 
        unreadCount > 0 && "bg-brand-primary/[0.02] border-brand-primary/20",
        className
      )}
    >
      {/* Side Glow for Unread Messages */}
      {unreadCount > 0 && (
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-brand-primary" />
      )}

      {/* Driver Avatar */}
      <Avatar name={driver.name} isOnline={room.rideStatus === 'Active'} size="lg" className="shrink-0" />

      {/* Details section */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Route Headers */}
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide text-brand-text leading-none">
          <MapPin className="h-3.5 w-3.5 text-brand-primary shrink-0" />
          <span className="truncate max-w-[140px] sm:max-w-none">{pickupArea}</span>
          <Navigation className="h-3 w-3 text-brand-muted shrink-0 rotate-90" />
          <span className="truncate max-w-[140px] sm:max-w-none">{destination}</span>
        </div>

        {/* Date Time info */}
        <div className="flex items-center gap-3 text-[10px] text-brand-textMuted font-bold">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{time}</span>
          </div>
        </div>

        {/* Message preview */}
        <p className="text-xs text-brand-muted truncate max-w-full">
          {lastMessage ? (
            <span>
              <strong className="text-brand-textMuted font-semibold">
                {lastMessage.senderName ? `${lastMessage.senderName}: ` : ''}
              </strong>
              {lastMessage.text}
            </span>
          ) : (
            <span className="italic">No messages yet</span>
          )}
        </p>
      </div>

      {/* Right Stats (Time & Unread count) */}
      <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
        <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wide">
          {lastActivity}
        </span>
        {unreadCount > 0 && (
          <span className="h-5 min-w-5 rounded-full bg-brand-primary text-[10px] font-extrabold text-brand-bg flex items-center justify-center px-1.5 animate-pulse">
            {unreadCount}
          </span>
        )}
      </div>

    </Card>
  );
};
export default ChatCard;
