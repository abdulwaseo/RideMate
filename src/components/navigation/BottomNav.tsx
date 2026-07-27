import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Plus, 
  Compass, 
  Users, 
  MessageSquare, 
  Bell 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCommunication } from '../../hooks/useCommunication';
import { useChatContext } from '../../contexts/ChatContext';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../utils/cn';

export const BottomNav: React.FC = () => {
  const { role } = useAuth();
  const { unreadCount } = useCommunication();
  const { totalUnreadCount } = useChatContext();

  const driverItems = [
    { label: 'Home', icon: LayoutDashboard, path: ROUTES.DRIVER_DASHBOARD },
    { label: 'Publish', icon: Plus, path: '/dashboard/driver/publish' },
    { label: 'Active', icon: Car, path: '/dashboard/driver/active-ride' },
    { label: 'Chat', icon: MessageSquare, path: '/dashboard/driver/chat', badge: totalUnreadCount },
    { label: 'Alerts', icon: Bell, path: '/dashboard/driver/notifications', badge: unreadCount },
  ];

  const passengerItems = [
    { label: 'Home', icon: LayoutDashboard, path: ROUTES.PASSENGER_DASHBOARD },
    { label: 'Search', icon: Compass, path: '/dashboard/passenger/search' },
    { label: 'Requests', icon: Users, path: '/dashboard/passenger/requests' },
    { label: 'Chat', icon: MessageSquare, path: '/dashboard/passenger/chat', badge: totalUnreadCount },
    { label: 'Alerts', icon: Bell, path: '/dashboard/passenger/notifications', badge: unreadCount },
  ];

  const items = role === 'driver' ? driverItems : passengerItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel border-t border-brand-border/40 bg-brand-bg/90 backdrop-blur-lg px-2 py-1 select-none">
      <div className="grid grid-cols-5 items-center justify-items-center h-14 max-w-md mx-auto">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === ROUTES.DRIVER_DASHBOARD || item.path === ROUTES.PASSENGER_DASHBOARD}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center w-full min-h-[44px] py-1 px-1 rounded-xl text-[10px] font-semibold transition-all relative",
              isActive 
                ? "text-brand-primary font-bold bg-brand-primary/10 border border-brand-primary/20" 
                : "text-brand-textMuted hover:text-brand-text hover:bg-white/[0.02]"
            )}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 bg-brand-primary rounded-full text-[8px] font-extrabold text-white flex items-center justify-center border border-brand-bg shadow-sm animate-pulse">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="truncate max-w-[64px] leading-tight mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
