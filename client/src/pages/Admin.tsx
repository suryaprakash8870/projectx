import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '../store/store';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import Plan2Referral from './Plan2Referral';
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
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetProductsQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  // Plan 2 admin
  usePlan2AdminStatsQuery,
  usePlan2AdminMembersQuery,
  usePlan2AdminInvestmentRequestsQuery,
  usePlan2AdminApproveInvestmentMutation,
  usePlan2AdminRejectInvestmentMutation,
  usePlan2AdminDistributeReturnsMutation,
  usePlan2AdminReturnRunsQuery,
  usePlan2AdminReturnPayoutsQuery,
} from '../store/apiSlice';
import {
  ChartBarIcon, DocumentIcon, UsersIcon, BanknotesIcon,
  ReceiptIcon, StorefrontIcon, RefreshIcon, TrendingUpIcon, UserIcon,
  ClockIcon, CheckCircleIcon, XCircleIcon, BriefcaseIcon, BoltIcon,
  ClipboardIcon, ArrowDownIcon, ShoppingBagIcon,
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

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon, fullBg, fullBgText }: {
  label: string; value: any; sub?: string; icon: JSX.Element;
  fullBg?: string; fullBgText?: boolean; color?: string;
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
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { data: requests = [], refetch } = useGetAllJoiningsQuery(statusFilter);
  const [approve] = useApproveJoiningMutation();
  const [reject,  { isLoading: rejecting }] = useRejectJoiningMutation();

  async function handleApprove(id: string) {
    setApprovingId(id);
    try {
      await approve(id).unwrap();
      toast.success('Joining approved! Payouts processed.');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Approval failed');
    } finally {
      setApprovingId(null);
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
                      <button onClick={() => handleApprove(r.id)} disabled={approvingId === r.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', opacity: approvingId === r.id ? 0.7 : 1 }}>
                        {approvingId === r.id
                          ? <><RefreshIcon size={13} className="animate-spin" /> Processing…</>
                          : <><CheckCircleIcon size={13} /> Approve</>}
                      </button>
                      <button onClick={() => setRejectId(r.id)} disabled={!!approvingId}
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
                <button onClick={() => handleApprove(r.id)} disabled={approvingId === r.id}
                  className="inline-flex items-center justify-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', opacity: approvingId === r.id ? 0.7 : 1 }}>
                  {approvingId === r.id
                    ? <><RefreshIcon size={13} className="animate-spin" /> Processing…</>
                    : <><CheckCircleIcon size={13} /> Approve</>}
                </button>
                <button onClick={() => setRejectId(r.id)} disabled={!!approvingId}
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
              <button onClick={() => setRejectId(null)} disabled={rejecting} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReject} disabled={rejecting} className="btn-danger flex-1 inline-flex items-center justify-center gap-1.5">
                {rejecting ? <><RefreshIcon size={14} className="animate-spin" /> Rejecting…</> : 'Confirm Reject'}
              </button>
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
  const [typeFilter] = useState<string>('');
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
        <TablePagination page={page} totalPages={data.totalPages} onPageChange={setPage} total={(data as any).total} />
      )}
    </div>
  );
}

