import React, { useEffect, useRef } from 'react';
import type { GPSLocation } from '../../types/tracking';
import { LiveDriverMarker } from './LiveDriverMarker';
import { Crosshair, Navigation2 } from 'lucide-react';

interface RideTrackingMapProps {
  map: google.maps.Map | null;
  driverLocation: GPSLocation | null;
  passengerLocation?: GPSLocation | null;
  autoFollow: boolean;
  onToggleAutoFollow: () => void;
  className?: string;
}

/**
 * Full-featured ride tracking map overlay.
 * Renders the live driver marker, passenger marker, and auto-follow control.
 * Uses the existing map instance from MapContext — does not create a new map.
 */
export const RideTrackingMap: React.FC<RideTrackingMapProps> = ({
  map,
  driverLocation,
  passengerLocation,
  autoFollow,
  onToggleAutoFollow,
  className = '',
}) => {
  const passengerMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const pathPointsRef = useRef<google.maps.LatLngLiteral[]>([]);

  // Draw polyline as driver moves
  useEffect(() => {
    if (!map || !driverLocation) return;

    const newPoint = { lat: driverLocation.latitude, lng: driverLocation.longitude };
    pathPointsRef.current = [...pathPointsRef.current, newPoint];

    if (polylineRef.current) {
      polylineRef.current.setPath(pathPointsRef.current);
    } else {
      polylineRef.current = new google.maps.Polyline({
        map,
        path: pathPointsRef.current,
        strokeColor: '#10b981',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        geodesic: true,
      });
    }
  }, [map, driverLocation]);

  // Passenger marker
  useEffect(() => {
    if (!map || !passengerLocation) return;
    const latlng = { lat: passengerLocation.latitude, lng: passengerLocation.longitude };

    if (passengerMarkerRef.current) {
      (passengerMarkerRef.current as any).position = latlng;
    } else if (window.google?.maps?.marker?.AdvancedMarkerElement) {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 32px; height: 32px; border-radius: 50%;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(99,102,241,0.4);
      `;
      passengerMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: latlng,
        content: el,
        title: 'You',
      });
    }
  }, [map, passengerLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
      if (passengerMarkerRef.current) { passengerMarkerRef.current.map = null; passengerMarkerRef.current = null; }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Imperatively rendered onto existing map */}
      <LiveDriverMarker map={map} location={driverLocation} animate={autoFollow} />

      {/* Auto-follow toggle */}
      <button
        onClick={onToggleAutoFollow}
        title={autoFollow ? 'Auto-follow ON' : 'Auto-follow OFF'}
        className={`absolute bottom-4 right-4 z-10 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border shadow-lg transition ${
          autoFollow
            ? 'bg-emerald-600 border-emerald-500 text-white'
            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-500'
        }`}
      >
        {autoFollow ? <Crosshair className="w-4 h-4" /> : <Navigation2 className="w-4 h-4" />}
        {autoFollow ? 'Following' : 'Follow Driver'}
      </button>
    </div>
  );
};
