import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LandingPage } from '../pages/LandingPage';
import { AboutPage } from '../pages/AboutPage';
import { ContactPage } from '../pages/ContactPage';
import { DriverPlaceholderPage } from '../pages/DriverPlaceholderPage';
import { RidePlaceholderPage } from '../pages/RidePlaceholderPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { DashboardHome } from '../pages/DashboardHome';
import { ROUTES } from '../constants/routes';

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
      </Route>

      {/* Dashboard Route using DashboardLayout */}
      <Route path={ROUTES.DASHBOARD} element={<DashboardLayout />}>
        {/* Dashboard index */}
        <Route index element={<DashboardHome />} />
        
        {/* Placeholder sub-routes for sidebar consistency (redirect to overview for now) */}
        <Route path="rides" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="routes" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="history" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="profile" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="settings" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Route>

      {/* 404 Route using PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
