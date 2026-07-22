import React from 'react';
import { cn } from '../../utils/cn';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = 'card',
}) => {
  return (
    <div
      className={cn(
        "animate-pulse bg-brand-surface border border-brand-border/30",
        variant === 'text' && "h-4 w-3/4 rounded-md",
        variant === 'card' && "h-32 w-full rounded-2xl",
        variant === 'circle' && "h-12 w-12 rounded-full",
        className
      )}
    />
  );
};
