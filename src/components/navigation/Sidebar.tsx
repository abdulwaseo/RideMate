import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  History, 
  User, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  X,
  Plus,
  Bell,
  Users,
  Compass
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { NotificationBadge } from '../notifications/NotificationBadge';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../utils/cn';

export const Sidebar: React.FC = () => {
  const { 
    isCollapsed, 
    isMobileOpen, 
    toggleSidebar, 
    toggleMobileSidebar 
  } = useSidebar();
  const { logout, role } = useAuth();
  const { unreadCount } = useNotificationContext();

  const handleExitClick = () => {
    logout();
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  const driverMenuItems = [
    { label: 'Overview', icon: LayoutDashboard, path: ROUTES.DRIVER_DASHBOARD },
    { label: 'Publish Ride', icon: Plus, path: '/dashboard/driver/publish' },
    { label: 'My Active Ride', icon: Car, path: '/dashboard/driver/active-ride' },
    { label: 'Ride Requests', icon: Users, path: '/dashboard/driver/requests' },
    { label: 'Ride History', icon: History, path: '/dashboard/driver/history' },
    { label: 'Notifications', icon: Bell, path: '/dashboard/driver/notifications' },
    { label: 'Profile', icon: User, path: '/dashboard/driver/profile' },
    { label: 'Settings', icon: Settings, path: '/dashboard/driver/settings' },
  ];

  const passengerMenuItems = [
    { label: 'Overview', icon: LayoutDashboard, path: ROUTES.PASSENGER_DASHBOARD },
    { label: 'Search Ride', icon: Compass, path: '/dashboard/passenger/search' },
    { label: 'My Requests', icon: Users, path: '/dashboard/passenger/requests' },
    { label: 'Ride History', icon: History, path: '/dashboard/passenger/history' },
    { label: 'Notifications', icon: Bell, path: '/dashboard/passenger/notifications' },
    { label: 'Profile', icon: User, path: '/dashboard/passenger/profile' },
    { label: 'Settings', icon: Settings, path: '/dashboard/passenger/settings' },
  ];

  const menuItems = role === 'driver' ? driverMenuItems : passengerMenuItems;

  const handleNavClick = () => {
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#070a13] lg:bg-transparent">
      {/* Sidebar Header */}
      <div className={cn(
        "flex items-center justify-between p-5 border-b border-brand-border/40",
        isCollapsed && "lg:justify-center lg:px-2"
      )}>
        <Logo showText={!isCollapsed} size="sm" />
        <button 
          onClick={toggleMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg bg-white/[0.02] border border-brand-border text-brand-textMuted hover:text-brand-text"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar Menu Items */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) => cn(
              "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all group",
              isActive 
                ? "bg-brand-primary/10 border border-brand-primary/20 text-brand-primaryLight" 
                : "text-brand-textMuted hover:text-brand-text hover:bg-white/[0.02] border border-transparent",
              isCollapsed && "lg:justify-center lg:px-2"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className={cn(
              "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105",
              isCollapsed && "lg:m-0"
            )} />
            <span className={cn(
              "transition-opacity duration-200 flex-1 flex items-center justify-between",
              isCollapsed && "lg:hidden lg:w-0"
            )}>
              <span>{item.label}</span>
              {item.label === 'Notifications' && unreadCount > 0 && (
                <NotificationBadge count={unreadCount} />
              )}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className={cn(
        "p-4 border-t border-brand-border/40 space-y-2",
        isCollapsed && "lg:p-2 lg:text-center"
      )}>
        <NavLink
          to={ROUTES.HOME}
          onClick={handleExitClick}
          className={cn(
            "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-all",
            isCollapsed && "lg:justify-center lg:px-2"
          )}
          title={isCollapsed ? "Exit Portal" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className={cn(isCollapsed && "lg:hidden lg:w-0")}>Exit Demo</span>
        </NavLink>
        
        {/* Toggle Collapse Button for Desktop */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex items-center justify-center w-full py-2.5 rounded-xl border border-brand-border hover:border-brand-primary/30 bg-white/[0.01] hover:bg-white/[0.03] text-brand-textMuted hover:text-brand-primary transition-all mt-2"
        >
          {isCollapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:block fixed top-0 bottom-0 left-0 z-40 glass-panel border-r border-brand-border/40 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={toggleMobileSidebar}
        >
          <aside 
            className="fixed top-0 bottom-0 left-0 w-72 bg-[#070a13] border-r border-brand-border/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking drawer content
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
