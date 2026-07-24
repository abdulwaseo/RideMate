import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCommunication } from '../../hooks/useCommunication';
import { Card } from './Card';
import { 
  Search, 
  MessageSquare, 
  Bell, 
  Settings, 
  FileText, 
  X,
  Navigation,
  Car
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface SearchItem {
  category: 'Pages' | 'Chats' | 'Alerts' | 'Settings';
  title: string;
  subtitle?: string;
  url: string;
  icon: React.ReactNode;
}

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandSearch: React.FC<CommandSearchProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rooms, notifications } = useCommunication();
  const [query, setQuery] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when search opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const rolePath = user?.role === 'driver' ? 'driver' : 'passenger';

  // Build searchable indexes
  const searchItems: SearchItem[] = [
    // Page Routes
    {
      category: 'Pages',
      title: 'Dashboard Home',
      subtitle: `View trip summaries on your ${user?.role} portal`,
      url: `/dashboard/${rolePath}`,
      icon: <Car className="h-4 w-4 text-brand-primaryLight" />,
    },
    {
      category: 'Pages',
      title: user?.role === 'driver' ? 'Publish a Ride' : 'Search Published Rides',
      subtitle: user?.role === 'driver' ? 'Register a new commute route' : 'Book a seat to Dilkusha Towers',
      url: `/dashboard/${rolePath}/${user?.role === 'driver' ? 'publish' : 'search'}`,
      icon: <Navigation className="h-4 w-4 text-brand-accentLight" />,
    },
    {
      category: 'Pages',
      title: 'My Match Requests',
      subtitle: 'Monitor active matching reservations',
      url: `/dashboard/${rolePath}/requests`,
      icon: <FileText className="h-4 w-4 text-amber-400" />,
    },
    {
      category: 'Pages',
      title: 'Profile Settings',
      subtitle: 'Edit office locations or vehicle specifications',
      url: `/dashboard/${rolePath}/profile`,
      icon: <Settings className="h-4 w-4 text-blue-400" />,
    },

    // active Chats
    ...rooms.map((room) => ({
      category: 'Chats' as const,
      title: `${room.pickupArea} → ${room.destination}`,
      subtitle: `Chat room with ${room.driver.name} and co-commuters`,
      url: `/dashboard/${rolePath}/chat/${room.id}`,
      icon: <MessageSquare className="h-4 w-4 text-emerald-400" />,
    })),

    // Notifications
    ...notifications.map((notif) => ({
      category: 'Alerts' as const,
      title: notif.title,
      subtitle: notif.description,
      url: notif.actionUrl || `/dashboard/${rolePath}/notifications`,
      icon: <Bell className="h-4 w-4 text-sky-400" />,
    })),
  ];

  // Filtering matching items
  const filtered = searchItems.filter((item) => {
    const term = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(term)) ||
      item.category.toLowerCase().includes(term)
    );
  });

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-xl select-none"
            >
              <Card hoverEffect={false} className="border border-brand-border bg-brand-card/95 shadow-glass overflow-hidden flex flex-col p-0">
                
                {/* Search query input field bar */}
                <div className="flex items-center gap-3 px-4.5 py-4 border-b border-brand-border/40 relative">
                  <Search className="h-5 w-5 text-brand-textMuted shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type to search pages, active chats, settings, alerts..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent text-sm text-brand-text placeholder-brand-textMuted focus:outline-none leading-normal"
                  />
                  <button
                    onClick={onClose}
                    className="p-1 rounded bg-white/[0.02] border border-brand-border/40 hover:bg-white/[0.05] text-brand-muted hover:text-brand-text shrink-0"
                    aria-label="Close search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Filtered items feed list */}
                <div className="max-h-80 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin">
                  {filtered.length > 0 ? (
                    filtered.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelect(item.url)}
                        className="flex gap-3.5 items-center p-3 rounded-xl border border-transparent hover:bg-white/[0.02] hover:border-brand-border/30 cursor-pointer text-left transition-all"
                      >
                        <div className="p-2 rounded-lg bg-white/[0.01] border border-brand-border/40 shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-brand-text leading-tight flex items-center gap-2">
                            {item.title}
                            <span className="text-[8px] bg-white/[0.02] border border-brand-border/40 px-1.5 py-0.5 rounded text-brand-muted select-none uppercase font-extrabold tracking-wide scale-90">
                              {item.category}
                            </span>
                          </span>
                          {item.subtitle && (
                            <p className="text-[10px] text-brand-muted truncate mt-0.5 font-medium leading-none">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-brand-muted text-xs select-none">
                      No search match results found for "{query}".
                    </div>
                  )}
                </div>

                {/* Keyboard tip footer */}
                <div className="bg-brand-card/30 px-4 py-2 border-t border-brand-border/40 flex justify-between items-center text-[9px] text-brand-muted font-bold select-none uppercase tracking-wide">
                  <span>Press Esc to close</span>
                  <span>Select result to navigate</span>
                </div>

              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
export default CommandSearch;
