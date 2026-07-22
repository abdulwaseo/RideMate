import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <Card
      hoverEffect={false}
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 border border-dashed border-brand-border",
        className
      )}
    >
      {Icon && (
        <div className="p-4 rounded-full bg-white/[0.02] border border-brand-border/40 text-brand-primary mb-4">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <h3 className="text-lg font-bold text-brand-text mb-1.5">{title}</h3>
      <p className="text-sm text-brand-textMuted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="glass" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Card>
  );
};
