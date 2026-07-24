import React from 'react';
import type { TypingUser } from '../../types/chat';

export const TypingIndicator: React.FC<{ users?: TypingUser[] }> = ({ users = [] }) => {
  if (!users || users.length === 0) return null;

  const names = users.map((u) => u.user_name).join(', ');

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-emerald-400 bg-slate-900/60 rounded-full border border-emerald-500/20 w-fit animate-pulse">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
      </div>
      <span>{names} {users.length > 1 ? 'are' : 'is'} typing...</span>
    </div>
  );
};
