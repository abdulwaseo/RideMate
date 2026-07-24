import type { PermissionStatus } from '../types/tracking';

export class PermissionService {
  /**
   * Check current Geolocation permission status.
   */
  async checkPermissionStatus(): Promise<PermissionStatus> {
    if (!('geolocation' in navigator)) {
      return 'unsupported';
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return this.mapStatus(result.state);
      } catch (err) {
        // Fallback to prompt if query throws
        return 'prompt';
      }
    }

    return 'prompt';
  }

  /**
   * Request Geolocation permission by calling getCurrentPosition.
   */
  requestPermission(): Promise<PermissionStatus> {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve('unsupported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => resolve('granted'),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve('denied');
          } else {
            resolve('prompt');
          }
        },
        { timeout: 5000 }
      );
    });
  }

  private mapStatus(state: PermissionState): PermissionStatus {
    switch (state) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      default:
        return 'prompt';
    }
  }
}

export const permissionService = new PermissionService();
