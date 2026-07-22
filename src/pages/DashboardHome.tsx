import React from 'react';
import { 
  Plus, 
  CalendarRange, 
  ShieldCheck, 
  Car, 
  Compass, 
  Award 
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { StatCard } from '../components/ui/StatCard';

export const DashboardHome: React.FC = () => {
  return (
    <div className="space-y-8 text-left select-none">
      
      {/* Dashboard Top Header */}
      <PageHeader 
        title="Commute Overview" 
        description="Welcome to your corporate transit workspace. Manage, publish, or look up shared rides below."
        actions={
          <div className="flex gap-2.5">
            <Button variant="glass" size="sm" leftIcon={<CalendarRange className="h-4 w-4" />}>
              Schedules
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              New Ride
            </Button>
          </div>
        }
      />

      {/* Internal Mini Stat Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Bookings" 
          value={0} 
          icon={CalendarRange} 
          description="Rides scheduled for this week" 
        />
        <StatCard 
          title="Co-commuters" 
          value={0} 
          icon={Compass} 
          description="Members in your regular carpools" 
        />
        <StatCard 
          title="Carbon Saved" 
          value={0} 
          suffix=" kg"
          icon={Award} 
          description="Your total environmental contribution" 
        />
        <StatCard 
          title="Verified Safe Drives" 
          value={12} 
          icon={ShieldCheck} 
          description="Carpool drives completed" 
        />
      </div>

      {/* Grid: Main Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Active Rides Placeholder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-brand-text">Upcoming Commutes</h3>
            <Badge variant="muted">Updated just now</Badge>
          </div>

          <EmptyState 
            icon={Car}
            title="No Commutes Scheduled"
            description="You don't have any pending rides booked or published for the current shift corridors."
            actionText="Publish / Search Routes"
            onAction={() => alert('Search and Publish capabilities will be configured in Sprint 2.')}
          />
        </div>

        {/* Right Side: Building/Corporate Network Stats */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-lg font-bold text-brand-text">Dilkusha Corridor Feed</h3>
          
          <Card hoverEffect={false} className="border border-brand-border/40 p-6 space-y-4">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-brand-text">Active Corridors Today</h4>
              <p className="text-xs text-brand-textMuted">Top commute paths heading to Tariq Road PECHS</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs border-b border-brand-border/40 pb-2.5">
                <span className="text-brand-text">Gulshan-e-Iqbal → Dilkusha</span>
                <Badge variant="success">8 Drivers online</Badge>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-brand-border/40 pb-2.5">
                <span className="text-brand-text">Clifton / DHA → Dilkusha</span>
                <Badge variant="success">5 Drivers online</Badge>
              </div>
              <div className="flex justify-between items-center text-xs pb-1">
                <span className="text-brand-text">North Nazimabad → Dilkusha</span>
                <Badge variant="success">6 Drivers online</Badge>
              </div>
            </div>
            
            <div className="pt-2">
              <Card hoverEffect={false} className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl text-center">
                <p className="text-[11px] font-semibold text-brand-primaryLight leading-relaxed">
                  Tip: Update your home area in settings to filter routes automatically.
                </p>
              </Card>
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
};
