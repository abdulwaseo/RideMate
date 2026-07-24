import React, { useEffect, useRef } from 'react';
import { useMapContext } from '../../contexts/MapContext';

export const PassengerLocationMarker: React.FC = () => {
  const { mapInstance, passengerLocation } = useMapContext();
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapInstance || !passengerLocation) {
      if (markerRef.current) {
        if ('map' in markerRef.current) markerRef.current.map = null;
        else if (typeof markerRef.current.setMap === 'function') markerRef.current.setMap(null);
        markerRef.current = null;
      }
      return;
    }

    if (window.google?.maps) {
      const pos = { lat: passengerLocation.latitude, lng: passengerLocation.longitude };

      if (window.google.maps.marker?.AdvancedMarkerElement) {
        const el = document.createElement('div');
        el.style.cssText = `
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(16,185,129,0.4);
          display: flex; align-items: center; justify-content: center;
        `;
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

        if (!markerRef.current) {
          markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
            position: pos,
            map: mapInstance,
            content: el,
            title: 'Passenger Location',
          });
        } else {
          markerRef.current.position = pos;
        }
      } else {
        const svgIcon: google.maps.Symbol = {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        };

        if (!markerRef.current) {
          markerRef.current = new (window.google.maps as any).Marker({
            position: pos,
            map: mapInstance,
            icon: svgIcon,
            title: 'Passenger Location',
          });
        } else {
          markerRef.current.setPosition(pos);
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
  }, [mapInstance, passengerLocation]);

  return null;
};
