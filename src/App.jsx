import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login                from './pages/Login';
import ForgotPassword       from './pages/ForgotPassword';
import OrgOnboarding        from './pages/OrgOnboarding';
import CompleteRegistration from './pages/CompleteRegistration';
import Dashboard            from './pages/Dashboard';
import UserOnboarding       from './pages/UserOnboarding';
import Accounts             from './pages/Accounts';
import Transactions         from './pages/Transactions';
import Profile              from './pages/Profile';
import Users                from './pages/Users';
import AllUsers             from './pages/AllUsers';
import Organizations        from './pages/Organizations';
import OrgDetail            from './pages/OrgDetail';
import EditOrganization     from './pages/EditOrganization';
import SettingsMenu         from './pages/settings/SettingsMenu';
import SettingsPassword     from './pages/settings/SettingsPassword';
import SettingsCurrency     from './pages/settings/SettingsCurrency';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user?.token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Public routes ── */}
          <Route path="/login"                 element={<Login />} />
          <Route path="/forgot-password"       element={<ForgotPassword />} />
          <Route path="/register"              element={<OrgOnboarding />} />
          <Route path="/complete-registration" element={<CompleteRegistration />} />

          {/* ── Dashboard ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }/>

          {/* ── Org onboarding — SUPER_ADMIN approvals + public registration ── */}
          <Route path="/org-onboarding" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN','ADMIN']}>
              <OrgOnboarding />
            </ProtectedRoute>
          }/>

          {/* ── SUPER_ADMIN: organizations list with search and filter ── */}
          <Route path="/organizations" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <Organizations />
            </ProtectedRoute>
          }/>

          {/* ── SUPER_ADMIN: manage a specific org on their behalf ── */}
          <Route path="/organizations/:id" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <OrgDetail />
            </ProtectedRoute>
          }/>

          {/* ── SUPER_ADMIN: edit a specific org ── */}
          <Route path="/organizations/:id/edit" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <EditOrganization />
            </ProtectedRoute>
          }/>

          {/* ── User onboarding — ADMIN sends invitations ── */}
          <Route path="/user-onboarding" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserOnboarding />
            </ProtectedRoute>
          }/>

          {/* ── Users — ADMIN sees only their own org users ── */}
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Users />
            </ProtectedRoute>
          }/>

          {/* ── All users — SUPER_ADMIN sees all users across all orgs ── */}
          <Route path="/all-users" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <AllUsers />
            </ProtectedRoute>
          }/>

          {/* ── Accounts — ADMIN, MAKER, APPROVER ── */}
          <Route path="/accounts" element={
            <ProtectedRoute allowedRoles={['ADMIN','MAKER','APPROVER']}>
              <Accounts />
            </ProtectedRoute>
          }/>

          {/* ── Transactions — all logged in users ── */}
          <Route path="/transactions" element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }/>

          {/* ── Profile — all logged in users ── */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }/>

          {/* ── Settings ── */}
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

          {/* ── Catch all ── */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}