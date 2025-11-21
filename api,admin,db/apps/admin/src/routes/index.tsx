/**
 * Routes Configuration
 * Application routing setup
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { GeoCountriesListPage } from '../pages/geo-countries/GeoCountriesListPage';
import { GeoCountryCreatePage } from '../pages/geo-countries/GeoCountryCreatePage';
import { GeoCountryEditPage } from '../pages/geo-countries/GeoCountryEditPage';
import { GeoProvincesListPage } from '../pages/geo-provinces/GeoProvincesListPage';
import { GeoProvinceCreatePage } from '../pages/geo-provinces/GeoProvinceCreatePage';
import { GeoProvinceEditPage } from '../pages/geo-provinces/GeoProvinceEditPage';
import { GeoCityDistrictsListPage } from '../pages/geo-city-districts/GeoCityDistrictsListPage';
import { GeoCityDistrictCreatePage } from '../pages/geo-city-districts/GeoCityDistrictCreatePage';
import { GeoCityDistrictEditPage } from '../pages/geo-city-districts/GeoCityDistrictEditPage';
import { GeoAdministrativeAreasListPage } from '../pages/geo-administrative-areas/GeoAdministrativeAreasListPage';
import { GeoAdministrativeAreaCreatePage } from '../pages/geo-administrative-areas/GeoAdministrativeAreaCreatePage';
import { GeoAdministrativeAreaEditPage } from '../pages/geo-administrative-areas/GeoAdministrativeAreaEditPage';
import { GeoSettlementsListPage } from '../pages/geo-settlements/GeoSettlementsListPage';
import { GeoSettlementCreatePage } from '../pages/geo-settlements/GeoSettlementCreatePage';
import { GeoSettlementEditPage } from '../pages/geo-settlements/GeoSettlementEditPage';
import { GeoNeighborhoodsListPage } from '../pages/geo-neighborhoods/GeoNeighborhoodsListPage';
import { GeoNeighborhoodCreatePage } from '../pages/geo-neighborhoods/GeoNeighborhoodCreatePage';
import { GeoNeighborhoodEditPage } from '../pages/geo-neighborhoods/GeoNeighborhoodEditPage';
import { VehicleMakesListPage } from '../pages/vehicleMakes/VehicleMakesListPage';
import { VehicleMakeCreatePage } from '../pages/vehicleMakes/VehicleMakeCreatePage';
import { VehicleMakeEditPage } from '../pages/vehicleMakes/VehicleMakeEditPage';
import { VehicleModelsListPage } from '../pages/vehicleModels/VehicleModelsListPage';
import { VehicleModelCreatePage } from '../pages/vehicleModels/VehicleModelCreatePage';
import { VehicleModelEditPage } from '../pages/vehicleModels/VehicleModelEditPage';
import { VehicleBodyTypesListPage } from '../pages/vehicleBodyTypes/VehicleBodyTypesListPage';
import { VehicleBodyTypeCreatePage } from '../pages/vehicleBodyTypes/VehicleBodyTypeCreatePage';
import { VehicleBodyTypeEditPage } from '../pages/vehicleBodyTypes/VehicleBodyTypeEditPage';
import { VehicleColorsListPage } from '../pages/vehicleColors/VehicleColorsListPage';
import { VehicleColorCreatePage } from '../pages/vehicleColors/VehicleColorCreatePage';
import { VehicleColorEditPage } from '../pages/vehicleColors/VehicleColorEditPage';
import { VehicleTypesListPage } from '../pages/vehicleTypes/VehicleTypesListPage';
import { VehicleTypeCreatePage } from '../pages/vehicleTypes/VehicleTypeCreatePage';
import { VehicleTypeEditPage } from '../pages/vehicleTypes/VehicleTypeEditPage';

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Preserve the current location so user can return after login
    return <Navigate to="/login" state={{ from: location }} replace />;
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

        <Route
          path="/geo/countries"
          element={
            <ProtectedRoute>
              <GeoCountriesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/geo/countries/create"
          element={
            <ProtectedRoute>
              <GeoCountryCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/geo/countries/:id/edit"
          element={
            <ProtectedRoute>
              <GeoCountryEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/geo/provinces"
          element={
            <ProtectedRoute>
              <GeoProvincesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/geo/provinces/create"
          element={
            <ProtectedRoute>
              <GeoProvinceCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/geo/provinces/:id/edit"
          element={
            <ProtectedRoute>
              <GeoProvinceEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/geo/city-districts"
          element={
            <ProtectedRoute>
              <GeoCityDistrictsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/geo/city-districts/create"
          element={
            <ProtectedRoute>
              <GeoCityDistrictCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/geo/city-districts/:id/edit"
          element={
            <ProtectedRoute>
              <GeoCityDistrictEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/geo/administrative-areas"
          element={
            <ProtectedRoute>
              <GeoAdministrativeAreasListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/geo/administrative-areas/create"
          element={
            <ProtectedRoute>
              <GeoAdministrativeAreaCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/geo/administrative-areas/:id/edit"
          element={
            <ProtectedRoute>
              <GeoAdministrativeAreaEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/geo/settlements"
          element={
            <ProtectedRoute>
              <GeoSettlementsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/geo/settlements/create"
          element={
            <ProtectedRoute>
              <GeoSettlementCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/geo/settlements/:id/edit"
          element={
            <ProtectedRoute>
              <GeoSettlementEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/geo/neighborhoods"
          element={
            <ProtectedRoute>
              <GeoNeighborhoodsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/geo/neighborhoods/create"
          element={
            <ProtectedRoute>
              <GeoNeighborhoodCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/geo/neighborhoods/:id/edit"
          element={
            <ProtectedRoute>
              <GeoNeighborhoodEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicle-makes"
          element={
            <ProtectedRoute>
              <VehicleMakesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-makes/create"
          element={
            <ProtectedRoute>
              <VehicleMakeCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-makes/:id/edit"
          element={
            <ProtectedRoute>
              <VehicleMakeEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicle-models"
          element={
            <ProtectedRoute>
              <VehicleModelsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-models/create"
          element={
            <ProtectedRoute>
              <VehicleModelCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-models/:id/edit"
          element={
            <ProtectedRoute>
              <VehicleModelEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicle-body-types"
          element={
            <ProtectedRoute>
              <VehicleBodyTypesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-body-types/create"
          element={
            <ProtectedRoute>
              <VehicleBodyTypeCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-body-types/:id/edit"
          element={
            <ProtectedRoute>
              <VehicleBodyTypeEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicle-colors"
          element={
            <ProtectedRoute>
              <VehicleColorsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-colors/create"
          element={
            <ProtectedRoute>
              <VehicleColorCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-colors/:id/edit"
          element={
            <ProtectedRoute>
              <VehicleColorEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicle-types"
          element={
            <ProtectedRoute>
              <VehicleTypesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-types/create"
          element={
            <ProtectedRoute>
              <VehicleTypeCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-types/:id/edit"
          element={
            <ProtectedRoute>
              <VehicleTypeEditPage />
            </ProtectedRoute>
          }
        />

        {/* Default Route - only redirect root path, not other routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Navigate to="/admin-users" replace />
            </ProtectedRoute>
          } 
        />

        {/* 404 Route */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

