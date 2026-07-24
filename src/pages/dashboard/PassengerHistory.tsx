import React from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PassengerTimelineCard } from '../../components/passenger/PassengerTimelineCard';
import { usePassenger } from '../../hooks/usePassenger';

export const PassengerHistory: React.FC = () => {
  const { rideHistory } = usePassenger();

  return (
    <div className="space-y-8 text-left select-none max-w-4xl">
      <PageHeader 
        title="Ride History" 
        description="Verify details of past completed trips, match records, and carbon credit offsets."
      />

      <PassengerTimelineCard entries={rideHistory} />
    </div>
  );
};

export default PassengerHistory;
