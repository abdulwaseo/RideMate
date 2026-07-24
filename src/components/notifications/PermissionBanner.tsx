import React, { useState } from 'react';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { Bell, X } from 'lucide-react';

export const PermissionBanner: React.FC = () => {
  const { pushPermission, requestPushPermission } = useNotificationContext();
  const [dismissed, setDismissed] = useState(false);

  if (pushPermission === 'granted' || pushPermission === 'denied' || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    await requestPushPermission();
  };

  return (
    <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Enable Real-Time Push Notifications</h4>
          <p className="text-xs text-slate-400">
            Get instant desktop popups when your ride driver arrives or bookings change.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleEnable}
          className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition shadow-sm"
        >
          Enable Push
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-white p-2 rounded-xl transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
