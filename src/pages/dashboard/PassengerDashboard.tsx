import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Users, 
  History, 
  User, 
  CheckCircle, 
  Star, 
  ArrowRight,
  Activity,
  Milestone
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { QuickActionCard } from '../../components/driver/QuickActionCard';
import { useAuth } from '../../hooks/useAuth';
import { usePassenger } from '../../hooks/usePassenger';

export const PassengerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { bookingRequests, rideHistory } = usePassenger();
  const navigate = useNavigate();

  // Find dynamic upcoming accepted ride
  const upcomingRide = bookingRequests.find((req) => req.status === 'Accepted');
  
  // Find dynamic pending requests count
  const pendingRequestsCount = bookingRequests.filter((req) => req.status === 'Pending').length;

  // Calculate passenger statistics
  const completedTripsCount = rideHistory.filter((h) => h.status === 'Completed').length;
  const recentHistory = rideHistory.length > 0 ? rideHistory[0] : null;

  return (
    <div className="space-y-8 text-left select-none">
      
      {/* Page Header */}
      <PageHeader 
        title={`Assalam-o-Alaikum, ${user?.name?.split(' ')[0] || 'Passenger'}`}
        description="Welcome back to your commute control panel. Find available rides, verify bookings, or inspect carbon offset points."
        actions={
          <Button 
            variant="primary" 
            size="sm" 
            leftIcon={<Compass className="h-4.5 w-4.5" />}
            onClick={() => navigate('/dashboard/passenger/search')}
          >
            Find a Ride
          </Button>
        }
      />

      {/* Grid 1: Personal Profile summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/30 p-6 flex items-start gap-4 lg:col-span-2">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-brand-surface border-2 border-brand-accent flex items-center justify-center font-bold text-xl text-brand-accentLight">
              {user?.name ? user.name.split(' ').map(n=>n[0]).slice(0,2).join('') : 'P'}
            </div>
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-brand-accent ring-4 ring-brand-bg flex items-center justify-center text-[8px] text-brand-bg font-bold">
              ✓
            </span>
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-brand-text">{user?.name || 'Abdul Waseo'}</h3>
              <div className="flex items-center gap-0.5 text-xs text-amber-400 font-bold bg-amber-400/5 px-2 py-0.5 rounded-lg border border-amber-400/10">
                <Star className="h-3 w-3 fill-current" />
                <span>4.9</span>
              </div>
              <Badge variant="accent" className="text-[9px]">Commuter</Badge>
            </div>
            <p className="text-xs text-brand-textMuted leading-relaxed max-w-md">
              Dilkusha Towers Staff • Verified Employee at <strong className="text-brand-text">{user?.officeName || 'Dilkusha Towers Office'}</strong>
            </p>
          </div>
        </Card>

        {/* Environmental Carbon points card */}
        <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/30 p-6 flex gap-4 text-left">
          <div className="p-3.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary h-fit">
            <Activity className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide block">Carbon Offset Rating</span>
            <h4 className="font-bold text-base text-brand-text leading-tight">Eco-Commuter Bronze</h4>
            <p className="text-xs font-semibold text-brand-primaryLight tracking-wider uppercase">
              0 Kg CO₂ Saved
            </p>
          </div>
        </Card>

      </div>

      {/* Grid 2: Statistics metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Commutes" value={completedTripsCount} icon={Milestone} description="Total carpools matched" />
        <StatCard title="Upcoming Trips" value={upcomingRide ? 1 : 0} icon={Compass} description="Confirmed schedules today" />
        <StatCard title="Completed Rides" value={completedTripsCount} icon={CheckCircle} description="Trips checked-in" />
        <StatCard title="Driver Ratings Given" value={5} prefix="5." suffix=" / 5" icon={Star} description="Avg driver score given" />
      </div>

      {/* Grid 3: Upcoming ride & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upcoming Ride Card */}
          <div className="space-y-3.5">
            <h3 className="text-lg font-bold text-brand-text">Upcoming Ride Details</h3>
            
            {upcomingRide ? (
              <Card hoverEffect={false} className="border border-brand-primary/25 bg-brand-primary/5 p-6 space-y-5 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-primary/10 blur-xl" />
                
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <Badge variant="success">Confirmed Commute</Badge>
                    <h4 className="text-lg font-bold text-brand-text mt-1">
                      {upcomingRide.ride.pickupArea} → {upcomingRide.ride.destination}
                    </h4>
                    <p className="text-xs text-brand-textMuted">
                      Driver: <strong className="text-brand-text">{upcomingRide.ride.driver.name}</strong> • {upcomingRide.ride.driver.vehicleModel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-brand-primaryLight">{upcomingRide.ride.farePerPassenger} PKR</p>
                    <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Confirmed Fare</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-3.5 border-y border-brand-border/40 text-xs text-brand-textMuted">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide block mb-0.5">Time</span>
                    <strong className="text-brand-text font-semibold">{upcomingRide.ride.departureTime}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide block mb-0.5">Date</span>
                    <strong className="text-brand-text font-semibold">{upcomingRide.ride.date}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide block mb-0.5">Meeting Stop</span>
                    <strong className="text-brand-text font-semibold">{upcomingRide.ride.meetingPoint}</strong>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1.5">
                  <Button 
                    variant="glass" 
                    size="sm" 
                    onClick={() => navigate('/dashboard/passenger/requests')}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Manage Requests
                  </Button>
                </div>
              </Card>
            ) : (
              <Card hoverEffect={false} className="border border-dashed border-brand-border p-8 text-center bg-brand-card/10 space-y-4">
                <p className="text-sm text-brand-textMuted leading-relaxed max-w-sm mx-auto">
                  You don't have any upcoming commutes confirmed. Find coworkers heading to Dilkusha.
                </p>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => navigate('/dashboard/passenger/search')}
                  leftIcon={<Compass className="h-4.5 w-4.5" />}
                >
                  Search Available Rides
                </Button>
              </Card>
            )}
          </div>

          {/* Recent Ride briefly */}
          <div className="space-y-3.5">
            <h3 className="text-lg font-bold text-brand-text">Most Recent Ride</h3>
            
            {recentHistory ? (
              <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/20 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Completed</Badge>
                    <span className="text-xs font-semibold text-brand-text">{recentHistory.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-brand-text pt-1">{recentHistory.route}</h4>
                  <p className="text-xs text-brand-textMuted">
                    Driver: <span className="font-semibold text-brand-text">{recentHistory.driverName}</span>
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-base font-extrabold text-brand-primaryLight">{recentHistory.fare} PKR</p>
                  <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wider block">Total Paid</span>
                </div>
              </Card>
            ) : (
              <Card hoverEffect={false} className="border border-brand-border/40 p-6 text-center bg-brand-card/25 text-xs text-brand-muted">
                No past rides logged.
              </Card>
            )}
          </div>

        </div>

        {/* Sidebar Column: Quick Actions shortcuts */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-brand-text">Quick Actions</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <QuickActionCard
              icon={Compass}
              title="Search Rides"
              description="Find drivers heading on similar routes"
              accent="primary"
              onClick={() => navigate('/dashboard/passenger/search')}
            />
            <QuickActionCard
              icon={Users}
              title="My Requests"
              description="Inspect status of sent seat booking requests"
              badgeText={pendingRequestsCount > 0 ? `${pendingRequestsCount} Pending` : undefined}
              onClick={() => navigate('/dashboard/passenger/requests')}
            />
            <QuickActionCard
              icon={History}
              title="Ride History"
              description="Check past completed rides & receipts"
              onClick={() => navigate('/dashboard/passenger/history')}
            />
            <QuickActionCard
              icon={User}
              title="Commuter Profile"
              description="Manage verification tags & metrics"
              onClick={() => navigate('/dashboard/passenger/profile')}
            />
          </div>
        </div>

      </div>

    </div>
  );
};

export default PassengerDashboard;
