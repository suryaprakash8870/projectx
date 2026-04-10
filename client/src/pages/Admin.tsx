import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import {
  useGetAdminStatsQuery,
  useGetAllJoiningsQuery,
  useGetAdminMembersQuery,
  useGetPayoutLogQuery,
  useGetCompanyRevenueQuery,
  useGetGstReportQuery,
  useApproveJoiningMutation,
  useRejectJoiningMutation,
  useGetAllVendorsAdminQuery,
  useApproveVendorMutation,
  useSuspendVendorMutation,
  useGetCycleReportQuery,
  useGetRevenueSplitsQuery,
} from '../store/apiSlice';
import {
  ChartBarIcon, DocumentIcon, UsersIcon, BanknotesIcon,
  ReceiptIcon, StorefrontIcon, RefreshIcon, TrendingUpIcon, UserIcon,
  ClockIcon, CheckCircleIcon, XCircleIcon, BriefcaseIcon, BoltIcon,
  ClipboardIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownIcon,
} from '../components/Icons';

// ── Table pagination ─────────────────────────────────────────────────────────
function TablePagination({ page, totalPages, onPageChange, total, limit = 10 }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
  total?: number; limit?: number;
}) {
  const from = total != null ? (page - 1) * limit + 1 : null;
  const to   = total != null ? Math.min(page * limit, total) : null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="table-footer">
      <span className="text-xs t-text-4 font-medium">
        {total != null
          ? `Showing ${from}–${to} of ${total} entries`
          : `Page ${page} of ${totalPages}`}
      </span>
      <div className="flex items-center gap-1">
        <button className="table-page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹ Prev</button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="table-page-btn" style={{ cursor: 'default' }}>…</span>
          ) : (
            <button key={p} className={`table-page-btn${p === page ? ' active' : ''}`} onClick={() => onPageChange(p as number)}>{p}</button>
          )
        )}
        <button className="table-page-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next ›</button>
      </div>
    </div>
  );
}

// ── Tab type ─────────────────────────────────────────────────────────────────
type AdminTab = 'overview' | 'requests' | 'members' | 'payoutlog' | 'revenue' | 'gst' | 'vendors' | 'cyclereport' | 'revenuesplits';

