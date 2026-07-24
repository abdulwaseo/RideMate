import type { GPSLocation } from '../types/tracking';

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class LocationService {
  private watchId: number | null = null;

  /**
   * Acquire current device GPS coordinates once.
   */
  getCurrentPosition(options?: GeolocationOptions): Promise<GPSLocation> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('GPS unavailable: Browser does not support geolocation.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(this.formatPosition(pos)),
        (err) => reject(this.formatError(err)),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
          ...options,
        }
      );
    });
  }

  /**
   * Start listening to continuous GPS position updates.
   */
  watchPosition(
    onLocation: (location: GPSLocation) => void,
    onError: (error: Error) => void,
    options?: GeolocationOptions
  ): void {
    if (!('geolocation' in navigator)) {
      onError(new Error('GPS unavailable: Browser does not support geolocation.'));
      return;
    }

    this.stopWatch();

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const location = this.formatPosition(pos);
        if (this.isValidCoordinate(location.latitude, location.longitude)) {
          onLocation(location);
        }
      },
      (err) => onError(this.formatError(err)),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000,
        ...options,
      }
    );
  }

  /**
   * Stop watching GPS position updates.
   */
  stopWatch(): void {
    if (this.watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two coordinates in meters (Haversine Formula).
   */
  calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private isValidCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  private formatPosition(pos: GeolocationPosition): GPSLocation {
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      heading: pos.coords.heading ?? null,
      speed: pos.coords.speed ?? null,
      accuracy: pos.coords.accuracy ?? null,
      altitude: pos.coords.altitude ?? null,
      timestamp: pos.timestamp || Date.now(),
    };
  }

  private formatError(err: GeolocationPositionError): Error {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return new Error('Location permission denied by user.');
      case err.POSITION_UNAVAILABLE:
        return new Error('GPS signal unavailable. Please ensure location services are enabled.');
      case err.TIMEOUT:
        return new Error('GPS location request timed out.');
      default:
        return new Error('An unknown GPS error occurred.');
    }
  }
}

export const locationService = new LocationService();
