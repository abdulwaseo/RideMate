import React, { useEffect, useRef } from 'react';
import { useMapContext } from '../../contexts/MapContext';

export const RoutePolyline: React.FC = () => {
  const { mapInstance, currentRoute } = useMapContext();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!mapInstance || !currentRoute) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    if (window.google && window.google.maps) {
      // Clean up previous polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      // Check if encoded polyline decoding geometry is available
      let pathCoords: google.maps.LatLng[] = [];
      if (window.google.maps.geometry?.encoding && currentRoute.polyline && !currentRoute.polyline.startsWith('mock')) {
        pathCoords = window.google.maps.geometry.encoding.decodePath(currentRoute.polyline);
      } else {
        // Fallback straight line segment
        pathCoords = [
          new window.google.maps.LatLng(currentRoute.pickup_location.latitude, currentRoute.pickup_location.longitude),
          new window.google.maps.LatLng(currentRoute.destination_location.latitude, currentRoute.destination_location.longitude),
        ];
      }

      const polyline = new window.google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: '#6366f1', // Indigo primary
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map: mapInstance,
      });

      polylineRef.current = polyline;

      // Fit map to route bounds
      const bounds = new window.google.maps.LatLngBounds();
      pathCoords.forEach((coord) => bounds.extend(coord));
      mapInstance.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [mapInstance, currentRoute]);

  return null;
};
