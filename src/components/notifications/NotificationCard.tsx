import React from 'react';
import type { NotificationItem, NotificationCategory } from '../../contexts/NotificationContext';
import {
  Car,
  Ticket,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  Info,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (actionUrl?: string) => void;
}

const CATEGORY_ICONS: Record<NotificationCategory, React.ReactNode> = {
  Ride: <Car className="w-4 h-4 text-emerald-400" />,
  Booking: <Ticket className="w-4 h-4 text-blue-400" />,
  Chat: <MessageSquare className="w-4 h-4 text-purple-400" />,
  Driver: <UserCheck className="w-4 h-4 text-teal-400" />,
  Passenger: <UserCheck className="w-4 h-4 text-cyan-400" />,
  System: <Info className="w-4 h-4 text-slate-400" />,
  Security: <ShieldCheck className="w-4 h-4 text-red-400" />,
  Promotion: <Info className="w-4 h-4 text-yellow-400" />,
  General: <Info className="w-4 h-4 text-slate-400" />,
};

const PRIORITY_BG: Record<string, string> = {
  Low: 'border-slate-800 bg-slate-900/50',
  Medium: 'border-slate-800 bg-slate-900',
  High: 'border-emerald-500/30 bg-emerald-950/10',
  Critical: 'border-red-500/40 bg-red-950/20',
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkRead,
  onDelete,
  onClick,
}) => {
  const icon = CATEGORY_ICONS[notification.category] || CATEGORY_ICONS.General;
  const bgClass = PRIORITY_BG[notification.priority] || PRIORITY_BG.Medium;

  const handleClick = () => {
    if (!notification.is_read && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (onClick) {
      let targetUrl = notification.action_url;
      if (!targetUrl && notification.data_json) {
        try {
          const data = JSON.parse(notification.data_json);
          if (data.type === 'ride_request') {
            targetUrl = '/dashboard/driver/requests';
          } else if (data.type === 'request_accepted' || data.type === 'request_rejected') {
            targetUrl = '/dashboard/passenger/requests';
          } else if (data.type === 'ride_cancelled') {
            targetUrl = '/dashboard/passenger/requests';
          } else if (data.type === 'passenger_joined') {
            targetUrl = '/dashboard/driver/active-ride';
          } else if (data.type === 'ride_completed') {
            targetUrl = '/dashboard/passenger/history';
          }
        } catch {
          // ignore
        }
      }
      onClick(targetUrl);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition cursor-pointer ${bgClass} ${
        !notification.is_read ? 'ring-1 ring-emerald-500/20 shadow-md' : 'opacity-85 hover:opacity-100'
      }`}
    >
      {/* Category Icon */}
      <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 flex-shrink-0">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-2 mb-1">
          <h4
            className={`text-sm font-bold truncate ${
              !notification.is_read ? 'text-white' : 'text-slate-300'
            }`}
          >
            {notification.title}
          </h4>
          {!notification.is_read && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2">
          {notification.body}
        </p>

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>{formatTimeAgo(notification.created_at)}</span>
          <span>•</span>
          <span className="font-semibold text-slate-400">{notification.category}</span>
          {(notification.action_url || notification.data_json) && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400 group-hover:underline">
                View details <ExternalLink className="w-3 h-3" />
              </span>
            </>
          )}
        </div>
      </div>

      {/* Delete / Actions */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          title="Delete notification"
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
