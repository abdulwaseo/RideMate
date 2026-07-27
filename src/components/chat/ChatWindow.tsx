import React, { useEffect, useRef, useCallback } from 'react';
import type { ChatRoom, ChatMessage } from '../../types/chat';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';
import { ChatEmptyState } from './ChatEmptyState';
import { NetworkStatusBanner } from '../websocket/NetworkStatusBanner';

interface ChatWindowProps {
  room: ChatRoom;
  messages: ChatMessage[];
  typingUsers: { user_id: string; user_name: string }[];
  replyingTo: ChatMessage | null;
  onSendMessage: (content: string, replyToId?: string) => Promise<boolean>;
  onEditMessage: (messageId: string, newContent: string) => Promise<boolean>;
  onDeleteMessage: (messageId: string) => Promise<boolean>;
  onMarkRead: (ids: string[]) => void;
  onSetReplyTo: (msg: ChatMessage | null) => void;
  onTyping: (isTyping: boolean) => void;
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(dateStr, today.toISOString())) return 'Today';
  if (isSameDay(dateStr, yesterday.toISOString())) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  room,
  messages,
  typingUsers,
  replyingTo,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onMarkRead,
  onSetReplyTo,
  onTyping,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const readRequestedIdsRef = useRef<Set<string>>(new Set());

  // Mark visible messages as read
  useEffect(() => {
    const unread = messages
      .filter((m) => !m.read_by_me && m.message_type !== 'SYSTEM' && !readRequestedIdsRef.current.has(m.id))
      .map((m) => m.id);
    if (unread.length > 0) {
      unread.forEach((id) => readRequestedIdsRef.current.add(id));
      onMarkRead(unread);
    }
  }, [messages, onMarkRead]);

  const handleSendMessage = useCallback(
    async (content: string, replyToId?: string): Promise<boolean> => {
      return onSendMessage(content, replyToId);
    },
    [onSendMessage]
  );

  const isExpired = !room.is_active || (room.expires_at && new Date(room.expires_at) < new Date());

  return (
    <div className="flex flex-col h-full bg-brand-surface">
      {/* Header */}
      <ChatHeader room={room} />

      {/* Connection warning */}
      <NetworkStatusBanner />

      {/* Message Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
      >
        {messages.length === 0 ? (
          <ChatEmptyState variant="no-messages" />
        ) : (
          <>
            {messages.map((msg, idx) => {
              const showDateSep =
                idx === 0 || !isSameDay(messages[idx - 1].created_at, msg.created_at);

              return (
                <React.Fragment key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center justify-center my-4">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        {formatDateSeparator(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    onReply={onSetReplyTo}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                  />
                </React.Fragment>
              );
            })}
          </>
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="pt-1 pl-1">
            <TypingIndicator users={typingUsers} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer — disabled when room expired */}
      {isExpired ? (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600">This chat room has expired. Messaging is closed.</p>
        </div>
      ) : (
        <MessageComposer
          onSendMessage={handleSendMessage}
          onTyping={onTyping}
          replyingTo={replyingTo}
          onCancelReply={() => onSetReplyTo(null)}
        />
      )}
    </div>
  );
};
