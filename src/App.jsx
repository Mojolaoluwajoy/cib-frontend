import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public pages
import Login             from './pages/Login';
import ForgotPassword    from './pages/ForgotPassword';
import OrgOnboarding     from './pages/OrgOnboarding';

// Protected pages
import Dashboard         from './pages/Dashboard';
import UserOnboarding    from './pages/UserOnboarding';
import Accounts          from './pages/Accounts';
import Transactions      from './pages/Transactions';
import Profile           from './pages/Profile';
import Users             from './pages/Users';
import OrgDetail         from './pages/OrgDetail';
import EditOrganization  from './pages/EditOrganization';

// Settings pages
import SettingsMenu      from './pages/settings/SettingsMenu';
import SettingsPassword  from './pages/settings/SettingsPassword';
import SettingsCurrency  from './pages/settings/SettingsCurrency';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user.token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public */}
          <Route path="/login"           element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register"        element={<OrgOnboarding />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Org onboarding — SUPER_ADMIN and ADMIN */}
          <Route path="/org-onboarding" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN','ADMIN']}>
              <OrgOnboarding />
            </ProtectedRoute>
          }/>

          {/* SUPER_ADMIN org detail — view everything for an org */}
          <Route path="/organizations/:id" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <OrgDetail />
            </ProtectedRoute>
          }/>

          {/* SUPER_ADMIN edit org */}
          <Route path="/organizations/:id/edit" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <EditOrganization />
            </ProtectedRoute>
          }/>

          {/* User onboarding — ADMIN only */}
          <Route path="/user-onboarding" element={
            <ProtectedRoute allowedRoles={['ADMIN','SUPER_ADMIN']}>
              <UserOnboarding />
            </ProtectedRoute>
          }/>

          {/* Users — ADMIN only */}
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Users />
            </ProtectedRoute>
          }/>

          {/* Accounts */}
          <Route path="/accounts" element={
            <ProtectedRoute allowedRoles={['ADMIN','SUPER_ADMIN']}>
              <Accounts />
            </ProtectedRoute>
          }/>

          {/* Transactions */}
          <Route path="/transactions" element={
            <ProtectedRoute><Transactions /></ProtectedRoute>
          }/>

          {/* Profile — everyone */}
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          }/>

          {/* Settings */}
          <Route path="/settings" element={
            <ProtectedRoute><SettingsMenu /></ProtectedRoute>
          }/>
          <Route path="/settings/password" element={
            <ProtectedRoute><SettingsPassword /></ProtectedRoute>
          }/>
          <Route path="/settings/currency" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <SettingsCurrency />
            </ProtectedRoute>
          }/>

          {/* Defaults */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}