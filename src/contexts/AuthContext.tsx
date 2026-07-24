import React, { createContext, useState, useEffect, useContext } from 'react';

export type UserRole = 'driver' | 'passenger';

export interface UserType {
  name: string;
  mobileNumber: string;
  email?: string;
  role: UserRole;
  officeName?: string;
  cnicNumber?: string;
  licenseNumber?: string;
  vehicleType?: 'Car' | 'Bike';
  vehicleModel?: string;
  vehicleRegistrationNumber?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole | null;
  user: UserType | null;
  isLoading: boolean;
  login: (mobileNumber: string, password: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  register: (userData: UserType & { password?: string }) => Promise<boolean>;
  updateUser: (updatedData: Partial<UserType>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize state from sessionStorage (tab-isolated) or fallback to localStorage
  useEffect(() => {
    const sessionUser = sessionStorage.getItem('ridemate_user') || localStorage.getItem('ridemate_user');
    const sessionAuth = sessionStorage.getItem('ridemate_auth') || localStorage.getItem('ridemate_auth');
    const sessionToken = sessionStorage.getItem('ridemate_access_token') || localStorage.getItem('ridemate_access_token');

    if (sessionUser && sessionAuth === 'true' && sessionToken && !sessionToken.startsWith('ridemate_jwt_')) {
      const parsedUser = JSON.parse(sessionUser) as UserType;
      
      sessionStorage.setItem('ridemate_auth', 'true');
      sessionStorage.setItem('ridemate_user', JSON.stringify(parsedUser));
      sessionStorage.setItem('ridemate_access_token', sessionToken);

      setUser(parsedUser);
      setRole(parsedUser.role);
      setIsAuthenticated(true);
    } else {
      // Clear legacy mock tokens
      if (sessionToken?.startsWith('ridemate_jwt_')) {
        sessionStorage.removeItem('ridemate_access_token');
        localStorage.removeItem('ridemate_access_token');
        localStorage.removeItem('access_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (mobileNumber: string, password: string, requestedRole?: UserRole): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Execute authentic login with backend API
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
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
          const backendRole = userObj?.role === 'DRIVER' || userObj?.role === 'driver' ? 'driver' : 'passenger';
          const effectiveRole = requestedRole || backendRole;

          const authUser: UserType = {
            name: userObj?.name || 'Commuter',
            mobileNumber: userObj?.mobile_number || mobileNumber,
            email: userObj?.email,
            role: effectiveRole,
            officeName: userObj?.office_name || 'Dilkusha Towers',
          };

          const token = tokens.access_token;
          const refreshToken = tokens.refresh_token;

          sessionStorage.setItem('ridemate_auth', 'true');
          sessionStorage.setItem('ridemate_user', JSON.stringify(authUser));
          sessionStorage.setItem('ridemate_access_token', token);
          sessionStorage.setItem('ridemate_refresh_token', refreshToken || '');

          localStorage.setItem('ridemate_auth', 'true');
          localStorage.setItem('ridemate_user', JSON.stringify(authUser));
          localStorage.setItem('ridemate_access_token', token);
          localStorage.setItem('access_token', token);
          if (refreshToken) localStorage.setItem('ridemate_refresh_token', refreshToken);

          setUser(authUser);
          setRole(effectiveRole);
          setIsAuthenticated(true);
          setIsLoading(false);
          return true;
        }
      } else {
        console.warn('[AuthContext] Login rejected by backend:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('[AuthContext] Backend authentication call error:', err);
    }

    setIsLoading(false);
    return false;
  };

  const register = async (userData: UserType & { password?: string }): Promise<boolean> => {
    setIsLoading(true);
    const pwd = userData.password || 'RideMate@2026';

    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          mobile_number: userData.mobileNumber,
          password: pwd,
          office_name: userData.officeName || 'Dilkusha Towers',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const tokens = json.data?.tokens;

        if (tokens?.access_token) {
          const token = tokens.access_token;
          const refreshToken = tokens.refresh_token;

          sessionStorage.setItem('ridemate_auth', 'true');
          sessionStorage.setItem('ridemate_user', JSON.stringify(userData));
          sessionStorage.setItem('ridemate_access_token', token);
          sessionStorage.setItem('ridemate_refresh_token', refreshToken || '');

          localStorage.setItem('ridemate_auth', 'true');
          localStorage.setItem('ridemate_user', JSON.stringify(userData));
          localStorage.setItem('ridemate_access_token', token);
          localStorage.setItem('access_token', token);
          if (refreshToken) localStorage.setItem('ridemate_refresh_token', refreshToken);

          setUser(userData);
          setRole(userData.role);
          setIsAuthenticated(true);
          setIsLoading(false);
          return true;
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Backend registration call failed:', err);
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem('ridemate_auth');
    sessionStorage.removeItem('ridemate_user');
    sessionStorage.removeItem('ridemate_access_token');
    sessionStorage.removeItem('ridemate_refresh_token');

    localStorage.removeItem('ridemate_auth');
    localStorage.removeItem('ridemate_user');
    localStorage.removeItem('ridemate_access_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('ridemate_refresh_token');

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
