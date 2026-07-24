import React, { useEffect, useRef } from 'react';
import { useMapContext } from '../../contexts/MapContext';
import { googleMapsService } from '../../services/googleMapsService';
import type { MapCoordinates, LocationType } from '../../types/location';

interface LocationMarkerProps {
  position: MapCoordinates;
  title: string;
  type?: LocationType;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({ position, title, type = 'pickup' }) => {
  const { mapInstance } = useMapContext();
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!mapInstance) return;

    let isMounted = true;

    const iconColors: Record<LocationType, string> = {
      pickup: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
      destination: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      waypoint: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    };

    googleMapsService
      .createMarker(mapInstance, position, title, iconColors[type])
      .then((marker) => {
        if (isMounted) {
          markerRef.current = marker;
        } else {
          if (marker) marker.map = null;
        }
      })
      .catch((err) => console.warn('Failed to create marker', err));

    return () => {
      isMounted = false;
      if (markerRef.current) {
        if ('map' in markerRef.current) {
          markerRef.current.map = null;
        } else if (typeof markerRef.current.setMap === 'function') {
          markerRef.current.setMap(null);
        }
        markerRef.current = null;
      }
    };
  }, [mapInstance, position.lat, position.lng, title, type]);

  return null;
};
