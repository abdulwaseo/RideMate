import React from 'react';
import { cn } from '../../utils/cn';

type BadgeVariant = 'primary' | 'accent' | 'muted' | 'success' | 'warning';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'muted',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border select-none';

  const variants = {
    primary: 'bg-brand-primary/10 border-brand-primary/20 text-brand-primaryLight',
    accent: 'bg-brand-accent/10 border-brand-accent/20 text-brand-accentLight',
    muted: 'bg-white/[0.03] border-white/[0.06] text-brand-textMuted',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};
