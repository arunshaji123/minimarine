import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FirebaseAuthProvider } from './context/FirebaseAuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';

import AdminDashboard from './components/dashboards/AdminDashboard';
import ShipManagementDashboard from './components/dashboards/ShipManagementDashboard';
import OwnerDashboard from './components/dashboards/OwnerDashboard';
import SurveyorDashboard from './components/dashboards/SurveyorDashboard';
import CargoManagerDashboard from './components/dashboards/CargoManagerDashboard';
import DocumentManager from './components/DocumentManager';

import { Role, getDashboardPathByRole } from './utils/roles';

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-marine-blue"></div>
  </div>
);

// Guards
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? children : <Navigate to="/login" />;
};

const RoleRoute = ({ roles, children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  return roles.includes(user.role) ? children : <Navigate to={getDashboardPathByRole(user.role)} replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Navigate to={getDashboardPathByRole(user.role)} /> : children;
};

const RedirectToRoleDashboard = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={getDashboardPathByRole(user.role)} replace />;
};

function App() {
  return (
    <FirebaseAuthProvider>
      <AuthProvider>
        <ToastProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="App">
              <Routes>
              <Route path="/" element={<Home />} />

              {/* Auth */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

              {/* Generic dashboard redirects to role-specific */}
              <Route path="/dashboard" element={<ProtectedRoute><RedirectToRoleDashboard /></ProtectedRoute>} />

              {/* Role dashboards */}
              <Route path="/dashboard/admin" element={<RoleRoute roles={[Role.ADMIN]}><AdminDashboard /></RoleRoute>} />
              <Route path="/dashboard/ship" element={<RoleRoute roles={[Role.SHIP_MGMT]}><ShipManagementDashboard /></RoleRoute>} />
              <Route path="/dashboard/owner" element={<RoleRoute roles={[Role.OWNER, Role.USER]}><OwnerDashboard /></RoleRoute>} />
              <Route path="/dashboard/surveyor" element={<RoleRoute roles={[Role.SURVEYOR]}><SurveyorDashboard /></RoleRoute>} />
              <Route path="/dashboard/cargo" element={<RoleRoute roles={[Role.CARGO_MANAGER]}><CargoManagerDashboard /></RoleRoute>} />
              
              {/* Document Management */}
              <Route path="/documents" element={<ProtectedRoute><DocumentManager /></ProtectedRoute>} />
              </Routes>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </FirebaseAuthProvider>
  );
}

export default App;