import React, { useEffect, useRef, useState } from 'react';
import { useMapContext } from '../../contexts/MapContext';
import { googleMapsService, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../services/googleMapsService';
import { MapLoader } from './MapLoader';
import { CurrentLocationButton } from './CurrentLocationButton';
import { LocationMarker } from './LocationMarker';
import { RoutePreview } from './RoutePreview';
import { RoutePolyline } from './RoutePolyline';
import { RouteSummaryBadge } from './RouteSummaryBadge';
import { DriverLocationMarker, PassengerLocationMarker, AccuracyIndicator } from '../tracking';
import type { MapCoordinates, LocationData } from '../../types/location';

interface MapContainerProps {
  className?: string;
  height?: string;
  center?: MapCoordinates;
  zoom?: number;
  interactive?: boolean;
  onMapClick?: (location: LocationData) => void;
  showCurrentLocationBtn?: boolean;
  showRoutePreview?: boolean;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  className = '',
  height = '500px',
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  interactive = true,
  onMapClick,
  showCurrentLocationBtn = true,
  showRoutePreview = true,
}) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const {
    setMapInstance,
    mapError,
    setMapError,
    selectedPickup,
    selectedDestination,
    markers,
  } = useMapContext();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapElementRef.current) return;

    let isMounted = true;
    setIsLoading(true);

    googleMapsService
      .createMap(mapElementRef.current, {
        center,
        zoom,
        gestureHandling: interactive ? 'greedy' : 'none',
      })
      .then((map) => {
        if (!isMounted) return;
        setMapInstance(map);
        setIsLoading(false);
        setMapError(null);

        if (onMapClick) {
          map.addListener('click', async (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
              const locationData = await googleMapsService.reverseGeocode(coords);
              onMapClick(locationData);
            }
          });
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to initialize map container', err);
        setMapError(err.message || 'Failed to initialize Google Maps.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [center.lat, center.lng, zoom, interactive]);

  if (mapError) {
    return <MapLoader error={mapError} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-gray-800 shadow-2xl ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 z-20">
          <MapLoader />
        </div>
      )}

      <div ref={mapElementRef} className="w-full h-full bg-gray-950" />

      {showCurrentLocationBtn && (
        <div className="absolute top-4 right-4 z-10">
          <CurrentLocationButton />
        </div>
      )}

      {selectedPickup && (
        <LocationMarker
          position={{ lat: selectedPickup.latitude, lng: selectedPickup.longitude }}
          title={`Pickup: ${selectedPickup.formatted_address}`}
          type="pickup"
        />
      )}

      {selectedDestination && (
        <LocationMarker
          position={{ lat: selectedDestination.latitude, lng: selectedDestination.longitude }}
          title={`Destination: ${selectedDestination.formatted_address}`}
          type="destination"
        />
      )}

      {markers.map((m) => (
        <LocationMarker key={m.id} position={m.position} title={m.title} type={m.type} />
      ))}

      {showRoutePreview && selectedPickup && selectedDestination && (
        <RoutePreview
          origin={{ lat: selectedPickup.latitude, lng: selectedPickup.longitude }}
          destination={{ lat: selectedDestination.latitude, lng: selectedDestination.longitude }}
        />
      )}

      {/* Render Polyline & Route HUD Summary Badge */}
      <RoutePolyline />
      <RouteSummaryBadge />

      {/* Live GPS Telemetry Markers & Accuracy Circle */}
      <DriverLocationMarker />
      <PassengerLocationMarker />
      <AccuracyIndicator />
    </div>
  );
};
