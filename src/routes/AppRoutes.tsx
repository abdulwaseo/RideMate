import React, { lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LandingPage } from '../pages/LandingPage';
import { AboutPage } from '../pages/AboutPage';
import { ContactPage } from '../pages/ContactPage';
import { Page403 } from '../pages/errors/Page403';
import { Page404 } from '../pages/errors/Page404';
import { Page500 } from '../pages/errors/Page500';
import { PageOffline } from '../pages/errors/PageOffline';
import { SelectRolePage } from '../pages/select-role';
import { LoginPage } from '../pages/login';
import { DriverPlaceholderPage } from '../pages/DriverPlaceholderPage';
import { RidePlaceholderPage } from '../pages/RidePlaceholderPage';
import { PassengerRegisterPage } from '../pages/register/passenger';
import { DriverRegisterPage } from '../pages/register/driver';
import { MapsDemoPage } from '../pages/MapsDemoPage';


// Driver Views (Lazy Loaded)
const DriverDashboard = lazy(() => import('../pages/dashboard/DriverDashboard').then(m => ({ default: m.DriverDashboard })));
const PublishRide = lazy(() => import('../pages/dashboard/PublishRide').then(m => ({ default: m.PublishRide })));
const ActiveRide = lazy(() => import('../pages/dashboard/ActiveRide').then(m => ({ default: m.ActiveRide })));
const RideRequests = lazy(() => import('../pages/dashboard/RideRequests').then(m => ({ default: m.RideRequests })));
const DriverHistory = lazy(() => import('../pages/dashboard/DriverHistory').then(m => ({ default: m.DriverHistory })));
const DriverProfile = lazy(() => import('../pages/dashboard/DriverProfile').then(m => ({ default: m.DriverProfile })));

// Shared Communication Views (Lazy Loaded)
const ChatList = lazy(() => import('../pages/dashboard/ChatList').then(m => ({ default: m.ChatList })));
const ChatRoom = lazy(() => import('../pages/dashboard/ChatRoom').then(m => ({ default: m.ChatRoom })));
const NotificationCenter = lazy(() => import('../pages/dashboard/NotificationCenter').then(m => ({ default: m.NotificationCenter })));
const Settings = lazy(() => import('../pages/dashboard/Settings').then(m => ({ default: m.Settings })));

// Passenger Views (Lazy Loaded)
const PassengerDashboard = lazy(() => import('../pages/dashboard/PassengerDashboard').then(m => ({ default: m.PassengerDashboard })));
const SearchRide = lazy(() => import('../pages/dashboard/SearchRide').then(m => ({ default: m.SearchRide })));
const RideDetails = lazy(() => import('../pages/dashboard/RideDetails').then(m => ({ default: m.RideDetails })));
const PassengerRequests = lazy(() => import('../pages/dashboard/PassengerRequests').then(m => ({ default: m.PassengerRequests })));
const PassengerHistory = lazy(() => import('../pages/dashboard/PassengerHistory').then(m => ({ default: m.PassengerHistory })));
const PassengerProfile = lazy(() => import('../pages/dashboard/PassengerProfile').then(m => ({ default: m.PassengerProfile })));


import { ProtectedRoute } from './ProtectedRoute';
import { DriverProvider } from '../contexts/DriverContext';
import { PassengerProvider } from '../contexts/PassengerContext';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';

// Dynamic Index router for /dashboard
const DashboardIndexRedirect: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return role === 'driver'
    ? <Navigate to={ROUTES.DRIVER_DASHBOARD} replace />
    : <Navigate to={ROUTES.PASSENGER_DASHBOARD} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Landing Page Route using MainLayout */}
      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<LandingPage />} />
      </Route>

      {/* Public Pages Route using PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.ABOUT} element={<AboutPage />} />
        <Route path={ROUTES.CONTACT} element={<ContactPage />} />
        <Route path={ROUTES.BECOME_DRIVER} element={<DriverPlaceholderPage />} />
        <Route path={ROUTES.FIND_RIDE} element={<RidePlaceholderPage />} />
        <Route path={ROUTES.MAPS_DEMO} element={<MapsDemoPage />} />
      </Route>

      {/* Authentication Pages (custom AuthLayout is self-contained) */}
      <Route path={ROUTES.SELECT_ROLE} element={<SelectRolePage />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER_PASSENGER} element={<PassengerRegisterPage />} />
      <Route path={ROUTES.REGISTER_DRIVER} element={<DriverRegisterPage />} />

      {/* Dashboard Protected Routes using DashboardLayout */}
      <Route path={ROUTES.DASHBOARD} element={<DashboardLayout />}>
        {/* Dashboard index redirect depending on role */}
        <Route index element={<DashboardIndexRedirect />} />
        
        {/* Driver Section Wrapped in DriverProvider */}
        <Route 
          path="driver" 
          element={
            <ProtectedRoute allowedRole="driver">
              <DriverProvider>
                <Outlet />
              </DriverProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<DriverDashboard />} />
          <Route path="publish" element={<PublishRide />} />
          <Route path="active-ride" element={<ActiveRide />} />
          <Route path="requests" element={<RideRequests />} />
          <Route path="history" element={<DriverHistory />} />
          <Route path="profile" element={<DriverProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="chat" element={<ChatList />} />
          <Route path="chat/:id" element={<ChatRoom />} />
          <Route path="notifications" element={<NotificationCenter />} />
        </Route>

        {/* Passenger Section Wrapped in PassengerProvider */}
        <Route 
          path="passenger" 
          element={
            <ProtectedRoute allowedRole="passenger">
              <PassengerProvider>
                <Outlet />
              </PassengerProvider>
            </ProtectedRoute>
          } 
        >
          <Route index element={<PassengerDashboard />} />
          <Route path="search" element={<SearchRide />} />
          <Route path="ride-details/:id" element={<RideDetails />} />
          <Route path="requests" element={<PassengerRequests />} />
          <Route path="history" element={<PassengerHistory />} />
          <Route path="profile" element={<PassengerProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="chat" element={<ChatList />} />
          <Route path="chat/:id" element={<ChatRoom />} />
          <Route path="notifications" element={<NotificationCenter />} />
        </Route>
        
        {/* Placeholder sub-routes for sidebar consistency (redirect to role-based view) */}
        <Route path="rides" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="routes" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="history" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="profile" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="settings" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Route>

      {/* Error & 404 Routes using PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="403" element={<Page403 />} />
        <Route path="500" element={<Page500 />} />
        <Route path="offline" element={<PageOffline />} />
        <Route path="*" element={<Page404 />} />
      </Route>
    </Routes>
  );
};
export default AppRoutes;
