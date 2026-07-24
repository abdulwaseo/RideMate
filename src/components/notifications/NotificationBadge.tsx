import React from 'react';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, className = '' }) => {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span
      className={`inline-flex items-center justify-center bg-red-500 text-white font-bold text-[10px] min-w-[18px] h-[18px] px-1.5 rounded-full ring-2 ring-slate-950 animate-pulse ${className}`}
    >
      {displayCount}
    </span>
  );
};
