import React from 'react';

export const UnreadBadge: React.FC<{ count?: number }> = ({ count = 0 }) => {
  if (!count || count <= 0) return null;

  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500 text-white shadow-sm">
      {count > 99 ? '99+' : count}
    </span>
  );
};
