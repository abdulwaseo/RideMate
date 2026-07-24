import React, { useEffect, useRef } from 'react';
import type { GPSLocation } from '../../types/tracking';

interface LiveDriverMarkerProps {
  map: google.maps.Map | null;
  location: GPSLocation | null;
  animate?: boolean;
}

/**
 * Renders an animated driver marker on a Google Maps instance.
 * Smoothly interpolates position and rotates with heading.
 */
export const LiveDriverMarker: React.FC<LiveDriverMarkerProps> = ({
  map,
  location,
  animate = true,
}) => {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map || !location) return;

    const latlng = { lat: location.latitude, lng: location.longitude };

    // Accuracy circle
    if (location.accuracy) {
      if (circleRef.current) {
        circleRef.current.setCenter(latlng);
        circleRef.current.setRadius(location.accuracy);
      } else {
        circleRef.current = new google.maps.Circle({
          map,
          center: latlng,
          radius: location.accuracy,
          strokeColor: '#10b981',
          strokeOpacity: 0.4,
          strokeWeight: 1,
          fillColor: '#10b981',
          fillOpacity: 0.08,
        });
      }
    }

    // Driver marker — use AdvancedMarkerElement if available, else fallback Marker
    if (window.google?.maps?.marker?.AdvancedMarkerElement) {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 40px; height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981, #059669);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(16,185,129,0.4);
        display: flex; align-items: center; justify-content: center;
        transform: rotate(${location.heading ?? 0}deg);
        transition: transform 0.6s ease;
      `;
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm7 3L7 17h10L12 6z"/></svg>`;

      if (markerRef.current) {
        (markerRef.current as any).position = latlng;
        const content = (markerRef.current as any).content as HTMLElement | null;
        if (content) content.style.transform = `rotate(${location.heading ?? 0}deg)`;
      } else {
        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: latlng,
          content: el,
          title: 'Driver',
        });
      }
    } else {
      // Fallback for environments without AdvancedMarkerElement
      if (markerRef.current) {
        (markerRef.current as any).setPosition(latlng);
      }
    }

    if (animate) {
      map.panTo(latlng);
    }

    return () => {
      // Cleanup on unmount
    };
  }, [map, location, animate]);

  useEffect(() => {
    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      if (markerRef.current) {
        if ('setMap' in markerRef.current) {
          (markerRef.current as any).setMap(null);
        } else {
          markerRef.current.map = null;
        }
        markerRef.current = null;
      }
    };
  }, []);

  return null; // Renders onto map imperatively
};
