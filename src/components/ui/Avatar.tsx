import React from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  isOnline?: boolean;
  showBorder?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  className,
  src,
  name,
  size = 'md',
  isOnline,
  showBorder = false,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  const getInitials = (userName: string) => {
    return userName
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={cn("relative inline-block select-none", className)} {...props}>
      <div className={cn(
        "rounded-full flex items-center justify-center font-bold overflow-hidden bg-brand-surface border border-brand-border text-brand-textMuted",
        sizeClasses[size],
        showBorder && "border-2 border-brand-primary"
      )}>
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {isOnline !== undefined && (
        <span className={cn(
          "absolute bottom-0 right-0 block rounded-full ring-2 ring-brand-bg",
          isOnline ? "bg-brand-primary" : "bg-brand-muted",
          size === 'sm' && "h-2 w-2",
          size === 'md' && "h-2.5 w-2.5",
          size === 'lg' && "h-3.5 w-3.5"
        )} />
      )}
    </div>
  );
};
