import React, { useEffect, useState } from 'react';
import { useMapContext } from '../../contexts/MapContext';
import { googleMapsService } from '../../services/googleMapsService';
import type { MapCoordinates } from '../../types/location';

interface RoutePreviewProps {
  origin: MapCoordinates;
  destination: MapCoordinates;
}

export const RoutePreview: React.FC<RoutePreviewProps> = ({ origin, destination }) => {
  const { mapInstance } = useMapContext();
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMins: number } | null>(null);

  useEffect(() => {
    if (!mapInstance) return;

    googleMapsService.calculateRoutePreview(origin, destination).then((info) => {
      setRouteInfo({
        distanceKm: info.distanceKm,
        durationMins: info.durationMins,
      });

      if (window.google && window.google.maps) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(destination);
        mapInstance.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }
    });
  }, [mapInstance, origin.lat, origin.lng, destination.lat, destination.lng]);

  if (!routeInfo) return null;

  return (
    <div className="absolute bottom-6 left-6 z-10 bg-gray-900/90 border border-gray-700/80 text-gray-100 rounded-xl p-4 shadow-xl backdrop-blur-md flex items-center space-x-6">
      <div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Estimated Distance</span>
        <span className="text-lg font-bold text-indigo-400">{routeInfo.distanceKm} km</span>
      </div>
      <div className="h-8 w-px bg-gray-700"></div>
      <div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Estimated Time</span>
        <span className="text-lg font-bold text-emerald-400">{routeInfo.durationMins} mins</span>
      </div>
    </div>
  );
};
