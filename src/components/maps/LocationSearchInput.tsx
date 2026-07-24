import React, { useState, useEffect, useRef } from 'react';
import { googleMapsService } from '../../services/googleMapsService';
import type { LocationData, AutocompleteSuggestion, LocationType } from '../../types/location';

interface LocationSearchInputProps {
  label?: string;
  placeholder?: string;
  type?: LocationType;
  value?: string;
  onSelectLocation: (location: LocationData) => void;
  onClear?: () => void;
  className?: string;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  label,
  placeholder = 'Search location (e.g. Clifton, Gulshan, DHA)...',
  type = 'pickup',
  value = '',
  onSelectLocation,
  onClear,
  className = '',
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuery(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await googleMapsService.getPlacePredictions(text);
        setSuggestions(results);
        setIsOpen(true);
      } catch (err) {
        console.warn('Error fetching Google Places predictions:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  };

  const handleSelect = async (suggestion: AutocompleteSuggestion) => {
    setQuery(suggestion.description || suggestion.main_text);
    setIsOpen(false);
    setIsLoading(true);

    try {
      const locationData = await googleMapsService.getPlaceDetails(suggestion.place_id);
      setQuery(locationData.formatted_address);
      onSelectLocation(locationData);
    } catch (err) {
      console.error('Error resolving Google Place details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    if (onClear) onClear();
  };

  const badgeColors: Record<LocationType, string> = {
    pickup: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    destination: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    waypoint: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>{label}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeColors[type]}`}>
            {type.toUpperCase()}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-gray-400 pointer-events-none">
          {type === 'pickup' ? (
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-11 pr-10 py-3 bg-gray-900/90 border border-gray-700/80 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner backdrop-blur-md"
        />

        {isLoading ? (
          <div className="absolute right-3.5 w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-gray-900/95 border border-gray-700/80 rounded-xl shadow-2xl backdrop-blur-xl max-h-60 overflow-y-auto divide-y divide-gray-800">
          {suggestions.length > 0 ? (
            suggestions.map((item) => (
              <button
                type="button"
                key={item.place_id}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-3 hover:bg-indigo-600/20 transition-colors flex items-start space-x-3 group"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-gray-100 group-hover:text-white">
                    {item.main_text}
                  </div>
                  <div className="text-xs text-gray-400 group-hover:text-gray-300">
                    {item.secondary_text}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-xs text-slate-400">
              No locations found for <strong className="text-white">"{query}"</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