const TABS: { id: AdminTab; label: string; icon: JSX.Element }[] = [
  { id: 'overview',       label: 'Overview',           icon: <ChartBarIcon size={16} /> },
  { id: 'requests',       label: 'Join Requests',      icon: <DocumentIcon size={16} /> },
  { id: 'members',        label: 'Members',            icon: <UsersIcon size={16} /> },
  { id: 'payoutlog',      label: 'Payout Log',         icon: <BanknotesIcon size={16} /> },
  { id: 'revenue',        label: 'Root Revenue',       icon: <BriefcaseIcon size={16} /> },
  { id: 'gst',            label: 'GST Report',         icon: <ReceiptIcon size={16} /> },
  { id: 'vendors',        label: 'Vendors',            icon: <StorefrontIcon size={16} /> },
  { id: 'cyclereport',    label: 'Cycle Report',       icon: <RefreshIcon size={16} /> },
  { id: 'revenuesplits',  label: 'Revenue Splits',     icon: <TrendingUpIcon size={16} /> },
];

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon, fullBg, fullBgText }: {
  label: string; value: any; sub?: string; icon: JSX.Element;
  fullBg?: string; fullBgText?: boolean;
}) {
  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        padding: '1.5rem',
        background: fullBg || 'var(--color-surface)',
        border: fullBg ? 'none' : '1px solid var(--color-border)',
        boxShadow: fullBg ? `0 8px 32px ${fullBg}55` : 'var(--shadow-card)',
      }}
    >
      {/* Decorative rings */}
      {fullBg ? (
        <>
          <div className="absolute pointer-events-none" style={{ width: '120px', height: '120px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', top: '-30px', right: '-20px' }} />
          <div className="absolute pointer-events-none" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.10)', top: '10px', right: '30px' }} />
          <div className="absolute pointer-events-none" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', bottom: '-15px', left: '-10px' }} />
        </>
      ) : (
        <>
          <div className="absolute pointer-events-none" style={{ width: '110px', height: '110px', borderRadius: '50%', border: '2px solid var(--color-border)', top: '-35px', right: '-25px' }} />
          <div className="absolute pointer-events-none" style={{ width: '70px', height: '70px', borderRadius: '50%', border: '1px solid var(--color-border)', top: '5px', right: '20px' }} />
          <div className="absolute pointer-events-none" style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--color-overlay)', bottom: '-10px', left: '-10px' }} />
        </>
      )}
      <div className="relative flex items-start justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: fullBgText ? 'rgba(255,255,255,0.7)' : 'var(--color-text-4)' }}>
          {label}
        </span>
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: fullBgText ? 'rgba(255,255,255,0.2)' : 'var(--color-overlay)', color: fullBgText ? '#fff' : 'var(--color-text-3)' }}
        >
          {icon}
        </div>
      </div>
      <div className="relative font-black tabular-nums" style={{ fontSize: '2rem', letterSpacing: '-0.02em', lineHeight: 1.1, color: fullBgText ? '#ffffff' : 'var(--color-text)' }}>
        {value}
      </div>
      {sub && (
        <div className="relative mt-2 text-sm font-medium" style={{ color: fullBgText ? 'rgba(255,255,255,0.65)' : 'var(--color-text-4)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
const DONUT_COLORS = ['#3b82f6', '#f59e0b', '#6366f1', '#06b6d4'];

function OverviewTab() {
  const { data: stats, isLoading } = useGetAdminStatsQuery();

  const dailyJoiningChartData = stats
    ? Object.entries(stats.dailyJoinings)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, count]) => ({ date: date.slice(5), count }))
    : [];

  const cycleDistributionChartData = stats?.cycleDistribution || [];

  const revenueSplitChartData = stats?.revenueSplit
    ? [
        { name: 'Platform Fee', value: stats.revenueSplit.totalPlatformFee },
        { name: 'GST', value: stats.revenueSplit.totalGst },
        { name: 'Company', value: stats.revenueSplit.totalCompany },
        { name: 'Users', value: stats.revenueSplit.totalUsers },
      ]
    : [];

  if (isLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  );

  const tooltipStyle = {
    contentStyle: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 13 },
  };

  return (
    <div className="space-y-5">
      {/* Users & Network */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-3">Users &amp; Network</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard label="Users"            value={stats?.regularUsers    || 0} sub="Regular members"   icon={<UserIcon size={16} />}         fullBg="#2563eb" fullBgText />
          <KPICard label="Root Users"       value={stats?.rootUsers       || 0} sub="Root-level members" icon={<UsersIcon size={16} />}        fullBg="#22c55e" fullBgText />
          <KPICard label="Total Joinings"   value={stats?.totalJoinings   || 0} sub="All time"           icon={<CheckCircleIcon size={16} />}  fullBg="#f04722" fullBgText />
          <KPICard label="Pending Requests" value={stats?.pendingRequests || 0} sub="Awaiting approval"  icon={<ClockIcon size={16} />}        fullBg="#8b5cf6" fullBgText />
        </div>
      </div>

      {/* Financials */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-3">Financials</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPICard label="Total Payouts"   value={`₹${(stats?.totalPayoutAmount  || 0).toLocaleString('en-IN')}`} sub="Paid to members"     icon={<BanknotesIcon size={16} />} />
          <KPICard label="Total Revenue"   value={`₹${(stats?.totalRevenueAmount || 0).toLocaleString('en-IN')}`} sub="Admin wallet income" icon={<BriefcaseIcon size={16} />} />
          <KPICard label="GST Collected"   value={`₹${(stats?.gstCollected       || 0).toLocaleString('en-IN')}`} sub="Tax collected"       icon={<ReceiptIcon size={16} />} />
          <KPICard label="Platform Fees"   value={`₹${(stats?.companyFeeTotal    || 0).toLocaleString('en-IN')}`} sub="Platform revenue"    icon={<BriefcaseIcon size={16} />} />
          <KPICard label="Total Vendors"   value={stats?.totalVendors             || 0}                           sub="Active vendors"      icon={<StorefrontIcon size={16} />} />
        </div>
      </div>

      {/* Daily Joinings — Area Chart */}
      {dailyJoiningChartData.length > 0 && (
        <div className="relative rounded-3xl overflow-hidden" style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="absolute pointer-events-none" style={{ width: '140px', height: '140px', borderRadius: '50%', border: '2px solid var(--color-border)', top: '-45px', right: '-35px' }} />
          <div className="absolute pointer-events-none" style={{ width: '85px', height: '85px', borderRadius: '50%', border: '1px solid var(--color-border)', top: '10px', right: '30px' }} />
          <div className="relative flex items-start justify-between mb-5">
            <div>
              <div className="font-bold t-text" style={{ fontSize: '1rem' }}>Daily Joinings</div>
              <div className="text-xs t-text-4 mt-0.5">New members over last 14 days</div>
            </div>
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-overlay)', color: 'var(--color-text-3)' }}>
              <UsersIcon size={16} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyJoiningChartData}>
              <defs>
                <linearGradient id="joinGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: 'var(--color-text-4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--color-text-4)', fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} labelStyle={{ color: 'var(--color-text-3)' }} itemStyle={{ color: '#3b82f6' }} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#joinGrad)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cycle Distribution — Bar Chart */}
        {cycleDistributionChartData.length > 0 && (
          <div className="relative rounded-3xl overflow-hidden" style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div className="absolute pointer-events-none" style={{ width: '110px', height: '110px', borderRadius: '50%', border: '2px solid var(--color-border)', top: '-30px', right: '-25px' }} />
            <div className="absolute pointer-events-none" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--color-overlay)', bottom: '-10px', left: '-10px' }} />
            <div className="relative flex items-start justify-between mb-5">
              <div>
                <div className="font-bold t-text" style={{ fontSize: '1rem' }}>Cycle Distribution</div>
                <div className="text-xs t-text-4 mt-0.5">Members per cycle level</div>
              </div>
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-overlay)', color: 'var(--color-text-3)' }}>
                <RefreshIcon size={16} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cycleDistributionChartData}>
                <XAxis dataKey="cycle" tick={{ fill: 'var(--color-text-4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-text-4)', fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} labelStyle={{ color: 'var(--color-text-3)' }} itemStyle={{ color: '#6366f1' }} />
                <Bar dataKey="count" fill="#6366f1" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue Split — Donut Chart */}
        {revenueSplitChartData.length > 0 && (
          <div className="relative rounded-3xl overflow-hidden" style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div className="absolute pointer-events-none" style={{ width: '110px', height: '110px', borderRadius: '50%', border: '2px solid var(--color-border)', top: '-30px', right: '-25px' }} />
            <div className="absolute pointer-events-none" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--color-overlay)', bottom: '-10px', left: '-10px' }} />
            <div className="relative flex items-start justify-between mb-5">
              <div>
                <div className="font-bold t-text" style={{ fontSize: '1rem' }}>Revenue Split</div>
                <div className="text-xs t-text-4 mt-0.5">Breakdown by revenue category</div>
              </div>
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-overlay)', color: 'var(--color-text-3)' }}>
                <TrendingUpIcon size={16} />
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={revenueSplitChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                  >
                    {revenueSplitChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(value) => `₹${(value as number).toLocaleString('en-IN')}`} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -62%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div className="text-xs font-bold uppercase tracking-widest t-text-4">Revenue</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Join Requests Tab ─────────────────────────────────────────────────────────
function RequestsTab() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectId, setRejectId]     = useState<string | null>(null);

  const { data: requests = [], refetch } = useGetAllJoiningsQuery(statusFilter);
  const [approve, { isLoading: approving }] = useApproveJoiningMutation();
  const [reject,  { isLoading: rejecting }] = useRejectJoiningMutation();

  async function handleApprove(id: string) {
    try {
      await approve(id).unwrap();
      toast.success('Joining approved! Payouts processed.');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Approval failed');
    }
  }

  async function handleReject() {
    if (!rejectId) return;
    try {
      await reject({ id: rejectId, note: rejectNote }).unwrap();
      toast.success('Request rejected');
      setRejectId(null);
      setRejectNote('');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Rejection failed');
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[undefined, 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <button key={String(s)} onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 rounded-full font-semibold text-xs transition-all border"
            style={{
              background: statusFilter === s ? '#0066ff' : 'transparent',
              color: statusFilter === s ? 'white' : 'var(--color-text-3)',
              borderColor: statusFilter === s ? '#0066ff' : 'var(--color-border)',
            }}>
            {s ?? 'All'}
          </button>
        ))}
      </div>

      {/* Table → card on mobile */}
      <div className="hidden md:block table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Member ID</th><th>Name</th><th>Mobile</th><th>Referred by</th><th>Submitted</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r: any) => (
              <tr key={r.id}>
                <td><span className="font-mono text-brand-400">{r.user.memberId}</span></td>
                <td className="t-text-2">{r.user.name}</td>
                <td className="font-mono">{r.user.mobile}</td>
                <td className="font-mono t-text-3">{r.user?.referrer?.memberId || '—'}</td>
                <td className="t-text-4 text-xs">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                </td>
                <td>
                  {r.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(r.id)} disabled={approving}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <CheckCircleIcon size={13} /> Approve
                      </button>
                      <button onClick={() => setRejectId(r.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <XCircleIcon size={13} /> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!requests.length && (
              <tr>
                <td colSpan={7} style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--color-text-4)', fontSize: '0.9375rem', fontWeight: 500 }}>No records found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {requests.map((r: any) => (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-mono text-brand-400 font-bold">{r.user.memberId}</span>
                <div className="text-sm t-text-2 mt-0.5">{r.user.name}</div>
                <div className="text-xs t-text-4">{r.user.mobile}</div>
              </div>
              <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
            </div>
            {r.status === 'PENDING' && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleApprove(r.id)} disabled={approving}
                  className="inline-flex items-center justify-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CheckCircleIcon size={13} /> Approve
                </button>
                <button onClick={() => setRejectId(r.id)}
                  className="inline-flex items-center justify-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <XCircleIcon size={13} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setRejectId(null)} />
          <div className="relative card max-w-md w-full">
            <h3 className="font-bold t-text mb-3">Reject Joining Request</h3>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Rejection reason (optional)"
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRejectId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReject} disabled={rejecting} className="btn-danger flex-1">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Members Tab ───────────────────────────────────────────────────────────────
function MembersTab() {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);

  const { data, isLoading } = useGetAdminMembersQuery({ type: typeFilter || undefined, search: search || undefined, page });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {([['', 'All', null], ['USER', 'Users', UserIcon], ['ROOT', 'Root Users', null]] as const).map(([v, label, Icon]) => (
            <button key={v} onClick={() => { setTypeFilter(v as string); setPage(1); }}
              className="px-3 py-1.5 rounded-full font-semibold text-xs transition-all border inline-flex items-center gap-1"
              style={{
                background: typeFilter === v ? '#0066ff' : 'transparent',
                color: typeFilter === v ? 'white' : 'var(--color-text-3)',
                borderColor: typeFilter === v ? '#0066ff' : 'var(--color-border)',
              }}>
              {Icon && <Icon size={14} />} {label}
            </button>
          ))}
        </div>
        <input
          className="input flex-1"
          placeholder="Search by MemberID, name, or mobile..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="hidden md:block table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Member ID</th><th>Name</th><th>Mobile</th><th>Type</th><th>Level</th><th>Cycle Position</th><th>Status</th><th>Coupon</th><th>Income</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={9}><div className="skeleton h-8 rounded" /></td></tr>
                ))
              : data?.members?.map((m: any) => (
                  <tr key={m.id}>
                    <td><span className="font-mono text-brand-400">{m.memberId}</span></td>
                    <td className="t-text-2">{m.name}</td>
                    <td className="font-mono text-xs">{m.mobile || '—'}</td>
                    <td>
                      {m.sequenceNumber >= 1 && m.sequenceNumber <= 512
                        ? <span className="badge-company inline-flex items-center gap-1">Root</span>
                        : <span className="badge-real inline-flex items-center gap-1"><UserIcon size={14} /> User</span>
                      }
                    </td>
                    <td className="t-text-3 font-medium">{m.level}</td>
                    <td><span className="badge bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 font-bold">{m.cyclePosition || '—'}</span></td>
                    <td><span className={`badge badge-${m.status?.toLowerCase()}`}>{m.status}</span></td>
                    <td className="font-mono text-amber-400">₹{m.wallet?.couponBalance ?? 0}</td>
                    <td className="font-mono text-emerald-400">₹{m.wallet?.incomeBalance ?? 0}</td>
                  </tr>
                ))
            }
            {!isLoading && !data?.members?.length && (
              <tr>
                <td colSpan={9} style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--color-text-4)', fontSize: '0.9375rem', fontWeight: 500 }}>No records found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data?.members?.map((m: any) => (
          <div key={m.id} className="card py-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-brand-400 font-bold">{m.memberId}</span>
                <div className="text-sm t-text-2">{m.name}</div>
                <div className="text-xs t-text-4">{m.mobile || '—'} · L{m.level} · CP:{m.cyclePosition || '—'}</div>
              </div>
              <div className="text-right">
                {m.sequenceNumber >= 1 && m.sequenceNumber <= 512 ? <span className="badge-company">Root</span> : <span className="badge-real"><UserIcon size={14} /></span>}
                <div className="text-xs mt-1">
                  <span className="text-amber-400">₹{m.wallet?.couponBalance ?? 0}</span> / <span className="text-emerald-400">₹{m.wallet?.incomeBalance ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <TablePagination page={page} totalPages={data.totalPages} onPageChange={setPage} total={data.total} />
      )}
    </div>
  );
}

