import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { RequestCard } from '../../components/driver/RequestCard';
import { useDriver } from '../../hooks/useDriver';

export const RideRequests: React.FC = () => {
  const { requests, acceptRequest, rejectRequest, activeRide } = useDriver();

  // Filter requests by status
  const pendingRequests = requests.filter((r) => r.status === 'Pending');
  const acceptedRequests = requests.filter((r) => r.status === 'Accepted');

  const handleAccept = async (id: string) => {
    await acceptRequest(id);
  };

  const handleReject = async (id: string) => {
    await rejectRequest(id);
  };

  return (
    <div className="space-y-8 text-left select-none">
      <PageHeader 
        title="Ride Requests" 
        description="Verify corporate passenger profiles, match shift schedules, and accept carpool seats."
      />

      {/* Warnings if no active ride exists */}
      {!activeRide && (
        <Card hoverEffect={false} className="border border-brand-accent/20 bg-brand-accent/5 p-4 text-xs font-semibold text-brand-accentLight flex items-center gap-2 max-w-3xl">
          <ShieldAlert className="h-4.5 w-4.5" />
          <span>Note: You do not have an active ride published. You cannot accept passenger requests until a commute corridor is active.</span>
        </Card>
      )}

      {activeRide && (
        <Card hoverEffect={false} className="border border-brand-primary/20 bg-brand-primary/5 p-4 text-xs text-brand-primaryLight flex items-center justify-between max-w-3xl gap-4">
          <div className="flex items-center gap-2 font-semibold">
            <ClipboardList className="h-4.5 w-4.5" />
            <span>Active Corridor: {activeRide.pickupArea} → {activeRide.destination}</span>
          </div>
          <Badge variant="primary">{activeRide.availableSeats} of {activeRide.totalSeats} seats open</Badge>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        
        {/* Pending Requests Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
              <span>Pending Requests</span>
              <Badge variant="primary" className="text-xs">{pendingRequests.length}</Badge>
            </h3>
          </div>

          <div className="space-y-3.5">
            <AnimatePresence mode="popLayout">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RequestCard
                      request={req}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      isActionable={!!activeRide} // Actions locked if no active ride
                    />
                  </motion.div>
                ))
              ) : (
                <Card hoverEffect={false} className="border border-brand-border/40 p-8 text-center bg-brand-card/25 text-xs text-brand-muted">
                  No pending booking requests from passengers.
                </Card>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Accepted Commuters Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
              <span>Accepted Commuters</span>
              <Badge variant="success" className="text-xs">{acceptedRequests.length}</Badge>
            </h3>
          </div>

          <div className="space-y-3.5">
            <AnimatePresence mode="popLayout">
              {acceptedRequests.length > 0 ? (
                acceptedRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RequestCard
                      request={req}
                      isActionable={false}
                    />
                  </motion.div>
                ))
              ) : (
                <Card hoverEffect={false} className="border border-brand-border/40 p-8 text-center bg-brand-card/25 text-xs text-brand-muted">
                  Accepted passengers will appear here.
                </Card>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

    </div>
  );
};

export default RideRequests;
