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
import Plan2Join from './pages/Plan2Join';
import Plan2Dashboard from './pages/Plan2Dashboard';
import Plan2AdminDashboard from './pages/Plan2AdminDashboard';
import Plan2Referral from './pages/Plan2Referral';
import WebsiteLayout from './pages/website/WebsiteLayout';
import { HomePage, HowItWorksPage, FeaturesPage, ShopsPage, FAQPage } from './pages/website/WebsitePages';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useSelector((s: RootState) => s.auth.accessToken);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, role } = useSelector((s: RootState) => s.auth);
  if (!accessToken) return <Navigate to="/login" replace />;
  if (role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function Plan2Route({ children }: { children: React.ReactNode }) {
  const { accessToken, planType } = useSelector((s: RootState) => s.auth);
  if (!accessToken) return <Navigate to="/login" replace />;
  if (planType !== 'PLAN2') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, planType, role } = useSelector((s: RootState) => s.auth);
  if (!accessToken) return <>{children}</>;
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to={planType === 'PLAN2' ? '/plan2/dashboard' : '/dashboard'} replace />;
}

/** Redirect /register?ref=X&leg=Y → /login?ref=X&leg=Y (preserves query params) */
function RegisterRedirect() {
  const location = useLocation();
  return <Navigate to={`/login${location.search}`} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* ── Public Marketing Website ───────────────────────────────────── */}
      <Route element={<WebsiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/shops" element={<ShopsPage />} />
        <Route path="/faq" element={<FAQPage />} />
      </Route>

      {/* ── Auth Pages ────────────────────────────────────────────────── */}
      <Route path="/login" element={<GuestRoute><Landing /></GuestRoute>} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/plan2/join" element={<Plan2Join />} />

      {/* Legacy redirects — preserve query params for referral links */}
      <Route path="/register" element={<RegisterRedirect />} />

      {/* ── Protected: member ─────────────────────────────────────────── */}
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/network"      element={<Network />} />
        <Route path="/join-request" element={<JoinRequest />} />
        <Route path="/shop"         element={<Shop />} />
        <Route path="/wallet"       element={<Wallet />} />
        <Route path="/vendor"       element={<Vendor />} />
        <Route path="/reports"      element={<Reports />} />
        <Route path="/app/how-it-works" element={<HowItWorks />} />
        <Route path="/profile"      element={<Profile />} />
      </Route>

      {/* ── Protected: Plan 2 members ─────────────────────────────────── */}
      <Route element={<Plan2Route><AppShell /></Plan2Route>}>
        <Route path="/plan2/dashboard" element={<Plan2Dashboard />} />
        <Route path="/plan2/referral"  element={<Plan2Referral />} />
      </Route>

      {/* ── Admin ─────────────────────────────────────────────────────── */}
      <Route path="/admin" element={<AdminRoute><AppShell /></AdminRoute>}>
        <Route index element={<Admin />} />
      </Route>

      <Route path="/plan2/admin-dashboard" element={<AdminRoute><AppShell /></AdminRoute>}>
        <Route index element={<Plan2AdminDashboard />} />
      </Route>

      {/* Wildcard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
