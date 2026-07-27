import React, { useState } from 'react';
import type { ChatMessage } from '../../types/chat';
import { ReadReceipt } from './ReadReceipt';
import { useAuth } from '../../hooks/useAuth';
import { Reply, Edit2, Trash2, Check, X, Clock, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  onReply?: (msg: ChatMessage) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onReply,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const isSelf = Boolean(user?.id && message.sender_id === user.id);
  const isSystem = message.message_type === 'SYSTEM' || message.message_type === 'RIDE_UPDATE';

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  if (isSystem) {
    return (
      <div className="my-3 text-center">
        <span className="inline-block px-3 py-1 text-xs font-medium bg-slate-800/80 text-emerald-400 border border-slate-700/50 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(message.id, editText.trim());
      setIsEditing(false);
    }
  };

  const dateObj = message.created_at ? new Date(message.created_at) : new Date();
  const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
  const formattedTime = validDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`group flex flex-col my-1.5 ${isSelf ? 'items-end' : 'items-start'}`}>
      {!isSelf && (
        <span className="text-[11px] font-semibold text-slate-400 ml-1 mb-0.5">
          {message.sender_name || 'Participant'}
        </span>
      )}

      <div
        className={`relative max-w-[82%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all ${
          isSelf
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none'
            : 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-tl-none'
        }`}
      >
        {/* Reply Preview */}
        {message.reply_to && (
          <div className="mb-2 p-2 bg-black/10 rounded-lg text-xs border-l-2 border-emerald-400">
            <p className="font-semibold text-emerald-300">{message.reply_to.sender_name || 'User'}</p>
            <p className="line-clamp-1 opacity-90">{message.reply_to.content}</p>
          </div>
        )}

        {/* Message Edit Form or Content */}
        {isEditing ? (
          <div className="flex items-center gap-1.5 min-w-[200px]">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-slate-900 text-white text-xs px-2 py-1 rounded border border-emerald-500/50 focus:outline-none"
              autoFocus
            />
            <button onClick={handleSaveEdit} className="p-1 hover:text-emerald-400">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setIsEditing(false)} className="p-1 hover:text-rose-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        )}

        {/* Message Footer */}
        <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-75">
          {message.is_edited && <span className="italic font-medium">edited</span>}
          <span>{formattedTime}</span>
          {isSelf && (
            message.status === 'sending' ? (
              <Clock className="w-3 h-3 text-slate-300 animate-pulse ml-1 inline-block" />
            ) : message.status === 'failed' ? (
              <span className="flex items-center gap-0.5 text-rose-400 font-semibold ml-1">
                <AlertCircle className="w-3 h-3" />
                Failed
              </span>
            ) : (
              <ReadReceipt readCount={message.read_count} readByMe={message.read_by_me} />
            )
          )}
        </div>

        {/* Hover Action Toolbar */}
        {!isEditing && !message.is_deleted && (
          <div
            className={`absolute top-1 ${
              isSelf ? '-left-16' : '-right-16'
            } hidden group-hover:flex items-center gap-1 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-lg shadow-lg z-10`}
          >
            {onReply && (
              <button
                onClick={() => onReply(message)}
                className="p-1 text-slate-400 hover:text-emerald-400 transition"
                title="Reply"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            )}

            {isSelf && onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-slate-400 hover:text-teal-400 transition"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {isSelf && onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="p-1 text-slate-400 hover:text-rose-400 transition"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
