import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store/store';
import AppShell from './components/AppShell';
import Landing from './pages/Landing';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Network from './pages/Network';
import JoinRequest from './pages/JoinRequest';
import Shop from './pages/Shop';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Vendor from './pages/Vendor';
import Reports from './pages/Reports';
import HowItWorks from './pages/HowItWorks';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useSelector((s: RootState) => s.auth.accessToken);
  return token ? <>{children}</> : <Navigate to="/" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, role } = useSelector((s: RootState) => s.auth);
  if (!accessToken) return <Navigate to="/" replace />;
  if (role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useSelector((s: RootState) => s.auth.accessToken);
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

/** Redirect /register?ref=X&leg=Y → /?ref=X&leg=Y (preserves query params) */
function RegisterRedirect() {
  const location = useLocation();
  return <Navigate to={`/${location.search}`} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<GuestRoute><Landing /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      {/* Legacy redirects — preserve query params for referral links */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<RegisterRedirect />} />

      {/* Protected: member */}
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/network"      element={<Network />} />
        <Route path="/join-request" element={<JoinRequest />} />
        <Route path="/shop"         element={<Shop />} />
        <Route path="/wallet"       element={<Wallet />} />
        <Route path="/vendor"       element={<Vendor />} />
        <Route path="/reports"      element={<Reports />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/profile"      element={<Profile />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AppShell /></AdminRoute>}>
        <Route index element={<Admin />} />
      </Route>

      {/* Wildcard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
