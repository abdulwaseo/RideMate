import React from 'react';
import { BellOff } from 'lucide-react';

interface NotificationEmptyStateProps {
  title?: string;
  description?: string;
}

export const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = ({
  title = 'No Notifications Yet',
  description = "You're all caught up! Incoming booking requests, ride alerts, and chat updates will appear here in real-time.",
}) => {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-slate-800 bg-slate-900/30 rounded-2xl py-16 px-6 text-center select-none">
      <div className="p-4 rounded-full bg-slate-800/80 border border-slate-700/50 mb-4 text-slate-500 shadow-inner">
        <BellOff className="h-8 w-8 text-emerald-400" />
      </div>
      <h3 className="text-base font-bold text-slate-200 mb-2">{title}</h3>
      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{description}</p>
    </div>
  );
};
