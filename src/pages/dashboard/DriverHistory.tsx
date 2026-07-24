import React from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { RideTimeline } from '../../components/driver/RideTimeline';
import { useDriver } from '../../hooks/useDriver';

export const DriverHistory: React.FC = () => {
  const { rideHistory } = useDriver();

  return (
    <div className="space-y-8 text-left select-none max-w-4xl">
      <PageHeader 
        title="Ride History" 
        description="Verify details of past completed trips, splitting fares logs, and environmental offset benchmarks."
      />

      <RideTimeline rides={rideHistory} />
    </div>
  );
};

export default DriverHistory;
