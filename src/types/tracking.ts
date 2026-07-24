export interface GPSLocation {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  altitude?: number | null;
  timestamp: number;
}

export interface DriverLocationRecord {
  id: string;
  driver_id: string;
  ride_id?: string | null;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  recorded_at: string;
  updated_at: string;
}

export type TrackingStatus = 'idle' | 'locating' | 'tracking' | 'error' | 'stopped';
export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface TrackingState {
  driverLocation: GPSLocation | null;
  passengerLocation: GPSLocation | null;
  status: TrackingStatus;
  permissionStatus: PermissionStatus;
  gpsError: string | null;
  lastSyncTime: number | null;
  autoFollow: boolean;
}

// ─── Sprint 10C: Ride Tracking Session Types ─────────────────────────────────

export type TrackingSessionStatus =
  | 'Preparing'
  | 'DriverEnRoute'
  | 'PassengerPickup'
  | 'RideInProgress'
  | 'DestinationApproaching'
  | 'Completed'
  | 'Cancelled';

export interface TrackingSession {
  id: string;
  ride_id: string;
  driver_id: string;
  started_at: string;
  ended_at?: string;
  current_status: TrackingSessionStatus;
  last_location_at?: string;
  current_eta?: string;
  eta_minutes?: number;
  total_distance_km?: number;
  remaining_distance_km?: number;
  progress_percent?: number;
}

export interface ETAData {
  ride_id: string;
  eta_minutes?: number;
  current_eta_iso?: string;
  remaining_distance_km?: number;
  progress_percent?: number;
  current_status?: string;
  is_delayed?: boolean;
}

export interface LiveLocationUpdate {
  ride_id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  recorded_at: string;
}

export interface RouteProgress {
  ride_id: string;
  progress_percent: number;
  distance_traveled_km: number;
  remaining_distance_km: number;
  current_phase: string;
}
