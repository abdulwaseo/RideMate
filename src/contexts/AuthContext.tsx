import React, { createContext, useState, useEffect, useContext } from 'react';
import { setAuthToken, clearAuthToken } from '../utils/token';
import { API_V1_URL } from '../config/api';

export type UserRole = 'driver' | 'passenger';

export interface UserType {
  id?: string;
  name: string;
  mobileNumber: string;
  email?: string;
  role: UserRole;
  officeName?: string;
  cnicNumber?: string;
  dateOfBirth?: string;
  licenseNumber?: string;
  vehicleType?: 'Car' | 'Bike';
  vehicleManufacturer?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleRegistrationNumber?: string;
}

export interface LoginResult {
  success: boolean;
  errorMsg?: string;
}

export interface RegisterResult {
  success: boolean;
  driverProfileFailed?: boolean;
  errorMsg?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole | null;
  user: UserType | null;
  isLoading: boolean;
  login: (mobileNumber: string, password: string, portalRole?: UserRole) => Promise<LoginResult>;
  logout: () => void;
  register: (userData: UserType & { password?: string }) => Promise<RegisterResult>;
  updateUser: (updatedData: Partial<UserType>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from localStorage or sessionStorage
  useEffect(() => {
    const isAuth = sessionStorage.getItem('ridemate_auth') === 'true' || localStorage.getItem('ridemate_auth') === 'true';
    const storedUser = sessionStorage.getItem('ridemate_user') || localStorage.getItem('ridemate_user');

    if (isAuth && storedUser) {
      try {
        const parsedUser: UserType = JSON.parse(storedUser);
        setUser(parsedUser);
        setRole(parsedUser.role);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to parse stored user:', err);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (mobileNumber: string, password: string, portalRole?: UserRole): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_V1_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          password: password,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const tokens = json.data?.tokens;
        const userObj = json.data?.user;

        if (tokens?.access_token) {
          const backendRole: UserRole = userObj?.role === 'DRIVER' || userObj?.role === 'driver' ? 'driver' : 'passenger';

          // Enforce role-based portal access control
          if (portalRole && backendRole !== portalRole) {
            setIsLoading(false);
            const capitalBackendRole = backendRole === 'passenger' ? 'Passenger' : 'Driver';
            return {
              success: false,
              errorMsg: `This account is registered as a ${capitalBackendRole}. Please log in through the ${capitalBackendRole} portal.`,
            };
          }

          const authUser: UserType = {
            id: userObj?.id,
            name: userObj?.name || 'Commuter',
            mobileNumber: userObj?.mobile_number || mobileNumber,
            email: userObj?.email,
            role: backendRole,
            officeName: userObj?.office_name || 'Dilkusha Towers',
          };

          const token = tokens.access_token;
          const refreshToken = tokens.refresh_token;

          setAuthToken(token, refreshToken);
          sessionStorage.setItem('ridemate_auth', 'true');
          sessionStorage.setItem('ridemate_user', JSON.stringify(authUser));
          localStorage.setItem('ridemate_auth', 'true');
          localStorage.setItem('ridemate_user', JSON.stringify(authUser));

          setUser(authUser);
          setRole(backendRole);
          setIsAuthenticated(true);
          setIsLoading(false);
          return { success: true };
        }
      } else {
        console.warn('[AuthContext] Login rejected by backend:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('[AuthContext] Backend authentication call error:', err);
    }

    setIsLoading(false);
    return { success: false, errorMsg: 'Invalid mobile number or password. Please verify your credentials.' };
  };

  const register = async (userData: UserType & { password?: string }): Promise<RegisterResult> => {
    setIsLoading(true);
    const pwd = userData.password || 'RideMate@2026';
    let driverProfileFailed = false;

    try {
      const res = await fetch(`${API_V1_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          mobile_number: userData.mobileNumber,
          password: pwd,
          office_name: userData.officeName || 'Dilkusha Towers',
          cnic_number: userData.cnicNumber || undefined,
          date_of_birth: userData.dateOfBirth || undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const tokens = json.data?.tokens;

        if (tokens?.access_token) {
          const token = tokens.access_token;
          const refreshToken = tokens.refresh_token;

          setAuthToken(token, refreshToken);
          sessionStorage.setItem('ridemate_auth', 'true');
          sessionStorage.setItem('ridemate_user', JSON.stringify(userData));
          localStorage.setItem('ridemate_auth', 'true');
          localStorage.setItem('ridemate_user', JSON.stringify(userData));

          // If registering as a driver with CNIC & License, provision DriverProfile
          if (userData.role === 'driver' && userData.cnicNumber && userData.licenseNumber) {
            try {
              const driverRes = await fetch(`${API_V1_URL}/drivers/profile`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  cnic_number: userData.cnicNumber,
                  license_number: userData.licenseNumber,
                }),
              });

              if (driverRes.ok) {
                const driverJson = await driverRes.json();
                const newTokens = driverJson.data?.tokens;

                // Replace stale passenger token with newly re-issued driver-role token
                let activeToken = token;
                if (newTokens?.access_token) {
                  activeToken = newTokens.access_token;
                  setAuthToken(newTokens.access_token, newTokens.refresh_token);
                }

                // Provision Vehicle if registered with submitted manufacturer & color
                if (userData.vehicleRegistrationNumber) {
                  if (
                    !userData.vehicleManufacturer ||
                    !userData.vehicleModel ||
                    !userData.vehicleColor
                  ) {
                    console.error('[AuthContext] Missing required vehicle fields for vehicle creation.', {
                      manufacturer: userData.vehicleManufacturer,
                      model: userData.vehicleModel,
                      color: userData.vehicleColor,
                    });
                    driverProfileFailed = true;
                  } else {
                    const vehRes = await fetch(`${API_V1_URL}/vehicles`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${activeToken}`,
                      },
                      body: JSON.stringify({
                        vehicle_type: userData.vehicleType === 'Bike' ? 'Bike' : 'Car',
                        manufacturer: userData.vehicleManufacturer,
                        model: userData.vehicleModel,
                        registration_number: userData.vehicleRegistrationNumber,
                        color: userData.vehicleColor,
                        seat_capacity: userData.vehicleType === 'Bike' ? 1 : 4,
                        is_active: true,
                      }),
                    });
                    if (!vehRes.ok) {
                      driverProfileFailed = true;
                    }
                  }
                }
              } else {
                driverProfileFailed = true;
              }
            } catch (driverErr) {
              console.warn('[AuthContext] Driver profile auto-provision error:', driverErr);
              driverProfileFailed = true;
            }
          }

          setUser(userData);
          setRole(userData.role);
          setIsAuthenticated(true);
          setIsLoading(false);
          return { success: true, driverProfileFailed };
        }
      } else {
        const json = await res.json().catch(() => ({}));
        const msg = json.detail || json.message || 'Registration rejected by backend server.';
        setIsLoading(false);
        return { success: false, errorMsg: msg };
      }
    } catch (err) {
      console.warn('[AuthContext] Backend registration call failed:', err);
    }

    setIsLoading(false);
    return { success: false, errorMsg: 'Unable to connect to authentication server.' };
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedData: Partial<UserType>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedData };
      sessionStorage.setItem('ridemate_user', JSON.stringify(updated));
      localStorage.setItem('ridemate_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        user,
        isLoading,
        login,
        logout,
        register,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
