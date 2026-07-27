import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { WSEvent } from '../types/websocket';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ToastContext';
import { getAuthToken } from '../utils/token';

export type NotificationCategory =
  | 'Ride'
  | 'Booking'
  | 'Chat'
  | 'Driver'
  | 'Passenger'
  | 'System'
  | 'Security'
  | 'Promotion'
  | 'General';

export type NotificationPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  data_json?: string;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  ride_updates: boolean;
  booking_updates: boolean;
  chat_messages: boolean;
  system_notifications: boolean;
  marketing_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionItem {
  id: string;
  user_id: string;
  device_type: string;
  browser?: string;
  platform?: string;
  is_active: boolean;
  last_seen: string;
  created_at: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  pushPermission: NotificationPermission;
  isSubscribedToPush: boolean;

  fetchNotifications: (category?: string, unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (payload: Partial<NotificationPreferences>) => Promise<void>;
  requestPushPermission: () => Promise<NotificationPermission>;
  registerPushToken: (subscriptionData: string) => Promise<void>;
}

import { API_BASE_URL } from '../config/api';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_BASE = API_BASE_URL;

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSubscribedToPush, setIsSubscribedToPush] = useState<boolean>(false);

  const apiCall = useCallback(
    async <T,>(method: string, path: string, body?: unknown): Promise<T | null> => {
      const token = getAuthToken() || '';
      if (!token) return null;

      try {
        const res = await fetch(`${API_BASE}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json?.data ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  // ─── REST Actions ──────────────────────────────────────────────────────────

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    const data = await apiCall<{ unread_count: number }>('GET', '/api/v1/notifications/unread');
    if (data && data.unread_count !== undefined) {
      setUnreadCount(data.unread_count);
    }
  }, [isAuthenticated, apiCall]);

  const fetchNotifications = useCallback(
    async (category?: string, unreadOnly?: boolean) => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      let query = '/api/v1/notifications?limit=50';
      if (category && category !== 'All') query += `&category=${category}`;
      if (unreadOnly) query += `&unread_only=true`;

      const data = await apiCall<NotificationItem[]>('GET', query);
      if (data) {
        setNotifications(data);
      }
      setIsLoading(false);
    },
    [isAuthenticated, apiCall]
  );

  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;
    const data = await apiCall<NotificationPreferences>('GET', '/api/v1/notifications/preferences');
    if (data) {
      setPreferences(data);
    }
  }, [isAuthenticated, apiCall]);

  const updatePreferences = useCallback(
    async (payload: Partial<NotificationPreferences>) => {
      if (!isAuthenticated) return;
      const data = await apiCall<NotificationPreferences>('PATCH', '/api/v1/notifications/preferences', payload);
      if (data) {
        setPreferences(data);
      }
    },
    [isAuthenticated, apiCall]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;
      const updated = await apiCall<NotificationItem>('PATCH', `/api/v1/notifications/${id}/read`);
      if (updated) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    [isAuthenticated, apiCall]
  );

  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    const result = await apiCall<{ updated_count: number }>('PATCH', '/api/v1/notifications/read-all');
    if (result) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }, [isAuthenticated, apiCall]);

  const deleteNotification = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;
      await apiCall('DELETE', `/api/v1/notifications/${id}`);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    },
    [isAuthenticated, apiCall]
  );

  // ─── Browser Push Registration ─────────────────────────────────────────────

  const requestPushPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isAuthenticated || typeof Notification === 'undefined') return 'denied';
    const perm = await Notification.requestPermission();
    setPushPermission(perm);

    if (perm === 'granted' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            // Standard VAPID key placeholder; will be overridden by env variable if present
            applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa45bM',
          });
        }
        if (sub) {
          await apiCall('POST', '/api/v1/notifications/push-subscriptions', {
            device_type: 'web',
            browser: navigator.userAgent,
            subscription_data: JSON.stringify(sub),
          });
          setIsSubscribedToPush(true);
        }
      } catch (err) {
        console.warn('Web Push registration fallback:', err);
      }
    }
    return perm;
  }, [isAuthenticated, apiCall]);

  const registerPushToken = useCallback(
    async (subscriptionData: string) => {
      if (!isAuthenticated) return;
      const res = await apiCall<PushSubscriptionItem>('POST', '/api/v1/notifications/push-subscriptions', {
        device_type: 'web',
        browser: navigator.userAgent,
        subscription_data: subscriptionData,
      });
      if (res) setIsSubscribedToPush(true);
    },
    [isAuthenticated, apiCall]
  );

  // ─── WebSocket Listeners ───────────────────────────────────────────────────

  useSocketEvent<Record<string, any>>(
    'notification_created',
    useCallback((event: WSEvent<Record<string, any>>) => {
      const item = event.payload as unknown as NotificationItem;
      if (item && item.id) {
        setNotifications((prev) => [item, ...prev.filter((n) => n.id !== item.id)]);
        setUnreadCount((c) => c + 1);

        let targetUrl = item.action_url;
        if (!targetUrl && item.data_json) {
          try {
            const data = JSON.parse(item.data_json);
            if (data.type === 'ride_request') targetUrl = '/dashboard/driver/requests';
            else if (data.type === 'request_accepted' || data.type === 'request_rejected' || data.type === 'ride_cancelled') targetUrl = '/dashboard/passenger/requests';
            else if (data.type === 'passenger_joined') targetUrl = '/dashboard/driver/active-ride';
            else if (data.type === 'ride_completed') targetUrl = '/dashboard/passenger/history';
          } catch {}
        }

        addToast(
          'info',
          item.title || 'New Notification',
          item.body || '',
          5000,
          () => {
            if (item.id) {
              markAsRead(item.id);
            }
            if (targetUrl) {
              navigate(targetUrl);
            }
          }
        );
      }
    }, [addToast, markAsRead, navigate])
  );

  useSocketEvent<Record<string, any>>(
    'notification_read',
    useCallback((event: WSEvent<Record<string, any>>) => {
      const id = event.payload['notification_id'] as string;
      if (id) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    }, [])
  );

  useSocketEvent<Record<string, any>>(
    'notification_sync',
    useCallback((event: WSEvent<Record<string, any>>) => {
      const count = event.payload['unread_count'] as number;
      if (count !== undefined) setUnreadCount(count);
    }, [])
  );

  // Initial load only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchNotifications();
      fetchPreferences();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
    }
  }, [isAuthenticated, fetchUnreadCount, fetchNotifications, fetchPreferences]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        isLoading,
        pushPermission,
        isSubscribedToPush,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchPreferences,
        updatePreferences,
        requestPushPermission,
        registerPushToken,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be used inside <NotificationProvider>');
  return ctx;
};