// ── Payout Log Tab ────────────────────────────────────────────────────────────
function PayoutLogTab() {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [cycleFilter, setCycleFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetPayoutLogQuery({ type: typeFilter || undefined, cycle: cycleFilter, page });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          className="input"
          value={cycleFilter || ''}
          onChange={(e) => {
            setCycleFilter(e.target.value || undefined);
            setPage(1);
          }}
        >
          <option value="">All Cycles</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(c => (
            <option key={c} value={c}>{`Cycle ${c}`}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Joiner</th><th>Recipient</th><th>Type</th><th>d-Level</th><th>Cycle</th><th>Amount</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7}><div className="skeleton h-8 rounded" /></td></tr>)
              : data?.records?.map((r: any) => {
                  const isPlatformFee = r.levelDiff === -1;
                  return (
                  <tr key={r.id}>
                    <td><span className="font-mono t-text-3">{r.joinerMemberId}</span></td>
                    <td><span className="font-mono text-brand-400">{r.recipient.memberId}</span></td>
                    <td>
                      {isPlatformFee
                        ? <span className="badge bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold inline-flex items-center gap-1">Platform Fee</span>
                        : r.recipient.sequenceNumber >= 1 && r.recipient.sequenceNumber <= 512
                        ? <span className="badge-company inline-flex items-center gap-1">Root</span>
                        : r.recipient.role === 'ADMIN'
                        ? <span className="badge bg-sky-500/10 text-sky-600 border border-sky-500/20 font-bold inline-flex items-center gap-1">Admin</span>
                        : <span className="badge-real inline-flex items-center gap-1"><UserIcon size={14} /> User</span>
                      }
                    </td>
                    <td>
                      {isPlatformFee
                        ? <span className="badge bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold">Fee</span>
                        : <span className="badge bg-brand-500/10 text-brand-600 border border-brand-500/20 font-bold">d-{r.levelDiff}</span>
                      }
                    </td>
                    <td>
                      {isPlatformFee
                        ? <span className="badge bg-slate-500/10 t-text-4 border border-slate-500/20 font-bold">—</span>
                        : <span className="badge bg-purple-500/10 text-purple-600 border border-purple-500/20 font-bold">Cycle {r.cycle}</span>
                      }
                    </td>
                    <td className="font-mono text-emerald-400 font-bold">₹{r.amount}</td>
                    <td className="t-text-4 text-xs">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                  );
                })
            }
            {!isLoading && !data?.records?.length && (
              <tr>
                <td colSpan={7} style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--color-text-4)', fontSize: '0.9375rem', fontWeight: 500 }}>No records found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <TablePagination page={page} totalPages={data.totalPages} onPageChange={setPage} total={data.total} />
      )}
    </div>
  );
}

