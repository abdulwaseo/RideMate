import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchFilters } from '../../components/passenger/SearchFilters';
import { RideResultCard } from '../../components/passenger/RideResultCard';
import { usePassenger } from '../../hooks/usePassenger';

export const SearchRide: React.FC = () => {
  const { searchResults, searchRides, isLoading } = usePassenger();
  const navigate = useNavigate();

  const handleSearch = async (filters: any) => {
    await searchRides(filters);
  };

  const handleViewRideDetails = (rideId: string) => {
    navigate(`/dashboard/passenger/ride-details/${rideId}`);
  };

  return (
    <div className="space-y-8 text-left select-none">

      {/* Page Header */}
      <PageHeader
        title="Search Ride"
        description="Filter verified driver profiles heading to Dilkusha Towers and request a seat match."
      />

      {/* Advanced Search Filter Inputs */}
      <SearchFilters onSearch={handleSearch} isLoading={isLoading} />

      {/* Ride Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-brand-text flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>Available Matches</span>
            <span className="text-xs bg-brand-surface px-2.5 py-0.5 rounded-lg border border-brand-border/40 text-brand-textMuted font-bold">
              {searchResults.length} {searchResults.length === 1 ? 'ride' : 'rides'} found
            </span>
          </span>
        </h3>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <Card key={n} hoverEffect={false} className="border border-brand-border/40 bg-brand-card/10 p-6 space-y-4 animate-pulse h-48">
                <div className="h-4 w-2/3 bg-white/[0.05] rounded" />
                <div className="h-4 w-1/2 bg-white/[0.05] rounded" />
                <div className="h-4 w-3/4 bg-white/[0.05] rounded" />
              </Card>
            ))}
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-4">
            {searchResults.map((ride) => (
              <RideResultCard
                key={ride.id}
                ride={ride}
                onViewDetails={handleViewRideDetails}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Compass}
            title="No Matching Rides Found"
            description="Try expanding your pickup area filter, modifying departure timings, or resetting vehicle overrides."
            actionText="Clear All Filters"
            onAction={() => handleSearch({
              pickupArea: '',
              destination: 'Dilkusha Towers',
              date: '',
              departureTime: '',
              vehicleType: 'All',
              minSeats: 1,
              minRating: 0,
            })}
            className="max-w-xl mx-auto"
          />
        )}
      </div>

    </div>
  );
};

export default SearchRide;
