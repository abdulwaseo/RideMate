import { locationService } from './locationService';
import { locationSyncService } from './locationSyncService';
import { permissionService } from './permissionService';
import type { GPSLocation, PermissionStatus, DriverLocationRecord } from '../types/tracking';

export interface TrackingServiceConfig {
  updateIntervalMs?: number; // Default 3000ms
  minDistanceMeters?: number; // Default 5 meters movement threshold
}

export class TrackingService {
  private updateIntervalMs: number;
  private minDistanceMeters: number;

  private activeRideId: string | null = null;
  private lastSentLocation: GPSLocation | null = null;
  private pollTimer: number | null = null;
  private isTrackingActive: boolean = false;

  constructor(config?: TrackingServiceConfig) {
    this.updateIntervalMs = config?.updateIntervalMs || 3000;
    this.minDistanceMeters = config?.minDistanceMeters || 5;
  }

  /**
   * Check permissions before starting tracking.
   */
  async checkPermissions(): Promise<PermissionStatus> {
    return await permissionService.checkPermissionStatus();
  }

  /**
   * Request GPS permission from user.
   */
  async requestPermissions(): Promise<PermissionStatus> {
    return await permissionService.requestPermission();
  }

  /**
   * Start Driver Live GPS Tracking.
   * Watches browser position, applies 5m movement threshold filter, and syncs with backend.
   */
  startDriverTracking(
    rideId: string | undefined,
    onLocationUpdate: (loc: GPSLocation) => void,
    onError: (err: Error) => void
  ): void {
    this.stopTracking();
    this.activeRideId = rideId || null;
    this.isTrackingActive = true;

    locationService.watchPosition(
      async (location) => {
        if (!this.isTrackingActive) return;

        // Apply movement threshold filter (ignore movement < 5m)
        if (this.lastSentLocation) {
          const dist = locationService.calculateDistanceMeters(
            this.lastSentLocation.latitude,
            this.lastSentLocation.longitude,
            location.latitude,
            location.longitude
          );
          if (dist < this.minDistanceMeters) {
            // Significant movement threshold not met; update local UI state only
            onLocationUpdate(location);
            return;
          }
        }

        // Notify local UI listener
        onLocationUpdate(location);
        this.lastSentLocation = location;

        // Sync with backend API
        try {
          await locationSyncService.updateLocation(location, this.activeRideId);
        } catch (err) {
          console.warn('Location sync temporarily failed:', err);
        }
      },
      (err) => {
        onError(err);
      }
    );
  }

  /**
   * Start Passenger Tracking for Driver's Ride.
   * Polls driver location for the specified rideId.
   */
  startPassengerTracking(
    rideId: string,
    onDriverLocation: (record: DriverLocationRecord) => void,
    onError: (err: Error) => void
  ): void {
    this.stopTracking();
    this.activeRideId = rideId;
    this.isTrackingActive = true;

    const fetchLocation = async () => {
      if (!this.isTrackingActive || !this.activeRideId) return;
      try {
        const record = await locationSyncService.fetchRideLocation(this.activeRideId);
        onDriverLocation(record);
      } catch (err: any) {
        onError(err);
      }
    };

    // Immediate initial fetch
    fetchLocation();

    // Start interval polling
    this.pollTimer = window.setInterval(fetchLocation, this.updateIntervalMs);
  }

  /**
   * Stop any active driver or passenger location tracking.
   */
  stopTracking(): void {
    this.isTrackingActive = false;
    this.activeRideId = null;
    this.lastSentLocation = null;

    locationService.stopWatch();

    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    locationSyncService.stopLocationSharing().catch(() => {});
  }
}

export const trackingService = new TrackingService();