// ── Company Revenue Tab ───────────────────────────────────────────────────────
function CompanyRevenueTab() {
  const { data } = useGetCompanyRevenueQuery(undefined);

  const chartData = data
    ? Object.entries(data.daily)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, amount]) => ({ date: (date as string).slice(5), amount }))
    : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Referral Fallback" value={`₹${(data?.total || 0).toLocaleString('en-IN')}`} icon={<UserIcon size={16} />} color="brand" sub="Missing upline slots credited to admin" />
        <KPICard label="Payout Slots Filled" value={data?.count || 0} icon={<ChartBarIcon size={16} />} color="slate" sub="Number of fallback slots resolved" />
        <KPICard label="Platform Fees" value={`₹${(data?.platformFeeTotal || 0).toLocaleString('en-IN')}`} icon={<BriefcaseIcon size={16} />} color="amber" sub="₹70 per joining (company profit)" />
        <KPICard label="Fee Count" value={data?.platformFeeCount || 0} icon={<ChartBarIcon size={16} />} color="slate" sub="Platform fee records" />
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <div className="section-title mb-4">Daily Root User Revenue (last 14 days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-text-4)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-text-4)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 12 }} itemStyle={{ color: '#14b8a6' }} />
              <Bar dataKey="amount" fill="#6b7280" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── GST Report Tab ────────────────────────────────────────────────────────────
