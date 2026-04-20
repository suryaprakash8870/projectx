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
import Plan1Dashboard from './pages/Plan1Dashboard';
import Plan2Join from './pages/Plan2Join';
import Plan3Join from './pages/Plan3Join';
import Plan3Dashboard from './pages/Plan3Dashboard';
import Plan1AdminDashboard from './pages/Plan1AdminDashboard';
import Plan2AdminDashboard from './pages/Plan2AdminDashboard';
import Plan3AdminDashboard from './pages/Plan3AdminDashboard';
import Plan3Referral from './pages/Plan3Referral';
import ProductDetail from './pages/ProductDetail';
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

function Plan3Route({ children }: { children: React.ReactNode }) {
  const { accessToken, planType } = useSelector((s: RootState) => s.auth);
  if (!accessToken) return <Navigate to="/login" replace />;
  if (planType !== 'PLAN2') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, planType, role } = useSelector((s: RootState) => s.auth);
  if (!accessToken) return <>{children}</>;
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to={planType === 'PLAN2' ? '/plan3/dashboard' : '/plan1/dashboard'} replace />;
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
      <Route path="/plan3/join" element={<Plan3Join />} />

      {/* Legacy redirects — preserve query params for referral links */}
      <Route path="/register" element={<RegisterRedirect />} />

      {/* ── Protected: member ─────────────────────────────────────────── */}
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/plan1/dashboard" element={<Plan1Dashboard />} />
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/network"      element={<Network />} />
        <Route path="/join-request" element={<JoinRequest />} />
        <Route path="/shop"         element={<Shop />} />
        <Route path="/shop/:id"     element={<ProductDetail />} />
        <Route path="/wallet"       element={<Wallet />} />
        <Route path="/vendor"       element={<Vendor />} />
        <Route path="/reports"      element={<Reports />} />
        <Route path="/app/how-it-works" element={<HowItWorks />} />
        <Route path="/profile"      element={<Profile />} />
      </Route>

      {/* ── Protected: Plan 3 (investment) members ───────────────────── */}
      <Route element={<Plan3Route><AppShell /></Plan3Route>}>
        <Route path="/plan3/dashboard" element={<Plan3Dashboard />} />
        <Route path="/plan3/referral"  element={<Plan3Referral />} />
        {/* Legacy /plan2/* → /plan3/* redirects */}
        <Route path="/plan2/dashboard" element={<Navigate to="/plan3/dashboard" replace />} />
        <Route path="/plan2/referral"  element={<Navigate to="/plan3/referral" replace />} />
      </Route>

      {/* ── Admin ─────────────────────────────────────────────────────── */}
      <Route path="/admin" element={<AdminRoute><AppShell /></AdminRoute>}>
        <Route index element={<Admin />} />
      </Route>

      <Route path="/plan1/admin-dashboard" element={<AdminRoute><AppShell /></AdminRoute>}>
        <Route index element={<Plan1AdminDashboard />} />
      </Route>

      <Route path="/plan2/admin-dashboard" element={<AdminRoute><AppShell /></AdminRoute>}>
        <Route index element={<Plan2AdminDashboard />} />
      </Route>

      <Route path="/plan3/admin-dashboard" element={<AdminRoute><AppShell /></AdminRoute>}>
        <Route index element={<Plan3AdminDashboard />} />
      </Route>

      {/* Wildcard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
