import React, { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number; // Animation duration in ms
  icon?: LucideIcon;
  description?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  duration = 1500,
  icon: Icon,
  description,
  className,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  // Format count with commas
  const formattedCount = count.toLocaleString();

  return (
    <Card className={cn("flex flex-col relative", className)}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-semibold tracking-wide text-brand-textMuted uppercase">
          {title}
        </span>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-brand-border/40 text-brand-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-1 mb-1.5">
        <span className="text-4xl font-extrabold tracking-tight text-brand-text">
          {prefix}{formattedCount}{suffix}
        </span>
      </div>

      {description && (
        <p className="text-xs text-brand-muted leading-normal text-left">
          {description}
        </p>
      )}
    </Card>
  );
};
