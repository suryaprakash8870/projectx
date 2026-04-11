import { useState, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../store/authSlice';
import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from './Icons';

// ── Icons (w-6 h-6 = 24px — larger for 35+ users) ───────────────────────────
const icons = {
  home:    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
  network: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>,
  join:    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>,
  shop:    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" /></svg>,
  wallet:  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" /></svg>,
  vendor:  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>,
  profile: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>,
  reports: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>,
  admin:   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>,
  logout:  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>,
  faq:     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>,
};

const memberNav = [
  { to: '/dashboard',    icon: icons.home,    label: 'Home' },
  { to: '/network',      icon: icons.network, label: 'Network' },
  { to: '/join-request', icon: icons.join,    label: 'Join' },
  { to: '/shop',         icon: icons.shop,    label: 'Shop' },
  { to: '/wallet',       icon: icons.wallet,  label: 'Wallet' },
  { to: '/vendor',       icon: icons.vendor,  label: 'Vendor' },
  { to: '/reports',      icon: icons.reports, label: 'Reports' },
  { to: '/how-it-works', icon: icons.faq,     label: 'How It Works' },
  { to: '/profile',      icon: icons.profile, label: 'Profile' },
];

const reportsSubItems = [
  { section: 'summary',      label: 'Summary' },
  { section: 'wallet',       label: 'Wallet Balance' },
  { section: 'income',       label: 'Income Trend' },
  { section: 'transactions', label: 'Transactions' },
  { section: 'network',      label: 'Network' },
  { section: 'purchases',    label: 'Purchases' },
  { section: 'membership',   label: 'Membership' },
];

const adminSubItems = [
  { tab: 'overview',      label: 'Overview' },
  { tab: 'requests',      label: 'Join Requests' },
  { tab: 'members',       label: 'Members' },
  { tab: 'payoutlog',     label: 'Payout Log' },
  { tab: 'revenue',       label: 'Root Revenue' },
  { tab: 'gst',           label: 'GST Report' },
  { tab: 'vendors',       label: 'Vendors' },
  { tab: 'cyclereport',   label: 'Cycle Report' },
  { tab: 'revenuesplits', label: 'Revenue Splits' },
];

// Mobile bottom nav — 4 primary tabs + More
const mobileBottomNav = [
  { to: '/dashboard', icon: icons.home,    label: 'Home' },
  { to: '/network',   icon: icons.network, label: 'Network' },
  { to: '/wallet',    icon: icons.wallet,  label: 'Wallet' },
  { to: '/shop',      icon: icons.shop,    label: 'Shop' },
];

// Pages shown in the "More" sheet
const mobileMoreItems = [
  { to: '/join-request', icon: icons.join,    label: 'Join Request' },
  { to: '/vendor',       icon: icons.vendor,  label: 'Vendor' },
  { to: '/reports',      icon: icons.reports, label: 'Reports' },
  { to: '/how-it-works', icon: icons.faq,     label: 'How It Works' },
  { to: '/profile',      icon: icons.profile, label: 'Profile' },
];

export default function AppShell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { memberId, role, name } = useSelector((s: RootState) => s.auth);
  const { toggleTheme, isDark } = useTheme();
  const nav = role === 'ADMIN' ? [] : memberNav;
  const mobileNav = role === 'ADMIN' ? [] : mobileBottomNav;

  const isOnAdmin   = location.pathname === '/admin';
  const isOnReports = location.pathname === '/reports';
  const searchParams = new URLSearchParams(location.search);
  const currentAdminTab       = searchParams.get('tab')     || 'overview';
  const currentReportSection  = searchParams.get('section') || 'summary';

  // Page title for desktop header
  const pageTitles: Record<string, string> = {
    '/dashboard':    'Dashboard',
    '/network':      'Network Tree',
    '/join-request': 'Join Request',
    '/shop':         'Shop',
    '/wallet':       'Wallet',
    '/vendor':       'Vendor',
    '/reports':      'Reports',
    '/how-it-works': 'How It Works',
    '/profile':      'Profile',
    '/admin':        'Admin Panel',
  };
  const pageTitle = pageTitles[location.pathname] || 'Plan-I';

  // Submenus default open — user closes manually
  const [reportsOpen, setReportsOpen] = useState(false);
  const [adminOpen,   setAdminOpen]   = useState(false);
  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Flyout submenu for collapsed sidebar
  const [flyout, setFlyout] = useState<{ menu: 'reports' | 'admin'; top: number } | null>(null);
  const flyoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mobile slide-up sheet
  const [mobileSheet, setMobileSheet] = useState<'reports' | 'admin' | 'more' | null>(null);

  function openFlyout(menu: 'reports' | 'admin', e: React.MouseEvent<HTMLButtonElement>) {
    if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setFlyout({ menu, top: rect.top });
  }
  function scheduleFlyoutClose() {
    flyoutCloseTimer.current = setTimeout(() => setFlyout(null), 120);
  }
  function cancelFlyoutClose() {
    if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
  }

  function handleLogout() {
    dispatch(logout());
    navigate('/login');
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden">

      {/* ── Desktop full-width header ────────────────────────────────────── */}
      <header
        className="hidden md:flex items-center justify-between px-5 shrink-0 z-30"
        style={{
          background: 'var(--color-bg-subtle)',
          borderBottom: '1px solid var(--color-border)',
          minHeight: '64px',
        }}
      >
        {/* Left: logo + page title */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0" style={{ borderRight: '1px solid var(--color-border)', paddingRight: '1rem' }}>
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-brand-500/30 glow">P</div>
            <div className="leading-tight">
              <div className="font-bold t-text" style={{ fontSize: '0.9375rem' }}>Plan-I</div>
              <div className="t-text-4" style={{ fontSize: '0.6875rem' }}>Network Platform</div>
            </div>
          </div>
          {/* Page title */}
          <div>
            <h1 className="font-black t-text" style={{ fontSize: '1.125rem', lineHeight: 1.2 }}>{pageTitle}</h1>
            <div className="text-xs font-medium" style={{ color: 'var(--color-text-4)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Right: member chip + theme + logout */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-2xl"
            style={{ background: 'var(--color-overlay)', border: '1px solid var(--color-border)' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0"
              style={{ background: 'var(--color-primary)' }}
            >
              {(name || 'U')[0].toUpperCase()}
            </div>
            <div className="leading-tight">
              <div className="font-bold t-text truncate max-w-[120px]" style={{ fontSize: '0.8125rem' }}>{name || 'Member'}</div>
              <div className="font-mono t-text-4 truncate" style={{ fontSize: '0.6875rem' }}>{memberId}</div>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-xl t-text-3 hover:t-text transition-colors"
            style={{ background: 'var(--color-overlay)', border: '1px solid var(--color-border)', width: '40px', height: '40px' }}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'var(--color-overlay)', border: '1px solid var(--color-border)', width: '40px', height: '40px', color: 'var(--color-text-4)' }}
            title="Sign out"
          >
            {icons.logout}
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + content ──────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col shrink-0 z-20 transition-all duration-300"
        style={{
          width: sidebarCollapsed ? '68px' : '288px',
          background: 'var(--color-bg-subtle)',
          borderRight: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar collapse toggle */}
        <div className="shrink-0 flex items-center px-3 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {sidebarCollapsed ? (
            <div className="flex justify-center w-full">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center t-text-3 hover:t-text transition-colors"
                style={{ background: 'var(--color-overlay)' }}
                title="Expand sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold uppercase tracking-widest t-text-4" style={{ fontSize: '0.6875rem' }}>Navigation</span>
              <button
                onClick={() => { setSidebarCollapsed(true); setReportsOpen(false); setAdminOpen(false); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center t-text-4 hover:t-text transition-colors"
                style={{ background: 'var(--color-overlay)' }}
                title="Collapse sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm7 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Member status */}
        <div className="px-3 py-3 shrink-0" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-overlay)' }}>
          {sidebarCollapsed ? (
            <div className="flex justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold uppercase tracking-widest t-text-4" style={{ fontSize: '0.6875rem' }}>Member Status</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-soft" />
                  <span className="text-emerald-400 font-semibold" style={{ fontSize: '0.75rem' }}>Active</span>
                </div>
              </div>
              <div className="font-mono text-brand-400 font-bold mt-1 truncate" style={{ fontSize: '0.9375rem' }}>{memberId || '—'}</div>
              {name && <div className="t-text-3 mt-0.5 font-medium truncate" style={{ fontSize: '0.875rem' }}>{name}</div>}
            </>
          )}
        </div>


        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const hasSubmenu = item.to === '/reports';
            const isParentActive = item.to === '/reports' ? isOnReports : false;

            if (hasSubmenu) {
              return (
                <div key={item.to}>
                  <button
                    onClick={() => { if (!sidebarCollapsed) setReportsOpen(o => !o); }}
                    onMouseEnter={e => { if (sidebarCollapsed) openFlyout('reports', e); }}
                    onMouseLeave={() => { if (sidebarCollapsed) scheduleFlyoutClose(); }}
                    className={`nav-item w-full${isParentActive ? ' active' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${reportsOpen ? 'rotate-180' : ''}`}>
                          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                      </>
                    )}
                  </button>
                  {reportsOpen && !sidebarCollapsed && (
                    <div className="ml-3 pl-3 mt-0.5 space-y-0.5" style={{ borderLeft: '2px solid var(--color-border-2)' }}>
                      {reportsSubItems.map(sub => {
                        const isActive = isOnReports && currentReportSection === sub.section;
                        return (
                          <Link
                            key={sub.section}
                            to={`/reports?section=${sub.section}`}
                            className={`nav-item text-sm${isActive ? ' active' : ''}`}
                            style={{ minHeight: '38px', paddingTop: '0.4rem', paddingBottom: '0.4rem' }}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-brand-400' : 'bg-[var(--color-border-2)]'}`} />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}

          {/* Admin submenu */}
          {role === 'ADMIN' && (
            <>
              <button
                onClick={() => { if (!sidebarCollapsed) setAdminOpen(o => !o); }}
                onMouseEnter={e => { if (sidebarCollapsed) openFlyout('admin', e); }}
                onMouseLeave={() => { if (sidebarCollapsed) scheduleFlyoutClose(); }}
                title={sidebarCollapsed ? 'Admin Panel' : undefined}
                className={`nav-item w-full${isOnAdmin ? ' active' : ''}`}
              >
                {icons.admin}
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">Admin Panel</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${adminOpen ? 'rotate-180' : ''}`}>
                      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
              {adminOpen && !sidebarCollapsed && (
                <div className="ml-3 pl-3 space-y-0.5" style={{ borderLeft: '2px solid var(--color-border-2)' }}>
                  {adminSubItems.map(item => {
                    const isActive = isOnAdmin && currentAdminTab === item.tab;
                    return (
                      <Link
                        key={item.tab}
                        to={`/admin?tab=${item.tab}`}
                        className={`nav-item text-sm${isActive ? ' active' : ''}`}
                        style={{ minHeight: '38px', paddingTop: '0.4rem', paddingBottom: '0.4rem' }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-brand-400' : 'bg-[var(--color-border-2)]'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </nav>

        {/* Theme toggle + Logout */}
        <div className="px-2 py-3 space-y-0.5" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-overlay)' }}>
          <button
            onClick={toggleTheme}
            className="nav-item w-full group"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <SunIcon size={24} /> : <MoonIcon size={24} />}
            {!sidebarCollapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="nav-item w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 group"
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            {icons.logout}
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 md:z-auto">

        {/* Mobile top bar — taller, clearer */}
        <header
          className="md:hidden flex items-center justify-between px-4 shrink-0 z-30"
          style={{
            background: 'var(--color-bg-subtle)',
            borderBottom: '1px solid var(--color-border)',
            minHeight: '60px',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-base shadow-md glow shrink-0">
              P
            </div>
            <div>
              <div className="font-display font-bold t-text" style={{ fontSize: '1rem' }}>Plan-I</div>
              {name && <div className="t-text-4 truncate max-w-[140px]" style={{ fontSize: '0.75rem' }}>{name}</div>}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme toggle — larger touch target */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-xl t-text-3 transition-colors"
              style={{ background: 'var(--color-overlay)', width: '40px', height: '40px' }}
              aria-label="Toggle theme"
            >
              {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </button>

            {/* Logout — clearly labeled on mobile */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center rounded-xl t-text-3 hover:text-rose-500 transition-colors"
              style={{ background: 'var(--color-overlay)', width: '40px', height: '40px' }}
              aria-label="Sign out"
            >
              {icons.logout}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: '80px' }}>
          <div className="px-4 py-5 page-enter md:pb-6">
            <Outlet />
          </div>
        </main>

        {/* ── Mobile slide-up submenu sheet ───────────────────────────── */}
        {mobileSheet && (
          <>
            {/* Backdrop */}
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileSheet(null)}
            />
            {/* Sheet */}
            <div
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
              style={{ background: 'var(--color-bg-subtle)', borderTop: '1px solid var(--color-border)', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border-2)' }} />
              </div>
              <div className="px-4 py-2 font-bold t-text" style={{ fontSize: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                {mobileSheet === 'reports' ? 'Reports' : mobileSheet === 'more' ? 'More' : 'Admin Panel'}
              </div>
              <div className="px-3 py-2 space-y-1 max-h-72 overflow-y-auto">
                {mobileSheet === 'more' && mobileMoreItems.map(item => {
                  const isActive = location.pathname === item.to;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileSheet(null)}
                      className={`nav-item${isActive ? ' active' : ''}`}
                    >
                      <span className="w-5 h-5 shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
                {mobileSheet === 'reports' && reportsSubItems.map(sub => {
                  const isActive = isOnReports && currentReportSection === sub.section;
                  return (
                    <Link
                      key={sub.section}
                      to={`/reports?section=${sub.section}`}
                      onClick={() => setMobileSheet(null)}
                      className={`nav-item${isActive ? ' active' : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-brand-400' : 'bg-[var(--color-border-2)]'}`} />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
                {mobileSheet === 'admin' && adminSubItems.map(sub => {
                  const isActive = isOnAdmin && currentAdminTab === sub.tab;
                  return (
                    <Link
                      key={sub.tab}
                      to={`/admin?tab=${sub.tab}`}
                      onClick={() => setMobileSheet(null)}
                      className={`nav-item${isActive ? ' active' : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-brand-400' : 'bg-[var(--color-border-2)]'}`} />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Mobile bottom tab bar ────────────────────────────────────── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-2 z-50"
          style={{
            background: 'var(--color-bg-subtle)',
            borderTop: '1px solid var(--color-border)',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.15)',
            paddingBottom: 'env(safe-area-inset-bottom, 8px)',
            paddingTop: '6px',
            minHeight: '68px',
          }}
        >
          {role === 'ADMIN' ? (
            <>
              {[
                { tab: 'overview',  label: 'Overview',  icon: icons.home },
                { tab: 'requests',  label: 'Requests',  icon: icons.join },
                { tab: 'members',   label: 'Members',   icon: icons.profile },
                { tab: 'payoutlog', label: 'Payouts',   icon: icons.wallet },
              ].map(item => {
                const isActive = isOnAdmin && currentAdminTab === item.tab;
                return (
                  <Link key={item.tab} to={`/admin?tab=${item.tab}`}
                    className={`mobile-tab-item ${isActive ? 'text-brand-500 bg-brand-500/10' : 't-text-4'}`}>
                    {item.icon}
                    <span style={{ fontSize: '0.6875rem', marginTop: '2px' }}>{item.label}</span>
                  </Link>
                );
              })}
              {/* More — opens admin sheet */}
              <button
                onClick={() => setMobileSheet(s => s === 'admin' ? null : 'admin')}
                className={`mobile-tab-item ${mobileSheet === 'admin' ? 'text-brand-500 bg-brand-500/10' : 't-text-4'}`}
              >
                {icons.admin}
                <span style={{ fontSize: '0.6875rem', marginTop: '2px' }}>More</span>
              </button>
            </>
          ) : (
            <>
              {mobileBottomNav.map((item) => (
                <NavLink key={item.to} to={item.to}
                  className={({ isActive }) => `mobile-tab-item ${isActive ? 'text-brand-500 bg-brand-500/10' : 't-text-4'}`}>
                  {item.icon}
                  <span style={{ fontSize: '0.6875rem', marginTop: '2px' }}>{item.label}</span>
                </NavLink>
              ))}
              {/* More button — opens sheet with remaining pages */}
              <button
                onClick={() => setMobileSheet(s => s === 'more' ? null : 'more')}
                className={`mobile-tab-item ${mobileSheet === 'more' ? 'text-brand-500 bg-brand-500/10' : 't-text-4'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                <span style={{ fontSize: '0.6875rem', marginTop: '2px' }}>More</span>
              </button>
            </>
          )}
        </nav>
      </div>
      </div>{/* end body: sidebar + content */}

      {/* ── Collapsed flyout submenu ─────────────────────────────────────── */}
      {sidebarCollapsed && flyout && (
        <div
          onMouseEnter={cancelFlyoutClose}
          onMouseLeave={scheduleFlyoutClose}
          style={{
            position: 'fixed',
            left: '76px',
            top: flyout.top,
            zIndex: 999,
            minWidth: '200px',
            background: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '6px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}
        >
          {/* Label */}
          <div style={{ padding: '6px 10px 8px', fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-4)', borderBottom: '1px solid var(--color-border)', marginBottom: '4px' }}>
            {flyout.menu === 'reports' ? 'Reports' : 'Admin Panel'}
          </div>
          {/* Items */}
          {flyout.menu === 'reports' && reportsSubItems.map(sub => {
            const isActive = isOnReports && currentReportSection === sub.section;
            return (
              <Link
                key={sub.section}
                to={`/reports?section=${sub.section}`}
                onClick={() => setFlyout(null)}
                className={`nav-item text-sm${isActive ? ' active' : ''}`}
                style={{ minHeight: '36px' }}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-brand-400' : 'bg-[var(--color-border-2)]'}`} />
                <span>{sub.label}</span>
              </Link>
            );
          })}
          {flyout.menu === 'admin' && adminSubItems.map(item => {
            const isActive = isOnAdmin && currentAdminTab === item.tab;
            return (
              <Link
                key={item.tab}
                to={`/admin?tab=${item.tab}`}
                onClick={() => setFlyout(null)}
                className={`nav-item text-sm${isActive ? ' active' : ''}`}
                style={{ minHeight: '36px' }}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-brand-400' : 'bg-[var(--color-border-2)]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
