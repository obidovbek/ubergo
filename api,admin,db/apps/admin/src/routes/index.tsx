/**
 * Routes Configuration
 * Application routing setup
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MainLayout } from '../layout/MainLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminUsersListPage } from '../pages/adminUsers/AdminUsersListPage';
import { AdminUsersCreatePage } from '../pages/adminUsers/AdminUsersCreatePage';
import { AdminUsersEditPage } from '../pages/adminUsers/AdminUsersEditPage';
import { PassengersListPage } from '../pages/passengers/PassengersListPage';
import { PassengerDetailPage } from '../pages/passengers/PassengerDetailPage';
import { DriversListPage } from '../pages/drivers/DriversListPage';
import { DriverDetailPage } from '../pages/drivers/DriverDetailPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { CountriesListPage } from '../pages/countries/CountriesListPage';
import { CountryCreatePage } from '../pages/countries/CountryCreatePage';
import { CountryEditPage } from '../pages/countries/CountryEditPage';

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

// Public Route wrapper (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/admin-users" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/admin-users"
          element={
            <ProtectedRoute>
              <AdminUsersListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-users/create"
          element={
            <ProtectedRoute>
              <AdminUsersCreatePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-users/:id/edit"
          element={
            <ProtectedRoute>
              <AdminUsersEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/passengers"
          element={
            <ProtectedRoute>
              <PassengersListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/passengers/:id"
          element={
            <ProtectedRoute>
              <PassengerDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/drivers"
          element={
            <ProtectedRoute>
              <DriversListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/drivers/:id"
          element={
            <ProtectedRoute>
              <DriverDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/countries"
          element={
            <ProtectedRoute>
              <CountriesListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/countries/create"
          element={
            <ProtectedRoute>
              <CountryCreatePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/countries/:id/edit"
          element={
            <ProtectedRoute>
              <CountryEditPage />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/admin-users" replace />} />

        {/* 404 Route */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

