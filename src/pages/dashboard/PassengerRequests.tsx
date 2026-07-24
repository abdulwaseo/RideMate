import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { BookingSummaryCard } from '../../components/passenger/BookingSummaryCard';
import { usePassenger } from '../../hooks/usePassenger';

type TabStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';

export const PassengerRequests: React.FC = () => {
  const { bookingRequests, cancelBookingRequest, isLoading } = usePassenger();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabStatus>('Pending');

  // Filter requests matching active tab
  const filteredRequests = bookingRequests.filter((req) => req.status === activeTab);

  const handleCancel = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this booking request?')) {
      await cancelBookingRequest(id);
    }
  };

  const handleViewRide = (rideId: string) => {
    navigate(`/dashboard/passenger/ride-details/${rideId}`);
  };

  const tabs: TabStatus[] = ['Pending', 'Accepted', 'Rejected', 'Cancelled'];

  return (
    <div className="space-y-8 text-left select-none max-w-4xl">
      
      {/* Page Header */}
      <PageHeader 
        title="My Requests" 
        description="Monitor status of sent seat match queries, view accepted bookings, or cancel request corridors."
      />

      {/* Tabs list */}
      <div className="flex border-b border-brand-border/40 gap-1.5 overflow-x-auto pb-1 select-none">
        {tabs.map((tab) => {
          const count = bookingRequests.filter((r) => r.status === tab).length;
          const isActive = activeTab === tab;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive 
                  ? 'border-brand-primary text-brand-primaryLight' 
                  : 'border-transparent text-brand-textMuted hover:text-brand-text'
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Requests panel */}
      <div className="space-y-4 pt-2">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <Card hoverEffect={false} className="p-8 border border-brand-border/40 text-center bg-brand-card/25 animate-pulse h-48">
              <div className="flex items-center justify-center h-full text-brand-textMuted text-xs">
                Loading booking requests...
              </div>
            </Card>
          ) : filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredRequests.map((req) => (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <BookingSummaryCard
                    request={req}
                    onCancelRequest={handleCancel}
                    onViewRideDetails={handleViewRide}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card hoverEffect={false} className="border border-dashed border-brand-border p-8 text-center bg-brand-card/10 space-y-2 text-brand-textMuted">
                <p className="text-sm">No booking requests found under "{activeTab}" status.</p>
                {activeTab === 'Pending' && (
                  <button 
                    onClick={() => navigate('/dashboard/passenger/search')}
                    className="text-xs font-bold text-brand-primary hover:underline mt-1"
                  >
                    Find a ride and request seats
                  </button>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default PassengerRequests;
