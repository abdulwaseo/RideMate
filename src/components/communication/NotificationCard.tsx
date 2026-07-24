import React from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Car, 
  UserCheck, 
  Settings, 
  MessageSquare, 
  Info, 
  Trash2, 
  MailOpen,
  ArrowUpRight
} from 'lucide-react';
import type { Notification } from '../../contexts/CommunicationContext';
import { cn } from '../../utils/cn';

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: () => void;
  onDelete: () => void;
  onActionClick?: (url: string) => void;
  className?: string;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkRead,
  onDelete,
  onActionClick,
  className,
}) => {
  const { category, title, description, timestamp, isRead, actionUrl } = notification;

  // Category Icon selector
  const getIcon = () => {
    switch (category) {
      case 'Ride':
        return <Car className="h-4.5 w-4.5 text-brand-primaryLight" />;
      case 'Booking':
        return <UserCheck className="h-4.5 w-4.5 text-brand-accentLight" />;
      case 'System':
        return <Settings className="h-4.5 w-4.5 text-blue-400" />;
      case 'Chat':
        return <MessageSquare className="h-4.5 w-4.5 text-emerald-400" />;
      default:
        return <Info className="h-4.5 w-4.5 text-brand-textMuted" />;
    }
  };

  const categoryColors = {
    Ride: 'primary' as const,
    Booking: 'accent' as const,
    System: 'muted' as const,
    Chat: 'success' as const,
    General: 'muted' as const,
  };

  return (
    <Card 
      hoverEffect={false} 
      className={cn(
        "border border-brand-border/40 p-4.5 bg-brand-card/25 text-left flex gap-4 items-start relative overflow-hidden transition-all duration-200 select-none",
        !isRead && "bg-brand-primary/[0.02] border-brand-primary/20",
        className
      )}
    >
      {/* Dynamic Category Color indicator dot/border */}
      {!isRead && (
        <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
      )}

      {/* Left Icon box */}
      <div className="p-2.5 rounded-xl border border-brand-border bg-white/[0.01] shrink-0">
        {getIcon()}
      </div>

      {/* Center Details */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={categoryColors[category]} className="text-[8px] tracking-wide uppercase select-none">
            {category}
          </Badge>
          <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider">
            {timestamp}
          </span>
        </div>

        <h3 className={cn("text-xs font-bold leading-tight", !isRead ? "text-brand-text" : "text-brand-textMuted")}>
          {title}
        </h3>

        <p className="text-xs text-brand-muted leading-relaxed break-words">
          {description}
        </p>

        {/* Action Button if provided */}
        {actionUrl && onActionClick && (
          <button 
            onClick={() => onActionClick(actionUrl)}
            className="text-[10px] text-brand-accent hover:text-brand-accentLight font-extrabold uppercase tracking-wide flex items-center gap-1.5 pt-1.5"
          >
            <span>View Details</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Right Actions Panel */}
      <div className="flex sm:flex-col items-center gap-2 shrink-0 self-center sm:self-start">
        {!isRead && (
          <Button
            variant="glass"
            size="sm"
            onClick={onMarkRead}
            aria-label="Mark notification as read"
            className="h-7 w-7 p-0 flex items-center justify-center rounded-lg hover:border-brand-primary/20"
          >
            <MailOpen className="h-3.5 w-3.5 text-brand-primaryLight" />
          </Button>
        )}
        <Button
          variant="glass"
          size="sm"
          onClick={onDelete}
          aria-label="Delete notification"
          className="h-7 w-7 p-0 flex items-center justify-center rounded-lg hover:border-red-500/20 text-brand-muted hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

    </Card>
  );
};
export default NotificationCard;
