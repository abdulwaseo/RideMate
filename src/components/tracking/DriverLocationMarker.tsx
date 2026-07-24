import React, { useEffect, useRef } from 'react';
import { useMapContext } from '../../contexts/MapContext';

export const DriverLocationMarker: React.FC = () => {
  const { mapInstance, driverLocation } = useMapContext();
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapInstance || !driverLocation) {
      if (markerRef.current) {
        if ('map' in markerRef.current) markerRef.current.map = null;
        else if (typeof markerRef.current.setMap === 'function') markerRef.current.setMap(null);
        markerRef.current = null;
      }
      return;
    }

    if (window.google?.maps) {
      const pos = { lat: driverLocation.latitude, lng: driverLocation.longitude };
      const heading = driverLocation.heading || 0;

      if (window.google.maps.marker?.AdvancedMarkerElement) {
        const el = document.createElement('div');
        el.style.cssText = `
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(79,70,229,0.4);
          display: flex; align-items: center; justify-content: center;
          transform: rotate(${heading}deg);
          transition: transform 0.4s ease;
        `;
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>`;

        if (!markerRef.current) {
          markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
            position: pos,
            map: mapInstance,
            content: el,
            title: 'Live Driver Location',
          });
        } else {
          markerRef.current.position = pos;
          if (markerRef.current.content) {
            (markerRef.current.content as HTMLElement).style.transform = `rotate(${heading}deg)`;
          }
        }
      } else {
        const svgIcon: google.maps.Symbol = {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#4f46e5',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: heading,
        };

        if (!markerRef.current) {
          markerRef.current = new (window.google.maps as any).Marker({
            position: pos,
            map: mapInstance,
            icon: svgIcon,
            title: 'Live Driver Location',
          });
        } else {
          markerRef.current.setPosition(pos);
          markerRef.current.setIcon(svgIcon);
        }
      }
    }

    return () => {
      if (markerRef.current) {
        if ('map' in markerRef.current) markerRef.current.map = null;
        else if (typeof markerRef.current.setMap === 'function') markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [mapInstance, driverLocation]);

  return null;
};
