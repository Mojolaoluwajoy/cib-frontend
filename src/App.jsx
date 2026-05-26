import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// ── Public pages ──
import Login          from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import OrgOnboarding  from './pages/OrgOnboarding';

// ── Protected pages ──
import Dashboard      from './pages/Dashboard';
import UserOnboarding from './pages/UserOnboarding';
import Accounts       from './pages/Accounts';
import Transactions   from './pages/Transactions';
import Profile        from './pages/Profile';

// ── Settings pages (each in their own file inside pages/settings/) ──
import SettingsMenu     from './pages/settings/SettingsMenu';
import SettingsPassword from './pages/settings/SettingsPassword';
import SettingsCurrency from './pages/settings/SettingsCurrency';

// ── Protected route wrapper ──
// If no token → send to login
// If wrong role → send to dashboard
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user.token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Public routes — no login needed ── */}
          <Route path="/login"           element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register"        element={<OrgOnboarding />} />

          {/* ── Protected routes — login required ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }/>

          <Route path="/org-onboarding" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN','ADMIN']}>
              <OrgOnboarding />
            </ProtectedRoute>
          }/>

          <Route path="/user-onboarding" element={
            <ProtectedRoute allowedRoles={['ADMIN','SUPER_ADMIN']}>
              <UserOnboarding />
            </ProtectedRoute>
          }/>

          <Route path="/accounts" element={
            <ProtectedRoute allowedRoles={['ADMIN','SUPER_ADMIN']}>
              <Accounts />
            </ProtectedRoute>
          }/>

          <Route path="/transactions" element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }/>

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }/>

          {/* ── Settings routes ── */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsMenu />
            </ProtectedRoute>
          }/>

          <Route path="/settings/password" element={
            <ProtectedRoute>
              <SettingsPassword />
            </ProtectedRoute>
          }/>

          <Route path="/settings/currency" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <SettingsCurrency />
            </ProtectedRoute>
          }/>

          {/* ── Default redirects ── */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}