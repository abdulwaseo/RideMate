import React from 'react';
import { cn } from '../../utils/cn';

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  className,
  title,
  description,
  actions,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-brand-border/40 mb-8",
        className
      )}
      {...props}
    >
      <div className="space-y-1.5 text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-brand-textMuted max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};
