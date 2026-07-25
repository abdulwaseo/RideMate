/**
 * Centralized Token Utility for RideMate
 * Ensures consistent retrieval, persistence, and cleanup of JWT tokens
 * across both sessionStorage and localStorage.
 */

export const getAuthToken = (): string | null => {
  const token =
    sessionStorage.getItem('ridemate_access_token') ||
    localStorage.getItem('ridemate_access_token') ||
    localStorage.getItem('access_token');

  // Ignore legacy mock tokens if any exist
  if (token && token.startsWith('ridemate_jwt_')) {
    clearAuthToken();
    return null;
  }

  return token || null;
};

export const setAuthToken = (token: string, refreshToken?: string): void => {
  sessionStorage.setItem('ridemate_access_token', token);
  localStorage.setItem('ridemate_access_token', token);
  localStorage.setItem('access_token', token);

  if (refreshToken) {
    sessionStorage.setItem('ridemate_refresh_token', refreshToken);
    localStorage.setItem('ridemate_refresh_token', refreshToken);
  }
};

export const clearAuthToken = (): void => {
  sessionStorage.removeItem('ridemate_auth');
  sessionStorage.removeItem('ridemate_user');
  sessionStorage.removeItem('ridemate_access_token');
  sessionStorage.removeItem('ridemate_refresh_token');

  localStorage.removeItem('ridemate_auth');
  localStorage.removeItem('ridemate_user');
  localStorage.removeItem('ridemate_access_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('ridemate_refresh_token');
};