// ── Products Tab ─────────────────────────────────────────────────────────────
function ProductsTab() {
  const { data: products = [], isLoading, refetch } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();

  const emptyForm = { name: '', description: '', price: '', categoryId: '', couponSplitPct: '50', imageUrl: '', isActive: true };
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openAdd() { setForm(emptyForm); setEditingId(null); setShowForm(true); }
  function openEdit(p: any) {
    setForm({ name: p.name, description: p.description || '', price: String(p.price), categoryId: p.categoryId || '', couponSplitPct: String(p.couponSplitPct), imageUrl: p.imageUrl || '', isActive: p.isActive });
    setEditingId(p.id);
    setShowForm(true);
  }
  function closeForm() { setShowForm(false); setEditingId(null); setForm(emptyForm); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name: form.name, description: form.description || undefined, price: parseInt(form.price), categoryId: form.categoryId || undefined, couponSplitPct: parseInt(form.couponSplitPct), imageUrl: form.imageUrl || undefined, isActive: form.isActive };
    try {
      if (editingId) {
        await updateProduct({ id: editingId, ...payload }).unwrap();
        toast.success('Product updated');
      } else {
        await createProduct(payload).unwrap();
        toast.success('Product created');
      }
      closeForm();
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id).unwrap();
      toast.success('Product deleted');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  }

  async function handleToggleActive(p: any) {
    try {
      await updateProduct({ id: p.id, isActive: !p.isActive }).unwrap();
      toast.success(p.isActive ? 'Product hidden from shop' : 'Product visible in shop');
      refetch();
    } catch { toast.error('Failed to update'); }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold t-text" style={{ fontSize: '1rem' }}>Marketplace Products</div>
          <div className="text-xs t-text-4 mt-0.5">{products.length} products total</div>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-2">
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Add Product
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card space-y-4">
          <div className="font-bold t-text">{editingId ? 'Edit Product' : 'New Product'}</div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="input-label">Product Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Premium Membership Kit" />
              </div>
              <div>
                <label className="input-label">Price (₹) *</label>
                <input className="input" type="number" required min="1" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="1000" />
              </div>
              <div>
                <label className="input-label">Category</label>
                <select className="input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">No category</option>
                  {(categories as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Coupon Split % (max coupon usage)</label>
                <input className="input" type="number" min="0" max="100" value={form.couponSplitPct} onChange={e => setForm(f => ({ ...f, couponSplitPct: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="input-label">Image URL</label>
                <input className="input" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="sm:col-span-2">
                <label className="input-label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short product description..." />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive as boolean} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
                <label htmlFor="isActive" className="text-sm t-text-2 cursor-pointer">Visible in shop</label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={closeForm} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={creating || updating} className="btn-primary flex-1">
                {creating || updating ? 'Saving...' : editingId ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📦</div>
          <div className="font-semibold t-text mb-1">No products yet</div>
          <div className="text-sm t-text-4">Click "Add Product" to create your first product</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(products as any[]).map((p: any) => (
            <div key={p.id} className="relative rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
              {/* Image */}
              <div className="w-full h-36 flex items-center justify-center overflow-hidden" style={{ background: 'var(--color-overlay)' }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center gap-1 t-text-4">
                    <ShoppingBagIcon size={32} />
                    <span style={{ fontSize: '0.6875rem' }}>No image</span>
                  </div>
                )}
              </div>
              {/* Status badge */}
              <div className="absolute top-2 right-2">
                <span className={`badge font-bold text-xs ${p.isActive ? 'badge-active' : 'badge-pending'}`}>{p.isActive ? 'Active' : 'Hidden'}</span>
              </div>
              <div className="p-4">
                <div className="font-bold t-text truncate" style={{ fontSize: '0.9375rem' }}>{p.name}</div>
                {p.category && <div className="text-xs t-text-4 mt-0.5">{p.category.name}</div>}
                <div className="flex items-center justify-between mt-2">
                  <div className="font-mono font-black text-brand-400" style={{ fontSize: '1.1rem' }}>₹{p.price.toLocaleString('en-IN')}</div>
                  <div className="text-xs t-text-4">Coupon up to {p.couponSplitPct}%</div>
                </div>
                {p.description && <div className="text-xs t-text-4 mt-2 line-clamp-2">{p.description}</div>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(p)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors" style={{ background: 'var(--color-overlay)', color: 'var(--color-text-2)', border: '1px solid var(--color-border)' }}>
                    Edit
                  </button>
                  <button onClick={() => handleToggleActive(p)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors" style={{ background: p.isActive ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: p.isActive ? '#d97706' : '#059669', border: `1px solid ${p.isActive ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                    {p.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} disabled={deleting} className="py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <XCircleIcon size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
const ORDER_STATUSES = ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  PLACED:     { bg: 'rgba(59,130,246,0.12)',  text: '#3b82f6' },
  PROCESSING: { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b' },
  SHIPPED:    { bg: 'rgba(139,92,246,0.12)',  text: '#8b5cf6' },
  DELIVERED:  { bg: 'rgba(16,185,129,0.12)',  text: '#10b981' },
  CANCELLED:  { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444' },
};

function OrdersTab() {
  const { data: orders = [], isLoading, refetch } = useGetAllOrdersQuery();
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filtered = orders.filter((o: any) => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.user?.memberId?.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.product?.name?.toLowerCase().includes(q) ||
      o.id?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = ORDER_STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o: any) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  async function handleStatusChange(id: string, status: string) {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Order updated to ${status}`);
    } catch {
      toast.error('Failed to update order status');
    }
  }

  if (isLoading) return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ORDER_STATUSES.map(s => (
          <div key={s}
            onClick={() => setStatusFilter(f => f === s ? 'ALL' : s)}
            className="card cursor-pointer transition-all hover:shadow-md"
            style={{ borderColor: statusFilter === s ? STATUS_STYLE[s].text : undefined, borderWidth: statusFilter === s ? 2 : undefined }}>
            <div className="text-2xl font-black font-mono" style={{ color: STATUS_STYLE[s].text }}>{counts[s] ?? 0}</div>
            <div className="text-xs font-semibold t-text-4 mt-1 uppercase tracking-wide">{s}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by member, product or order ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          {['ALL', ...ORDER_STATUSES].map(s => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all"
              style={statusFilter === s
                ? { background: s === 'ALL' ? 'var(--color-primary)' : STATUS_STYLE[s].text, color: '#fff', borderColor: 'transparent' }
                : { background: 'var(--color-surface-2)', color: 'var(--color-text-3)', borderColor: 'var(--color-border)' }}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={() => refetch()} className="btn text-xs px-3 py-1.5 flex items-center gap-1.5">
          <RefreshIcon size={13} /> Refresh
        </button>
      </div>

      {/* Orders table */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📦</div>
          <div className="font-semibold t-text mb-1">No orders found</div>
          <div className="text-sm t-text-4">Try adjusting your filters</div>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Member</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o: any) => (
                  <tr key={o.id}>
                    <td>
                      <span className="font-mono text-xs t-text-3">{o.id.slice(0, 8)}…</span>
                    </td>
                    <td>
                      <div className="font-semibold t-text text-sm">{o.user?.name || '—'}</div>
                      <div className="font-mono text-xs t-text-4">{o.user?.memberId}</div>
                    </td>
                    <td>
                      <div className="text-sm t-text-2 max-w-[140px] truncate">{o.product?.name || '—'}</div>
                      {o.product?.category?.name && (
                        <div className="text-xs t-text-4">{o.product.category.name}</div>
                      )}
                    </td>
                    <td><span className="font-mono font-bold t-text">{o.quantity}</span></td>
                    <td><span className="font-mono font-bold t-text">₹{o.totalAmount?.toLocaleString('en-IN')}</span></td>
                    <td>
                      <span className="text-xs t-text-3">
                        {new Date(o.placedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: STATUS_STYLE[o.status]?.bg, color: STATUS_STYLE[o.status]?.text }}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={o.status}
                        onChange={e => handleStatusChange(o.id, e.target.value)}
                        className="text-xs rounded-lg px-2 py-1 border"
                        style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text-2)' }}
                      >
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-xs t-text-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            Showing {filtered.length} of {orders.length} orders
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── PLAN 2 ADMIN TABS ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function Plan2OverviewTab() {
  const { data: stats } = usePlan2AdminStatsQuery();
  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-3">Members</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard label="Total Members"    value={stats?.totalMembers    || 0} icon={<UsersIcon size={16} />} sub="All Plan 2 users" />
          <KPICard label="Active Members"   value={stats?.activeMembers   || 0} icon={<CheckCircleIcon size={16} />} sub="Investment approved" />
          <KPICard label="Pending Members"  value={stats?.pendingMembers  || 0} icon={<ClockIcon size={16} />} sub="Awaiting OTP / approval" />
          <KPICard label="Pending Requests" value={stats?.pendingRequests || 0} icon={<DocumentIcon size={16} />} sub="Investment requests queue" />
        </div>
      </div>

      <div>
        <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-3">Investment & Returns</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard label="Active Investments" value={stats?.totalInvestments || 0}                                      icon={<BriefcaseIcon size={16} />} />
          <KPICard label="Total Invested"     value={`₹${(stats?.totalInvestedAmount        || 0).toLocaleString('en-IN')}`} icon={<BanknotesIcon size={16} />} />
          <KPICard label="Monthly Returns"    value={`₹${(stats?.totalMonthlyReturnsPaid    || 0).toLocaleString('en-IN')}`} icon={<TrendingUpIcon size={16} />} sub="5% × investments" />
          <KPICard label="Referral Returns"   value={`₹${(stats?.totalReferralReturnsPaid   || 0).toLocaleString('en-IN')}`} icon={<BoltIcon size={16} />} sub="2% × direct referrals" />
        </div>
      </div>

      <div className="card">
        <div className="section-title">Monthly Distribution Runs</div>
        <div className="text-sm t-text-3 mt-1">{stats?.totalRunsCompleted || 0} monthly distribution runs completed</div>
      </div>
    </div>
  );
}

function Plan2InvestmentRequestsTab() {
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const { data: requests = [] } = usePlan2AdminInvestmentRequestsQuery(statusFilter || undefined);
  const [approve, { isLoading: approving }] = usePlan2AdminApproveInvestmentMutation();
  const [reject, { isLoading: rejecting }] = usePlan2AdminRejectInvestmentMutation();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  async function handleApprove(id: string) {
    try { await approve(id).unwrap(); toast.success('Investment approved. Member can now refer.'); }
    catch (err: any) { toast.error(err?.data?.message || 'Failed'); }
  }
  async function handleReject() {
    if (!rejectId) return;
    try {
      await reject({ id: rejectId, note: rejectNote }).unwrap();
      toast.success('Rejected');
      setRejectId(null); setRejectNote('');
    } catch (err: any) { toast.error(err?.data?.message || 'Failed'); }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED', ''].map(s => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 rounded-full font-semibold text-xs transition-all border"
            style={{
              background: statusFilter === s ? '#0066ff' : 'transparent',
              color: statusFilter === s ? 'white' : 'var(--color-text-3)',
              borderColor: statusFilter === s ? '#0066ff' : 'var(--color-border)',
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Member</th><th>Mobile</th><th>Amount</th><th>Referrer</th><th>Status</th><th>Submitted</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r: any) => (
              <tr key={r.id}>
                <td>
                  <div className="font-mono text-brand-400 font-bold">{r.user.memberId}</div>
                  <div className="text-xs t-text-3">{r.user.name}</div>
                </td>
                <td className="font-mono text-xs t-text-3">{r.user.mobile}</td>
                <td className="font-mono font-bold">₹{r.amount.toLocaleString('en-IN')}</td>
                <td className="font-mono text-xs">{r.user.referrer?.memberId || '—'}</td>
                <td>
                  <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                </td>
                <td className="text-xs t-text-4">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  {r.status === 'PENDING' && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleApprove(r.id)} disabled={approving}
                        className="px-2.5 py-1 rounded text-xs font-semibold"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
                        Approve
                      </button>
                      <button onClick={() => setRejectId(r.id)}
                        className="px-2.5 py-1 rounded text-xs font-semibold"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!requests.length && (
              <tr><td colSpan={7} className="text-center py-8 t-text-4 text-sm">No investment requests</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setRejectId(null)} />
          <div className="relative card max-w-md w-full">
            <h3 className="font-bold t-text mb-3">Reject Investment Request</h3>
            <textarea className="input resize-none" rows={3} placeholder="Rejection reason (optional)"
              value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
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

function Plan2MembersTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data } = usePlan2AdminMembersQuery({ search: search || undefined, page });

  return (
    <div className="space-y-4">
      <input className="input" placeholder="Search by member ID, name, or mobile..."
        value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Member</th><th>Mobile</th><th>Referrer</th><th>Invested</th><th>Balance</th><th>Status</th><th>Can Refer</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {data?.members?.map((m: any) => (
              <tr key={m.id}>
                <td>
                  <div className="font-mono text-brand-400 font-bold">{m.memberId}</div>
                  <div className="text-xs t-text-3">{m.name}</div>
                </td>
                <td className="font-mono text-xs">{m.mobile}</td>
                <td className="font-mono text-xs">{m.referrer?.memberId || <span className="t-text-4">Admin</span>}</td>
                <td className="font-mono font-bold">₹{m.totalInvested.toLocaleString('en-IN')}</td>
                <td className="font-mono text-emerald-500">₹{m.incomeBalance.toLocaleString('en-IN')}</td>
                <td><span className={`badge badge-${m.status.toLowerCase()}`}>{m.status}</span></td>
                <td>{m.canRefer ? <span className="text-emerald-500 font-bold">Yes</span> : <span className="t-text-4">No</span>}</td>
                <td className="text-xs t-text-4">{new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
            {!data?.members?.length && (
              <tr><td colSpan={8} className="text-center py-8 t-text-4 text-sm">No Plan 2 members yet</td></tr>
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

function Plan2MonthlyReturnsTab() {
  const { data: runs = [] } = usePlan2AdminReturnRunsQuery();
  const [distribute, { isLoading: distributing }] = usePlan2AdminDistributeReturnsMutation();
  const [monthKey, setMonthKey] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  async function handleDistribute() {
    try {
      const result: any = await distribute({ monthKey }).unwrap();
      toast.success(`${monthKey} distributed: ₹${result.totalMonthly + result.totalReferral} to ${result.investorsPaid + result.referrersPaid} users`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to distribute');
    }
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="section-title mb-4">Distribute Returns</div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full">
            <label className="input-label">Month (YYYY-MM)</label>
            <input className="input" type="month" value={monthKey} onChange={e => setMonthKey(e.target.value)} />
          </div>
          <button onClick={handleDistribute} disabled={distributing} className="btn-primary">
            {distributing ? 'Distributing...' : `Distribute ${monthKey}`}
          </button>
        </div>
        <p className="text-xs t-text-4 mt-2">
          Each active investor gets 5% of their amount. Each direct referrer gets 2% of their referred investors' amount.
          Runs are idempotent — each month can only be distributed once.
        </p>
      </div>

      <div>
        <div className="section-title mb-3">Distribution History</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th><th>Monthly</th><th>Referral</th><th>Investors</th><th>Referrers</th><th>Run At</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r: any) => (
                <tr key={r.id}>
                  <td className="font-mono font-bold">{r.monthKey}</td>
                  <td className="font-mono text-emerald-500">₹{r.totalMonthlyCredit.toLocaleString('en-IN')}</td>
                  <td className="font-mono text-brand-400">₹{r.totalReferralCredit.toLocaleString('en-IN')}</td>
                  <td>{r.totalInvestorsPaid}</td>
                  <td>{r.totalReferrersPaid}</td>
                  <td className="text-xs t-text-4">{new Date(r.runAt).toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {!runs.length && (
                <tr><td colSpan={6} className="text-center py-8 t-text-4 text-sm">No distributions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Plan2ReturnPayoutsTab() {
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const { data } = usePlan2AdminReturnPayoutsQuery({ kind: kind || undefined, page });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['', 'All'], ['MONTHLY_RETURN', 'Monthly'], ['REFERRAL_RETURN', 'Referral']].map(([v, l]) => (
          <button key={v || 'all'} onClick={() => { setKind(v); setPage(1); }}
            className="px-3 py-1.5 rounded-full font-semibold text-xs transition-all border"
            style={{
              background: kind === v ? '#0066ff' : 'transparent',
              color: kind === v ? 'white' : 'var(--color-text-3)',
              borderColor: kind === v ? '#0066ff' : 'var(--color-border)',
            }}>{l}</button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Recipient</th><th>Kind</th><th>Amount</th><th>Month</th><th>Date</th></tr>
          </thead>
          <tbody>
            {data?.payouts?.map((p: any) => (
              <tr key={p.id}>
                <td>
                  <div className="font-mono text-brand-400 font-bold">{p.recipient.memberId}</div>
                  <div className="text-xs t-text-3">{p.recipient.name}</div>
                </td>
                <td>
                  <span className="badge" style={{
                    background: p.kind === 'MONTHLY_RETURN' ? 'rgba(16,185,129,0.1)' : 'rgba(168,85,247,0.1)',
                    color: p.kind === 'MONTHLY_RETURN' ? '#059669' : '#9333ea',
                    border: `1px solid ${p.kind === 'MONTHLY_RETURN' ? 'rgba(16,185,129,0.2)' : 'rgba(168,85,247,0.2)'}`,
                  }}>
                    {p.kind === 'MONTHLY_RETURN' ? 'Monthly 5%' : 'Referral 2%'}
                  </span>
                </td>
                <td className="font-mono font-bold text-emerald-500">₹{p.amount.toLocaleString('en-IN')}</td>
                <td className="font-mono text-xs">{p.monthKey}</td>
                <td className="text-xs t-text-4">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
            {!data?.payouts?.length && (
              <tr><td colSpan={5} className="text-center py-8 t-text-4 text-sm">No return payouts yet</td></tr>
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

// ── Admin root ────────────────────────────────────────────────────────────────
export default function Admin() {
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as string) || 'overview';
  const adminPlan = useSelector((s: RootState) => s.adminPlan.selected);

  const PLAN1_TAB_CONTENT: Record<string, JSX.Element> = {
    overview:      <OverviewTab />,
    requests:      <RequestsTab />,
    members:       <MembersTab />,
    payoutlog:     <PayoutLogTab />,
    revenue:       <CompanyRevenueTab />,
    gst:           <GSTTab />,
    vendors:       <VendorsTab />,
    products:      <ProductsTab />,
    orders:        <OrdersTab />,
  };

  const PLAN2_TAB_CONTENT: Record<string, JSX.Element> = {
    overview:       <Plan2OverviewTab />,
    requests:       <Plan2InvestmentRequestsTab />,
    members:        <Plan2MembersTab />,
    returns:        <Plan2MonthlyReturnsTab />,
    returnpayouts:  <Plan2ReturnPayoutsTab />,
    referral:       <Plan2Referral />,
  };

  const PLAN1_TAB_LABELS: Record<string, string> = {
    overview: 'Overview', requests: 'Join Requests', members: 'Members',
    payoutlog: 'Payout Log', revenue: 'Root Revenue', gst: 'GST Report',
    vendors: 'Vendors', products: 'Products', orders: 'Orders',
  };
  const PLAN2_TAB_LABELS: Record<string, string> = {
    overview: 'Plan 2 Overview', requests: 'Investment Requests', members: 'Plan 2 Members',
    returns: 'Monthly Returns', returnpayouts: 'Return Payouts', referral: 'Referral',
  };

  const isPlan2 = adminPlan === 'PLAN2';
  const content = isPlan2
    ? (PLAN2_TAB_CONTENT[activeTab] ?? <Plan2OverviewTab />)
    : (PLAN1_TAB_CONTENT[activeTab] ?? <OverviewTab />);
  const title = isPlan2
    ? (PLAN2_TAB_LABELS[activeTab] ?? 'Plan 2 Overview')
    : (PLAN1_TAB_LABELS[activeTab] ?? 'Admin Panel');
  const subtitle = isPlan2
    ? 'Plan 2 — Investment Program management'
    : 'Manage members, approvals, payouts and reports';

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-heading">{title}</h1>
        <p className="help-text mt-1">{subtitle}</p>
      </div>

      <div>
        {content}
      </div>
    </div>
  );
}
