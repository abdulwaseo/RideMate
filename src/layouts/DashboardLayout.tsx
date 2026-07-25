import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Bell, MessageSquare, Search, ShieldCheck } from 'lucide-react';
import { Sidebar } from '../components/navigation/Sidebar';
import { Avatar } from '../components/ui/Avatar';
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '../hooks/useAuth';
import { useCommunication } from '../hooks/useCommunication';
import { useChatContext } from '../contexts/ChatContext';
import { cn } from '../utils/cn';
import { CommandSearch } from '../components/ui/CommandSearch';

// Interior shell layout that consumes the SidebarContext
const DashboardLayoutContent: React.FC = () => {
  const { isCollapsed, toggleMobileSidebar } = useSidebar();
  const { user } = useAuth();
  const { unreadCount } = useCommunication();
  const { totalUnreadCount } = useChatContext();
  const [showSearch, setShowSearch] = React.useState(false);
  const navigate = useNavigate();

  // Cmd+K hotkey hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const notificationsUrl = user?.role === 'driver' 
    ? '/dashboard/driver/notifications' 
    : '/dashboard/passenger/notifications';

  const chatUrl = user?.role === 'driver' 
    ? '/dashboard/driver/chat' 
    : '/dashboard/passenger/chat';

  return (
    <div className="flex min-h-screen bg-brand-bg relative text-brand-text">
      {/* Background glow overlay */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none" />

      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main View Area */}
      <div className={cn(
        "flex flex-col flex-1 min-h-screen transition-all duration-300",
        isCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        
        {/* Top Dashboard Navbar */}
        <header className="sticky top-0 z-30 h-16 glass-panel border-b border-brand-border/40 bg-brand-bg/70 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Trigger */}
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg bg-white/[0.02] border border-brand-border text-brand-textMuted hover:text-brand-text"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Search Placeholder */}
            <div 
              onClick={() => setShowSearch(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-border bg-white/[0.01] w-64 text-brand-textMuted hover:border-brand-primary/20 transition-all cursor-pointer select-none"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs">Search rides or members...</span>
              <kbd className="ml-auto text-[9px] bg-white/[0.03] border border-brand-border/40 px-1.5 py-0.5 rounded text-brand-muted font-mono leading-none">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3.5 relative">
            {/* Trust Indicator */}
            <div className="hidden md:flex items-center gap-1 text-[11px] font-bold text-brand-primary tracking-wide uppercase px-2.5 py-1 rounded-md border border-brand-primary/20 bg-brand-primary/5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Dilkusha Verified</span>
            </div>

            {/* Messenger Chat Icon */}
            <button 
              onClick={() => navigate(chatUrl)}
              className="p-2 rounded-lg bg-white/[0.01] border border-brand-border text-brand-textMuted hover:text-brand-text transition-colors relative"
              title="Messenger / Chat"
              aria-label="Open Chat Inbox"
            >
              <MessageSquare className="h-4.5 w-4.5" />
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-brand-primary rounded-full text-[9px] font-extrabold text-white flex items-center justify-center border border-brand-bg shadow-sm animate-pulse">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </button>

            {/* Notification Bell Icon */}
            <button 
              onClick={() => navigate(notificationsUrl)}
              className="p-2 rounded-lg bg-white/[0.01] border border-brand-border text-brand-textMuted hover:text-brand-text transition-colors relative"
              title="Notifications"
              aria-label="Open Notification Center"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-brand-accent rounded-full text-[9px] font-extrabold text-brand-bg flex items-center justify-center border border-brand-bg shadow-sm animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <span className="h-4 w-px bg-brand-border/50" />

            {/* User Profile */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-brand-text">{user?.name || 'Abdul Waseo'}</p>
                <p className="text-[10px] text-brand-textMuted uppercase tracking-wider">
                  {user?.role === 'driver' ? 'Driver Portal' : 'Passenger Portal'}
                </p>
              </div>
              <Avatar name={user?.name || 'Abdul Waseo'} isOnline={true} size="md" />
            </div>
          </div>
        </header>

        {/* Dashboard Pages Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <React.Suspense fallback={
            <div className="flex flex-col gap-4 animate-pulse w-full max-w-2xl text-left">
              <div className="h-7 w-1/3 bg-white/[0.05] rounded" />
              <div className="h-4 w-2/3 bg-white/[0.05] rounded mb-2" />
              <div className="h-44 w-full bg-white/[0.03] rounded-2xl border border-brand-border/40" />
            </div>
          }>
            <Outlet />
          </React.Suspense>
        </main>
      </div>

      {/* Command Search Bar Overlay */}
      <CommandSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
};

export const DashboardLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <DashboardLayoutContent />
    </SidebarProvider>
  );
};
export default DashboardLayout;
