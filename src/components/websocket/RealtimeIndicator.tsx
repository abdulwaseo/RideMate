import React from 'react';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';

export const RealtimeIndicator: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const { isConnected } = useConnectionStatus();

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }[size];

  if (!isConnected) {
    return <span className={`inline-block rounded-full bg-slate-500/50 ${sizeClasses}`} />;
  }

  return (
    <span className="relative flex items-center justify-center">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75`} />
      <span className={`relative inline-flex rounded-full bg-emerald-500 ${sizeClasses}`} />
    </span>
  );
};
