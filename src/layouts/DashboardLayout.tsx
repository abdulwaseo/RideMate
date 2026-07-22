import React from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Bell, Search, ShieldCheck } from 'lucide-react';
import { Sidebar } from '../components/navigation/Sidebar';
import { Avatar } from '../components/ui/Avatar';
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext';
import { cn } from '../utils/cn';

// Interior shell layout that consumes the SidebarContext
const DashboardLayoutContent: React.FC = () => {
  const { isCollapsed, toggleMobileSidebar } = useSidebar();

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
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-border bg-white/[0.01] w-64 text-brand-textMuted hover:border-brand-primary/20 transition-all">
              <Search className="h-4 w-4" />
              <span className="text-xs">Search rides or members...</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Trust Indicator */}
            <div className="hidden md:flex items-center gap-1 text-[11px] font-bold text-brand-primary tracking-wide uppercase px-2.5 py-1 rounded-md border border-brand-primary/20 bg-brand-primary/5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Dilkusha Verified</span>
            </div>

            {/* Notification Icon */}
            <button className="p-2 rounded-lg bg-white/[0.01] border border-brand-border text-brand-textMuted hover:text-brand-text transition-colors relative">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
            </button>

            <span className="h-4 w-px bg-brand-border/50" />

            {/* User Profile */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-brand-text">Abdul Waseo</p>
                <p className="text-[10px] text-brand-textMuted">Developer Account</p>
              </div>
              <Avatar name="Abdul Waseo" isOnline={true} size="md" />
            </div>
          </div>
        </header>

        {/* Dashboard Pages Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
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
