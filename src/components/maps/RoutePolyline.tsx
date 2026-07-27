import React, { useEffect, useRef } from 'react';
import { useMapContext } from '../../contexts/MapContext';

export const RoutePolyline: React.FC = () => {
  const { mapInstance, currentRoute } = useMapContext();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    // Guard: ensure both mapInstance and currentRoute are ready
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
        const pickupLat = Number(currentRoute.pickup_location.latitude);
        const pickupLng = Number(currentRoute.pickup_location.longitude);
        const destLat = Number(currentRoute.destination_location.latitude);
        const destLng = Number(currentRoute.destination_location.longitude);

        if (!isNaN(pickupLat) && !isNaN(pickupLng) && !isNaN(destLat) && !isNaN(destLng)) {
          pathCoords = [
            new window.google.maps.LatLng(pickupLat, pickupLng),
            new window.google.maps.LatLng(destLat, destLng),
          ];
        }
      }

      if (pathCoords.length > 0) {
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
