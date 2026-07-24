import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useNotificationContext } from '../../contexts/NotificationContext';
import {
  NotificationCard,
  NotificationFilter,
  NotificationSettings,
  NotificationEmptyState,
  PermissionBanner,
} from '../../components/notifications';
import { Search, MailOpen, Settings, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'inbox' | 'settings'>('inbox');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchNotifications(selectedCategory);
  }, [selectedCategory, fetchNotifications]);

  const filteredNotifications = notifications.filter((notif) => {
    const matchesCategory = selectedCategory === 'All' || notif.category === selectedCategory;
    const matchesSearch =
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 text-left max-w-4xl select-none">
      {/* Permission banner prompt */}
      <PermissionBanner />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Notification Center"
          description="Track incoming ride updates, booking confirmations, chat messages, and system alerts."
        />

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Tab buttons */}
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeTab === 'inbox'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Inbox
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeTab === 'settings'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Preferences
          </button>

          {activeTab === 'inbox' && unreadCount > 0 && (
            <Button
              variant="glass"
              size="sm"
              onClick={() => markAllAsRead()}
              leftIcon={<MailOpen className="h-4 w-4" />}
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'settings' ? (
        <NotificationSettings />
      ) : (
        <>
          {/* Search & Filter */}
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search alerts by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
            </div>

            <NotificationFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* List */}
          <div className="pt-2">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-20 bg-slate-900 rounded-2xl animate-pulse border border-slate-800" />
                ))}
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <NotificationCard
                        notification={notif}
                        onMarkRead={markAsRead}
                        onDelete={deleteNotification}
                        onClick={(url) => {
                          if (url) navigate(url);
                        }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <NotificationEmptyState
                title={searchQuery || selectedCategory !== 'All' ? 'No Matching Alerts' : 'Inbox is Clean'}
                description={
                  searchQuery || selectedCategory !== 'All'
                    ? 'No notifications match your current filter or search criteria.'
                    : "You're all caught up! New alerts will populate automatically as ride status changes."
                }
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
