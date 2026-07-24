import React from 'react';
import type { ChatMessage } from '../../contexts/CommunicationContext';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface ChatBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isCurrentUser }) => {
  const { senderName, senderRole, text, timestamp, type } = message;

  // Render System message bubble
  if (type === 'System') {
    return (
      <div className="flex justify-center w-full my-2.5 select-none">
        <div className="px-3.5 py-1 rounded-full border border-brand-border/40 bg-brand-card/10 text-[9px] font-bold text-brand-muted tracking-wider uppercase backdrop-blur-sm shadow-sm">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col max-w-[75%] gap-1 my-1.5 text-left",
      isCurrentUser ? "self-end items-end" : "self-start items-start"
    )}>
      {/* Sender Header info (only if other user) */}
      {!isCurrentUser && senderName && (
        <div className="flex items-center gap-1.5 px-1 select-none">
          <span className="text-[10px] font-extrabold text-brand-text/95">
            {senderName}
          </span>
          <Badge variant={senderRole === 'driver' ? 'primary' : 'muted'} className="text-[8px] scale-90 px-1 py-0 select-none">
            {senderRole === 'driver' ? 'Driver' : 'Passenger'}
          </Badge>
        </div>
      )}

      {/* Bubble container */}
      <div className={cn(
        "px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm backdrop-blur-sm",
        isCurrentUser 
          ? "bg-brand-primary/15 border border-brand-primary/20 text-brand-text rounded-tr-none" 
          : "bg-white/[0.03] border border-brand-border/60 text-brand-textMuted rounded-tl-none"
      )}>
        <p className="whitespace-pre-wrap break-words">{text}</p>
      </div>

      {/* Timestamp */}
      <span className="text-[8px] text-brand-muted px-1 font-bold select-none leading-none">
        {timestamp}
      </span>

    </div>
  );
};
export default ChatBubble;