function GSTTab() {
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');
  const { data, isLoading } = useGetGstReportQuery({ from: from || undefined, to: to || undefined });

  function downloadCSV() {
    if (!data?.records?.length) return;
    const rows = [
      ['ID', 'Request ID', 'Amount', 'Date'],
      ...data.records.map((r: any) => [r.id, r.requestId, r.amount, r.createdAt])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'gst_report.csv'; a.click();
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="flex-1">
          <label className="input-label">From</label>
          <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="input-label">To</label>
          <input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <button onClick={downloadCSV} className="btn-secondary inline-flex items-center gap-1" disabled={!data?.records?.length}>
          <ArrowDownIcon size={14} /> CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KPICard label="Total GST"    value={`₹${(data?.totalAmount || 0).toLocaleString('en-IN')}`} icon={<ReceiptIcon size={16} />} color="amber" />
        <KPICard label="Total Records" value={data?.totalCount || 0} icon={<ClipboardIcon size={16} />} color="slate" />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Request ID</th><th>GST Amount</th><th>Date</th></tr></thead>
          <tbody>
            {isLoading
              ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={3}><div className="skeleton h-8 rounded" /></td></tr>)
              : data?.records?.map((r: any) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs t-text-3">{r.requestId.slice(0, 12)}...</td>
                    <td className="font-mono text-amber-400 font-bold">₹{r.amount}</td>
                    <td className="t-text-4 text-xs">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))
            }
            {!isLoading && !data?.records?.length && (
              <tr>
                <td colSpan={3} style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--color-text-4)', fontSize: '0.9375rem', fontWeight: 500 }}>No records found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Vendors Tab ───────────────────────────────────────────────────────────────
function VendorsTab() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useGetAllVendorsAdminQuery({ status: statusFilter, page });
  const [approve, { isLoading: approving }] = useApproveVendorMutation();
  const [suspend, { isLoading: suspending }] = useSuspendVendorMutation();

  async function handleApprove(id: string) {
    try {
      await approve(id).unwrap();
      toast.success('Vendor approved successfully.');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Approval failed');
    }
  }

  async function handleSuspend(id: string) {
    try {
      await suspend(id).unwrap();
      toast.success('Vendor suspended');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Suspension failed');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[undefined, 'PENDING', 'APPROVED', 'SUSPENDED'].map(s => (
          <button key={String(s)} onClick={() => { setStatusFilter(s); setPage(1); }}
            className="px-3 py-1.5 rounded-full font-semibold text-xs transition-all border"
            style={{
              background: statusFilter === s ? '#0066ff' : 'transparent',
              color: statusFilter === s ? 'white' : 'var(--color-text-3)',
              borderColor: statusFilter === s ? '#0066ff' : 'var(--color-border)',
            }}>
            {s ?? 'All'}
          </button>
        ))}
      </div>

      <div className="hidden md:block table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Vendor ID</th><th>Name</th><th>Email</th><th>Category</th><th>Status</th><th>Applied</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7}><div className="skeleton h-8 rounded" /></td></tr>
                ))
              : data?.vendors?.map((v: any) => (
                  <tr key={v.id}>
                    <td><span className="font-mono text-brand-400">{v.vendorId}</span></td>
                    <td className="t-text-2">{v.name}</td>
                    <td className="font-mono text-xs t-text-3">{v.email}</td>
                    <td className="t-text-2">{v.category || '—'}</td>
                    <td><span className={`badge badge-${v.status.toLowerCase()}`}>{v.status}</span></td>
                    <td className="text-slate-500 text-xs">{new Date(v.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      {v.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(v.id)} disabled={approving}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <CheckCircleIcon size={13} /> Approve
                          </button>
                          <button onClick={() => handleSuspend(v.id)} disabled={suspending}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <XCircleIcon size={13} /> Suspend
                          </button>
                        </div>
                      )}
                      {v.status === 'APPROVED' && (
                        <button onClick={() => handleSuspend(v.id)} disabled={suspending}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <XCircleIcon size={13} /> Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))
            }
            {!isLoading && !data?.vendors?.length && (
              <tr>
                <td colSpan={7} style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--color-text-4)', fontSize: '0.9375rem', fontWeight: 500 }}>No records found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data?.vendors?.map((v: any) => (
          <div key={v.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-mono text-brand-400 font-bold">{v.vendorId}</span>
                <div className="text-sm t-text-2 mt-0.5">{v.name}</div>
                <div className="text-xs t-text-4">{v.email}</div>
                <div className="text-xs t-text-4 mt-1">{v.category || 'No category'}</div>
              </div>
              <span className={`badge badge-${v.status.toLowerCase()}`}>{v.status}</span>
            </div>
            {(v.status === 'PENDING' || v.status === 'APPROVED') && (
              <div className="flex gap-2 mt-3">
                {v.status === 'PENDING' && (
                  <button onClick={() => handleApprove(v.id)} disabled={approving}
                    className="inline-flex items-center justify-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <CheckCircleIcon size={13} /> Approve
                  </button>
                )}
                <button onClick={() => handleSuspend(v.id)} disabled={suspending}
                  className="inline-flex items-center justify-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <XCircleIcon size={13} /> Suspend
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <TablePagination page={page} totalPages={data.totalPages} onPageChange={setPage} total={data.total} />
      )}
    </div>
  );
}

// ── Cycle Report Tab ──────────────────────────────────────────────────────────
function CycleReportTab() {
  const { data, isLoading } = useGetCycleReportQuery();

  const chartData = data?.cycles || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KPICard label="Total Cycles" value={data?.totalCycles || 0} icon={<RefreshIcon size={16} />} color="brand" />
        <KPICard label="Active Cycle" value={data?.activeCycle || '—'} icon={<BoltIcon size={16} />} color="emerald" />
        <KPICard label="Total Payouts" value={`₹${(data?.totalPayouts || 0).toLocaleString('en-IN')}`} icon={<BanknotesIcon size={16} />} color="slate" />
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <div className="section-title mb-4">Payouts per Cycle</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="cycle" tick={{ fill: 'var(--color-text-4)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-text-4)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 12 }}
                labelStyle={{ color: 'var(--color-text-3)' }}
              />
              <Bar dataKey="totalAmount" fill="#06b6d4" name="Total Payouts" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Cycle</th><th>Payouts</th><th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((c: any) => (
                <tr key={c.cycle} className="hover:bg-[var(--color-overlay)] transition-colors">
                  <td><span className="badge bg-purple-500/10 text-purple-600 border border-purple-500/20 font-bold">Cycle {c.cycle}</span></td>
                  <td className="font-mono t-text-2">{c.totalPayouts}</td>
                  <td className="font-mono text-emerald-400 font-bold">₹{(c.totalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}
        </div>
      )}
    </div>
  );
}

// ── Revenue Splits Tab ────────────────────────────────────────────────────────
function RevenueSplitsTab() {
  const { data, isLoading } = useGetRevenueSplitsQuery();

  const totals = data?.totals;
  const chartData = totals
    ? [
        { name: 'Platform Fee', value: totals.platformFee || 0, color: '#0d9488' },
        { name: 'GST', value: totals.gst || 0, color: '#f59e0b' },
        { name: 'Company', value: totals.company || 0, color: '#6366f1' },
        { name: 'Users', value: totals.users || 0, color: '#06b6d4' },
      ]
    : [];

  const totalRevenue = totals
    ? (totals.platformFee || 0) + (totals.gst || 0) + (totals.company || 0) + (totals.users || 0)
    : 0;

  const pct = (val: number) => totalRevenue > 0 ? ((val / totalRevenue) * 100).toFixed(1) : '0.0';

  if (isLoading) return (
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Platform Fee" value={`₹${(totals?.platformFee || 0).toLocaleString('en-IN')}`} icon={<BoltIcon size={16} />} color="brand" sub={`${pct(totals?.platformFee || 0)}% of total`} />
        <KPICard label="GST" value={`₹${(totals?.gst || 0).toLocaleString('en-IN')}`} icon={<ReceiptIcon size={16} />} color="amber" sub={`${pct(totals?.gst || 0)}% of total`} />
        <KPICard label="Company Share" value={`₹${(totals?.company || 0).toLocaleString('en-IN')}`} icon={<BriefcaseIcon size={16} />} color="slate" sub={`${pct(totals?.company || 0)}% of total`} />
        <KPICard label="User Share" value={`₹${(totals?.users || 0).toLocaleString('en-IN')}`} icon={<UsersIcon size={16} />} color="emerald" sub={`${pct(totals?.users || 0)}% of total`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {chartData.length > 0 && (
          <div className="card">
            <div className="section-title mb-4">Revenue Distribution (Pie Chart)</div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 12 }}
                  formatter={(value) => `₹${(value as number).toLocaleString('en-IN')}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card">
          <div className="section-title mb-4">Breakdown</div>
          <div className="space-y-3">
            {chartData.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="t-text-2">{item.name}</span>
                  <span className="font-mono font-bold t-text-2">₹{item.value.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ background: 'var(--color-surface-2)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(item.value / totalRevenue) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--color-border)' }} className="pt-3 mt-3">
              <div className="flex justify-between text-sm font-bold">
                <span className="t-text-2">Total Revenue</span>
                <span className="font-mono text-emerald-400">₹{totalRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Admin root ────────────────────────────────────────────────────────────────
export default function Admin() {
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as AdminTab) || 'overview';

  const TAB_CONTENT: Record<AdminTab, JSX.Element> = {
    overview:       <OverviewTab />,
    requests:       <RequestsTab />,
    members:        <MembersTab />,
    payoutlog:      <PayoutLogTab />,
    revenue:        <CompanyRevenueTab />,
    gst:            <GSTTab />,
    vendors:        <VendorsTab />,
    cyclereport:    <CycleReportTab />,
    revenuesplits:  <RevenueSplitsTab />,
  };

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-heading">{currentTab?.label || 'Admin Panel'}</h1>
        <p className="help-text mt-1">Manage members, approvals, payouts and reports</p>
      </div>

      <div>
        {TAB_CONTENT[activeTab]}
      </div>
    </div>
  );
}
