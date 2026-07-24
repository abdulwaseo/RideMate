import React, { useEffect, useRef } from 'react';
import { useMapContext } from '../../contexts/MapContext';

export const AccuracyIndicator: React.FC = () => {
  const { mapInstance, driverLocation } = useMapContext();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!mapInstance || !driverLocation || !driverLocation.accuracy) {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      return;
    }

    if (window.google && window.google.maps) {
      const center = { lat: driverLocation.latitude, lng: driverLocation.longitude };
      const radius = driverLocation.accuracy;

      if (!circleRef.current) {
        const circle = new window.google.maps.Circle({
          center,
          radius,
          map: mapInstance,
          fillColor: '#6366f1',
          fillOpacity: 0.15,
          strokeColor: '#6366f1',
          strokeOpacity: 0.4,
          strokeWeight: 1,
        });
        circleRef.current = circle;
      } else {
        circleRef.current.setCenter(center);
        circleRef.current.setRadius(radius);
      }
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [mapInstance, driverLocation]);

  return null;
};
