import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { BookingSummaryCard } from '../../components/passenger/BookingSummaryCard';
import { PassengerRateDriverModal } from '../../components/passenger/PassengerRateDriverModal';
import { usePassenger } from '../../hooks/usePassenger';
import { getAuthToken } from '../../utils/token';
import type { BookingRequest } from '../../contexts/RideContext';

type TabStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' | 'Completed';

const filterRequestsByTab = (requests: BookingRequest[], tab: TabStatus) => {
  return requests.filter((req) => {
    const isRideCancelled = req.ride.status === 'Cancelled';
    const isRideCompleted = req.ride.status === 'Completed';

    if (tab === 'Pending') {
      return req.status === 'Pending' && !isRideCancelled && !isRideCompleted;
    }
    if (tab === 'Accepted') {
      return req.status === 'Accepted' && !isRideCancelled && !isRideCompleted;
    }
    if (tab === 'Rejected') {
      return req.status === 'Rejected';
    }
    if (tab === 'Cancelled') {
      return req.status === 'Cancelled' || (isRideCancelled && req.status !== 'Completed');
    }
    if (tab === 'Completed') {
      return req.status === 'Completed' || (req.status === 'Accepted' && isRideCompleted);
    }
    return false;
  });
};

import { API_V1_URL } from '../../config/api';

export const PassengerRequests: React.FC = () => {
  const { bookingRequests, cancelBookingRequest, isLoading, refreshAllData } = usePassenger();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabStatus>('Pending');
  const [ratedRideIds, setRatedRideIds] = useState<Set<string>>(new Set());

  // Modal state for rating driver
  const [rateDriverModal, setRateDriverModal] = useState<{
    isOpen: boolean;
    rideId: string;
    driverId: string;
    driverName: string;
    routeName?: string;
  }>({
    isOpen: false,
    rideId: '',
    driverId: '',
    driverName: '',
  });

  const fetchMyRatings = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`${API_V1_URL}/ratings/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const ratings = json.data || [];
        const ids = new Set<string>(ratings.map((r: any) => r.ride_id));
        setRatedRideIds(ids);
      }
    } catch (err) {
      console.warn('[PassengerRequests] Fetch my ratings error:', err);
    }
  }, []);

  useEffect(() => {
    if (refreshAllData) {
      refreshAllData();
    }
    fetchMyRatings();
  }, [location.key, location.pathname, refreshAllData, fetchMyRatings]);

  // Filter requests matching active tab
  const filteredRequests = filterRequestsByTab(bookingRequests, activeTab);

  const handleCancel = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this booking request?')) {
      await cancelBookingRequest(id);
    }
  };

  const handleViewRide = (rideId: string) => {
    navigate(`/dashboard/passenger/ride-details/${rideId}`);
  };

  const handleOpenRateDriverModal = (req: BookingRequest) => {
    setRateDriverModal({
      isOpen: true,
      rideId: req.ride.id,
      driverId: req.ride.driverId,
      driverName: req.ride.driver.name,
      routeName: `${req.ride.pickupArea} → ${req.ride.destination}`,
    });
  };

  const tabs: TabStatus[] = ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'];

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
          const count = filterRequestsByTab(bookingRequests, tab).length;
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
                    onRateDriver={handleOpenRateDriverModal}
                    isAlreadyRated={ratedRideIds.has(req.ride.id)}
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

      {/* Fallback Rate Driver Modal */}
      <PassengerRateDriverModal
        isOpen={rateDriverModal.isOpen}
        onClose={() => setRateDriverModal((prev) => ({ ...prev, isOpen: false }))}
        rideId={rateDriverModal.rideId}
        driverId={rateDriverModal.driverId}
        driverName={rateDriverModal.driverName}
        routeName={rateDriverModal.routeName}
        onSubmitted={() => {
          setRatedRideIds((prev) => new Set(prev).add(rateDriverModal.rideId));
          fetchMyRatings();
        }}
      />

    </div>
  );
};

export default PassengerRequests;
