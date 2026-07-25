import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type { TrackingSession, ETAData, TrackingSessionStatus } from '../types/tracking';
import type { GPSLocation } from '../types/tracking';
import type { WSEvent } from '../types/websocket';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { getAuthToken } from '../utils/token';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface TrackingContextType {
  activeSession: TrackingSession | null;
  isTracking: boolean;
  sessionStatus: TrackingSessionStatus | null;
  driverLocation: GPSLocation | null;
  etaData: ETAData | null;
  lastLocationAt: Date | null;
  startTracking: (rideId: string) => Promise<void>;
  stopTracking: (rideId: string) => Promise<void>;
  sendLocationUpdate: (rideId: string, location: GPSLocation) => void;
  advancePhase: (rideId: string, phase: string) => void;
  subscribeToRide: (rideId: string) => Promise<void>;
  fetchETA: (rideId: string) => Promise<void>;
  clearSession: () => void;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

// ─── Helper: REST API call via localStorage token ─────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function apiCall<T>(method: string, path: string, body?: unknown): Promise<T | null> {
  const token = getAuthToken() ?? '';
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const TrackingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<TrackingSession | null>(null);
  const [driverLocation, setDriverLocation] = useState<GPSLocation | null>(null);
  const [etaData, setEtaData] = useState<ETAData | null>(null);
  const [lastLocationAt, setLastLocationAt] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const sessionStatus = activeSession?.current_status ?? null;
  const isTracking = !!activeSession && !activeSession.ended_at;

  // ─── WebSocket Event Listeners ─────────────────────────────────────────────

  useSocketEvent<Record<string, any>>('ride_tracking_start', useCallback((event: WSEvent<Record<string, any>>) => {
    const payload = event.payload as unknown as TrackingSession;
    if (payload) setActiveSession(payload);
  }, []));

  useSocketEvent<Record<string, any>>('location_updated', useCallback((event: WSEvent<Record<string, any>>) => {
    const p = event.payload;
    setDriverLocation({
      latitude: p['latitude'],
      longitude: p['longitude'],
      heading: p['heading'],
      speed: p['speed'],
      accuracy: p['accuracy'],
      timestamp: p['recorded_at'] ? new Date(p['recorded_at'] as string).getTime() : Date.now(),
    });
    setLastLocationAt(new Date());
  }, []));

  useSocketEvent<Record<string, any>>('eta_updated', useCallback((event: WSEvent<Record<string, any>>) => {
    const p = event.payload as unknown as ETAData;
    setEtaData(p);
    if (p.progress_percent !== undefined) {
      setActiveSession((prev) =>
        prev ? {
          ...prev,
          eta_minutes: p.eta_minutes,
          remaining_distance_km: p.remaining_distance_km,
          progress_percent: p.progress_percent,
          current_eta: p.current_eta_iso,
        } : prev
      );
    }
  }, []));

  useSocketEvent<Record<string, any>>('tracking_stopped', useCallback(() => {
    setActiveSession((prev) => prev ? { ...prev, ended_at: new Date().toISOString() } : prev);
  }, []));

  useSocketEvent<Record<string, any>>('ride_completed', useCallback(() => {
    setActiveSession((prev) =>
      prev ? { ...prev, current_status: 'Completed', ended_at: new Date().toISOString() } : prev
    );
  }, []));

  useSocketEvent<Record<string, any>>('passenger_picked_up', useCallback(() => {
    setActiveSession((prev) => prev ? { ...prev, current_status: 'PassengerPickup' } : prev);
  }, []));

  useSocketEvent<Record<string, any>>('ride_started', useCallback(() => {
    setActiveSession((prev) => prev ? { ...prev, current_status: 'RideInProgress' } : prev);
  }, []));

  // ─── Driver: Start Tracking ────────────────────────────────────────────────

  const startTracking = useCallback(async (rideId: string) => {
    const session = await apiCall<TrackingSession>('POST', `/api/v1/tracking/${rideId}/start`);
    if (session) setActiveSession(session);
  }, []);

  // ─── Driver: Stop Tracking ─────────────────────────────────────────────────

  const stopTracking = useCallback(async (rideId: string) => {
    const session = await apiCall<TrackingSession>('POST', `/api/v1/tracking/${rideId}/stop`);
    if (session) setActiveSession(session);
  }, []);

  // ─── Driver: Broadcast Location via WebSocket ─────────────────────────────

  const sendLocationUpdate = useCallback((rideId: string, location: GPSLocation) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      event_type: 'location_updated',
      payload: {
        ride_id: rideId,
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        speed: location.speed,
        accuracy: location.accuracy,
      },
    }));
  }, []);

  // ─── Driver: Phase Advance ─────────────────────────────────────────────────

  const advancePhase = useCallback((rideId: string, phase: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ event_type: phase, payload: { ride_id: rideId } }));
  }, []);

  // ─── Passenger: Subscribe to ride room ───────────────────────────────────

  const subscribeToRide = useCallback(async (rideId: string) => {
    const session = await apiCall<TrackingSession>('GET', `/api/v1/tracking/${rideId}/session`);
    if (session) setActiveSession(session);
  }, []);

  // ─── Passenger: Poll ETA ──────────────────────────────────────────────────

  const fetchETA = useCallback(async (rideId: string) => {
    const eta = await apiCall<ETAData>('GET', `/api/v1/tracking/${rideId}/eta`);
    if (eta) setEtaData(eta);
  }, []);

  const clearSession = useCallback(() => {
    setActiveSession(null);
    setDriverLocation(null);
    setEtaData(null);
  }, []);

  return (
    <TrackingContext.Provider
      value={{
        activeSession,
        isTracking,
        sessionStatus,
        driverLocation,
        etaData,
        lastLocationAt,
        startTracking,
        stopTracking,
        sendLocationUpdate,
        advancePhase,
        subscribeToRide,
        fetchETA,
        clearSession,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTrackingContext = (): TrackingContextType => {
  const ctx = useContext(TrackingContext);
  if (!ctx) throw new Error('useTrackingContext must be used inside <TrackingProvider>');
  return ctx;
};
