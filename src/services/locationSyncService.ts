import type { GPSLocation, DriverLocationRecord } from '../types/tracking';

export interface LocationSyncConfig {
  baseUrl?: string;
  pollingIntervalMs?: number;
}

export class LocationSyncService {
  private baseUrl: string;
  private tokenGetter: (() => string | null) | null = null;
  private lastSyncTime: number | null = null;

  constructor(config?: LocationSyncConfig) {
    this.baseUrl = config?.baseUrl || 'http://localhost:8000/api/v1';
  }

  setTokenGetter(getter: () => string | null): void {
    this.tokenGetter = getter;
  }

  getLastSyncTime(): number | null {
    return this.lastSyncTime;
  }

  /**
   * Post driver GPS location update to backend.
   * Transport layer abstraction: can be swapped with WebSocket emit() in Phase 2.
   */
  async updateLocation(location: GPSLocation, rideId?: string | null): Promise<DriverLocationRecord> {
    const token = this.tokenGetter ? this.tokenGetter() : null;

    const payload = {
      latitude: location.latitude,
      longitude: location.longitude,
      heading: location.heading,
      speed: location.speed,
      accuracy: location.accuracy,
      ride_id: rideId || undefined,
    };

    const response = await fetch(`${this.baseUrl}/location/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to update location' }));
      throw new Error(err.detail || 'Failed to update location');
    }

    this.lastSyncTime = Date.now();
    return await response.json();
  }

  /**
   * Fetch driver location for an active ride.
   * Transport layer abstraction: can be swapped with WebSocket message listener in Phase 2.
   */
  async fetchRideLocation(rideId: string): Promise<DriverLocationRecord> {
    const token = this.tokenGetter ? this.tokenGetter() : null;

    const response = await fetch(`${this.baseUrl}/location/ride/${rideId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to fetch ride location' }));
      throw new Error(err.detail || 'Failed to fetch ride location');
    }

    this.lastSyncTime = Date.now();
    return await response.json();
  }

  /**
   * Stop location sharing on backend.
   */
  async stopLocationSharing(): Promise<void> {
    const token = this.tokenGetter ? this.tokenGetter() : null;

    await fetch(`${this.baseUrl}/location/stop`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).catch(() => {});
  }
}

export const locationSyncService = new LocationSyncService();
