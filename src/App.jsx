import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages — we'll create these one by one next
import Login          from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard      from './pages/Dashboard';
import OrgOnboarding  from './pages/OrgOnboarding';
import UserOnboarding from './pages/UserOnboarding';
import Accounts       from './pages/Accounts';
import Transactions   from './pages/Transactions';
import Settings       from './pages/Settings';

// ProtectedRoute — wraps any page that requires login
// If no token → redirect to login
// If wrong role → redirect to dashboard
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
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <OrgOnboarding />
            </ProtectedRoute>
          }/>

          <Route path="/user-onboarding" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <UserOnboarding />
            </ProtectedRoute>
          }/>

          <Route path="/accounts" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <Accounts />
            </ProtectedRoute>
          }/>

          <Route path="/transactions" element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }/>

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }/>

          {/* ── Default redirects ── */}
          {/* If someone visits just "/" send them to dashboard */}
          {/* If someone visits an unknown URL send them to dashboard */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}