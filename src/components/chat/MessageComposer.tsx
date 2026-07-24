import React, { useState, useRef } from 'react';
import type { ChatMessage } from '../../types/chat';
import { Send, X, Smile, Paperclip } from 'lucide-react';

interface MessageComposerProps {
  onSendMessage: (content: string, replyToId?: string) => Promise<boolean>;
  onTyping: (isTyping: boolean) => void;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onTyping,
  replyingTo,
  onCancelReply,
}) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping(e.target.value.length > 0);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const success = await onSendMessage(text, replyingTo?.id);
      if (success) {
        setText('');
        onCancelReply();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-slate-900 border-t border-slate-800 p-3">
      {/* Replying Banner */}
      {replyingTo && (
        <div className="mb-2 p-2 bg-slate-800/90 rounded-xl flex items-center justify-between border-l-4 border-emerald-500 text-xs">
          <div className="line-clamp-1">
            <span className="font-semibold text-emerald-400">Replying to {replyingTo.sender_name || 'User'}: </span>
            <span className="text-slate-300">{replyingTo.content}</span>
          </div>
          <button onClick={onCancelReply} className="p-1 hover:text-slate-100 text-slate-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-end gap-2">
        <div className="flex-1 bg-slate-950 border border-slate-800 focus-within:border-emerald-500/60 rounded-2xl px-3 py-2 flex items-end gap-2 transition">
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-200 transition rounded-full hover:bg-slate-800/50"
            title="Attach File (Placeholder)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-white text-sm focus:outline-none resize-none max-h-24 overflow-y-auto leading-relaxed"
          />

          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-200 transition rounded-full hover:bg-slate-800/50"
            title="Emoji (Placeholder)"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
