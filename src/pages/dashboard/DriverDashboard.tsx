import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  Plus, 
  Users, 
  User, 
  CheckCircle, 
  Star, 
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { QuickActionCard } from '../../components/driver/QuickActionCard';
import { RequestCard } from '../../components/driver/RequestCard';
import { useAuth } from '../../hooks/useAuth';
import { useDriver } from '../../hooks/useDriver';

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeRide, requests, rideHistory, acceptRequest, rejectRequest } = useDriver();
  const navigate = useNavigate();

  // Filter first 2 pending requests to show in dashboard preview
  const pendingRequests = requests.filter((r) => r.status === 'Pending').slice(0, 2);

  // Statistics calculation
  const totalCompletedTrips = rideHistory.filter((r) => r.status === 'Completed').length;

  return (
    <div className="space-y-8 text-left select-none">
      
      {/* Page Header */}
      <PageHeader 
        title={`Assalam-o-Alaikum, ${user?.name?.split(' ')[0] || 'Driver'}`}
        description="Here is your commute coordinator summary. Manage schedules, verify bookings, or publish new rides."
        actions={
          <div className="flex gap-2">
            {!activeRide ? (
              <Button 
                variant="primary" 
                size="sm" 
                leftIcon={<Plus className="h-4.5 w-4.5" />}
                onClick={() => navigate('/dashboard/driver/publish')}
              >
                Publish Ride
              </Button>
            ) : (
              <Button 
                variant="glass" 
                size="sm" 
                leftIcon={<Car className="h-4.5 w-4.5" />}
                onClick={() => navigate('/dashboard/driver/active-ride')}
              >
                Active Ride
              </Button>
            )}
          </div>
        }
      />

      {/* Grid 1: Profile & Vehicle Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/30 p-6 flex items-start gap-4 lg:col-span-2">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-brand-surface border-2 border-brand-primary flex items-center justify-center font-bold text-xl text-brand-primaryLight">
              {user?.name ? user.name.split(' ').map(n=>n[0]).slice(0,2).join('') : 'D'}
            </div>
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-brand-primary ring-4 ring-brand-bg flex items-center justify-center text-[8px] text-brand-bg font-bold">
              ✓
            </span>
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-brand-text">{user?.name || 'Abdul Waseo'}</h3>
              <div className="flex items-center gap-0.5 text-xs text-amber-400 font-bold bg-amber-400/5 px-2 py-0.5 rounded-lg border border-amber-400/10">
                <Star className="h-3 w-3 fill-current" />
                <span>5.0</span>
              </div>
              <Badge variant="primary" className="text-[9px]">Verified Domain</Badge>
            </div>
            <p className="text-xs text-brand-textMuted leading-relaxed max-w-md">
              Dilkusha Corporate Commuter • Verified Employee at <strong className="text-brand-text">{user?.officeName || 'Dilkusha Towers'}</strong>
            </p>
          </div>
        </Card>

        {/* Vehicle Card */}
        <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/30 p-6 flex gap-4 text-left">
          <div className="p-3.5 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent h-fit">
            <Car className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide block">Active Vehicle Details</span>
            <h4 className="font-bold text-base text-brand-text leading-tight">{user?.vehicleModel || 'No Active Vehicle'}</h4>
            <p className="text-xs font-semibold text-brand-accentLight tracking-wider uppercase">
              Plate: {user?.vehicleRegistrationNumber || 'N/A'}
            </p>
          </div>
        </Card>
      </div>

      {/* Grid 2: Statistics counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Trips Completed" value={totalCompletedTrips} icon={CheckCircle} description="Total corporate drives" />
        <StatCard title="Seats Remaining" value={activeRide ? activeRide.availableSeats : 0} icon={Users} description="Seats open to match" />
        <StatCard title="Acceptance Rate" value={100} suffix="%" icon={CheckCircle} description="Passenger match rate" />
        <StatCard title="Rating Average" value={5} prefix="5." suffix=" / 5" icon={Star} description="Commuter feedback score" />
      </div>

      {/* Grid 3: Active Ride & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Ride block */}
          <div className="space-y-3.5">
            <h3 className="text-lg font-bold text-brand-text">Today's Ride Status</h3>
            
            {activeRide ? (
              <Card hoverEffect={false} className="border border-brand-primary/20 bg-brand-primary/5 p-6 space-y-5 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-primary/10 blur-xl" />
                
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <Badge variant="primary">Active Commute Corridor</Badge>
                    <h4 className="text-lg font-bold text-brand-text mt-1">
                      {activeRide.pickupArea} → {activeRide.destination}
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-brand-primaryLight">{activeRide.farePerPassenger} PKR</p>
                    <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Per Seat</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-3.5 border-y border-brand-border/40 text-xs text-brand-textMuted">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide block mb-0.5">Departure Time</span>
                    <strong className="text-brand-text font-semibold">{activeRide.departureTime}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide block mb-0.5">Date</span>
                    <strong className="text-brand-text font-semibold">{activeRide.date}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wide block mb-0.5">Seats Open</span>
                    <strong className="text-brand-text font-semibold">{activeRide.availableSeats} Seats left</strong>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-xs text-brand-muted italic">Meeting at: "{activeRide.meetingPoint}"</span>
                  <Button 
                    variant="glass" 
                    size="sm" 
                    onClick={() => navigate('/dashboard/driver/active-ride')}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Manage Ride
                  </Button>
                </div>
              </Card>
            ) : (
              <Card hoverEffect={false} className="border border-dashed border-brand-border p-8 text-center bg-brand-card/10 space-y-4">
                <p className="text-sm text-brand-textMuted leading-relaxed max-w-sm mx-auto">
                  You don't have any active commute published for today. Offer empty seats to coworkers heading to Dilkusha.
                </p>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => navigate('/dashboard/driver/publish')}
                  leftIcon={<Plus className="h-4.5 w-4.5" />}
                >
                  Publish Ride Now
                </Button>
              </Card>
            )}
          </div>

          {/* Pending Passenger Requests Preview */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-brand-text">Pending Passenger Requests</h3>
              <button 
                onClick={() => navigate('/dashboard/driver/requests')}
                className="text-xs font-bold text-brand-accent hover:text-brand-accentLight inline-flex items-center gap-0.5"
              >
                <span>View all ({requests.filter(r=>r.status==='Pending').length})</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-3.5">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    onAccept={acceptRequest}
                    onReject={rejectRequest}
                  />
                ))
              ) : (
                <Card hoverEffect={false} className="border border-brand-border/40 p-6 text-center bg-brand-card/20 text-xs text-brand-muted">
                  No pending ride booking requests from passengers.
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Column: Quick Actions & Feeds */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-brand-text">Quick Actions</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <QuickActionCard
              icon={Plus}
              title="Publish Ride"
              description="Create a new carpool schedule"
              accent={!activeRide ? 'primary' : 'none'}
              badgeText={!activeRide ? 'Available' : 'Blocked'}
              onClick={() => navigate('/dashboard/driver/publish')}
            />
            <QuickActionCard
              icon={Car}
              title="My Active Ride"
              description="Coordinate current active passenger lists"
              accent={activeRide ? 'accent' : 'none'}
              badgeText={activeRide ? 'Active' : undefined}
              onClick={() => navigate('/dashboard/driver/active-ride')}
            />
            <QuickActionCard
              icon={Users}
              title="Ride Requests"
              description="Accept or reject booking offers"
              badgeText={`${requests.filter(r=>r.status==='Pending').length} Pending`}
              onClick={() => navigate('/dashboard/driver/requests')}
            />
            <QuickActionCard
              icon={User}
              title="Driver Profile"
              description="View license details & verify vehicles"
              onClick={() => navigate('/dashboard/driver/profile')}
            />
          </div>
        </div>

      </div>

    </div>
  );
};

export default DriverDashboard;
