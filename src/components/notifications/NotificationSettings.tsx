import React, { useState } from 'react';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { Bell, Smartphone, Mail, Car, Ticket, MessageSquare, ShieldCheck } from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const { preferences, updatePreferences, requestPushPermission, pushPermission } =
    useNotificationContext();
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (key: string, currentValue: boolean) => {
    setIsSaving(true);
    await updatePreferences({ [key]: !currentValue });
    setIsSaving(false);
  };

  const handleEnableBrowserPush = async () => {
    await requestPushPermission();
  };

  if (!preferences) {
    return (
      <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse space-y-4">
        <div className="h-4 bg-slate-800 rounded w-1/3" />
        <div className="h-10 bg-slate-800 rounded" />
      </div>
    );
  }

  const items = [
    {
      key: 'push_notifications',
      label: 'Browser Push Notifications',
      description: 'Receive real-time desktop popups when rides update or messages arrive',
      icon: <Smartphone className="w-5 h-5 text-emerald-400" />,
      value: preferences.push_notifications,
    },
    {
      key: 'ride_updates',
      label: 'Ride Status Updates',
      description: 'Alerts when rides start, delay, approach destination, or complete',
      icon: <Car className="w-5 h-5 text-blue-400" />,
      value: preferences.ride_updates,
    },
    {
      key: 'booking_updates',
      label: 'Booking Requests & Confirmations',
      description: 'Notifications for new seat requests, acceptances, and cancellations',
      icon: <Ticket className="w-5 h-5 text-indigo-400" />,
      value: preferences.booking_updates,
    },
    {
      key: 'chat_messages',
      label: 'Chat Message Notifications',
      description: 'Alerts when co-commuters send messages in active ride rooms',
      icon: <MessageSquare className="w-5 h-5 text-purple-400" />,
      value: preferences.chat_messages,
    },
    {
      key: 'system_notifications',
      label: 'System & Security Announcements',
      description: 'Important platform alerts, security notices, and driver verifications',
      icon: <ShieldCheck className="w-5 h-5 text-teal-400" />,
      value: preferences.system_notifications,
    },
    {
      key: 'email_notifications',
      label: 'Email Notifications (Placeholder)',
      description: 'Receive summary digest emails for important ride bookings',
      icon: <Mail className="w-5 h-5 text-slate-400" />,
      value: preferences.email_notifications,
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            Notification Preferences
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Choose which channels and categories trigger notifications.
          </p>
        </div>

        {pushPermission !== 'granted' && (
          <button
            onClick={handleEnableBrowserPush}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl transition shadow-sm"
          >
            Enable Web Push
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-800/60">
        {items.map((item) => (
          <div key={item.key} className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/50 flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{item.label}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            </div>

            <button
              onClick={() => handleToggle(item.key, item.value)}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                item.value ? 'bg-emerald-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  item.value ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
