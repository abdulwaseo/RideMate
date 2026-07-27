import React, { useState } from 'react';
import { Search, Calendar, Clock, Star, Users, Car } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LocationSearchInput } from '../maps/LocationSearchInput';
import type { SearchFilters as SearchFiltersType } from '../../contexts/PassengerContext';

interface SearchFiltersProps {
  onSearch: (filters: SearchFiltersType) => void;
  isLoading?: boolean;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch, isLoading = false }) => {
  const [pickupArea, setPickupArea] = useState('');
  const [destination, setDestination] = useState('Dilkusha Towers');
  const [date, setDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike' | 'All'>('All');
  const [minSeats, setMinSeats] = useState<number>(1);
  const [minRating, setMinRating] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      pickupArea,
      destination,
      date,
      departureTime,
      vehicleType,
      minSeats,
      minRating,
    });
  };

  const handleReset = () => {
    setPickupArea('');
    setDestination('Dilkusha Towers');
    setDate('');
    setDepartureTime('');
    setVehicleType('All');
    setMinSeats(1);
    setMinRating(0);
    onSearch({
      pickupArea: '',
      destination: 'Dilkusha Towers',
      date: '',
      departureTime: '',
      vehicleType: 'All',
      minSeats: 1,
      minRating: 0,
    });
  };

  return (
    <Card hoverEffect={false} className="border border-brand-border bg-brand-card shadow-glass p-6 text-left select-none">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core inputs: Pickup and Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LocationSearchInput
            label="Pickup Location"
            placeholder="Search pickup area (e.g., Gulshan, Nazimabad, Clifton)..."
            type="pickup"
            value={pickupArea}
            onSelectLocation={(loc) => setPickupArea(loc.name || loc.formatted_address)}
            onClear={() => setPickupArea('')}
          />

          <LocationSearchInput
            label="Destination"
            placeholder="Search destination (e.g., Dilkusha Towers, Karachi)..."
            type="destination"
            value={destination}
            onSelectLocation={(loc) => setDestination(loc.name || loc.formatted_address)}
            onClear={() => setDestination('')}
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Date Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-brand-textMuted uppercase flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Date</span>
            </label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-brand-text text-sm transition-all focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 h-10"
              disabled={isLoading}
            />
          </div>

          {/* Time Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-brand-textMuted uppercase flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Time</span>
            </label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-brand-text text-sm transition-all focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 h-10"
              disabled={isLoading}
            />
          </div>

          {/* Vehicle Type Toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-brand-textMuted uppercase flex items-center gap-1">
              <Car className="h-3.5 w-3.5" />
              <span>Vehicle Type</span>
            </label>
            <div className="flex bg-brand-surface border border-brand-border rounded-xl p-0.5 h-10">
              {(['All', 'Car', 'Bike'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVehicleType(type)}
                  className={`flex-1 rounded-lg text-xs font-bold uppercase transition-all ${
                    vehicleType === type
                      ? 'bg-brand-primary/10 text-brand-primaryLight border border-brand-primary/20'
                      : 'text-brand-textMuted hover:text-brand-text border border-transparent'
                  }`}
                  disabled={isLoading}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Seats Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-brand-textMuted uppercase flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>Seats Required</span>
            </label>
            <div className="flex bg-brand-surface border border-brand-border rounded-xl p-0.5 h-10">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMinSeats(num)}
                  className={`flex-1 rounded-lg text-xs font-bold transition-all ${
                    minSeats === num
                      ? 'bg-brand-accent/10 text-brand-accentLight border border-brand-accent/20'
                      : 'text-brand-textMuted hover:text-brand-text border border-transparent'
                  }`}
                  disabled={isLoading}
                >
                  {num}+
                </button>
              ))}
            </div>
          </div>

          {/* Rating filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-brand-textMuted uppercase flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              <span>Driver Rating</span>
            </label>
            <div className="flex bg-brand-surface border border-brand-border rounded-xl p-0.5 h-10">
              {[0, 4.0, 4.5, 4.8].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setMinRating(rating)}
                  className={`flex-1 rounded-lg text-xs font-bold transition-all ${
                    minRating === rating
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-brand-textMuted hover:text-brand-text border border-transparent'
                  }`}
                  disabled={isLoading}
                >
                  {rating === 0 ? 'Any' : `${rating}★`}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Buttons Action Panel */}
        <div className="flex justify-end gap-3 pt-3 border-t border-brand-border/40">
          <Button
            type="button"
            variant="glass"
            size="sm"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset Filters
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            leftIcon={<Search className="h-4 w-4" />}
            isLoading={isLoading}
          >
            Search Rides
          </Button>
        </div>

      </form>
    </Card>
  );
};
