import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeColorModeProvider } from './context/ThemeContext';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import TraineeManagement from './pages/TraineeManagement';
import CohortManagement from './pages/CohortManagement';
import BatchDetail from './pages/BatchDetail';
import Calendar from './pages/Calendar';
import GoogleIntegrations from './pages/GoogleIntegrations';
import LogisticsManagement from './pages/LogisticsManagement';
import LogisticsRequests from './pages/LogisticsRequests';
import RegionalOfficeManagement from './pages/RegionalOfficeManagement';
import DivisionDetail from './pages/DivisionDetail';
import RegionalManagerDashboard from './pages/RegionalManagerDashboard';
import DashboardLayout from './components/DashboardLayout';

// Guard for authenticated pages
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force password change if not done yet
  if (!user.is_password_changed) {
    return <Navigate to="/change-password" replace />;
  }

  // Role validation
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Guard for guest page (Login)
const GuestRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    if (!user.is_password_changed) {
      return <Navigate to="/change-password" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Guard for force change password page
const ForcePasswordRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user.is_password_changed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        {/* Guest Routes */}
        <Route 
          path="/login" 
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          } 
        />

        {/* Force Password Change Route */}
        <Route 
          path="/change-password" 
          element={
            <ForcePasswordRoute>
              <ChangePassword />
            </ForcePasswordRoute>
          } 
        />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/users" 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <DashboardLayout>
                <UserManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/google-integrations" 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <DashboardLayout>
                <GoogleIntegrations />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/regional-offices" 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <DashboardLayout>
                <RegionalOfficeManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/divisions/:id" 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <DashboardLayout>
                <DivisionDetail />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        {/* Mock other routes redirecting to main dashboard */}
        <Route 
          path="/trainers" 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <DashboardLayout>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Trainer Management</Typography>
                  <Typography variant="body1" color="text.secondary">This section is currently under development.</Typography>
                </Box>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/rm-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'regional_manager']}>
              <DashboardLayout>
                <RegionalManagerDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/trainees" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'batch_manager']}>
              <DashboardLayout>
                <TraineeManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/cohorts" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'batch_manager']}>
              <DashboardLayout>
                <CohortManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/batches/:id" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'batch_manager', 'trainer', 'master_trainer']}>
              <DashboardLayout>
                <BatchDetail />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/calendar" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'batch_manager', 'trainer', 'master_trainer', 'regional_manager', 'logistic_manager']}>
              <DashboardLayout>
                <Calendar />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/logistics" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'logistic_manager']}>
              <DashboardLayout>
                <LogisticsManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/logistics/requests" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'logistic_manager']}>
              <DashboardLayout>
                <LogisticsRequests />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ThemeColorModeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeColorModeProvider>
  );
}

export default App;
