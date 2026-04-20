import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { useGetAdminStatsQuery } from '../store/apiSlice';
import {
  UsersIcon, CheckCircleIcon, ClockIcon, UserIcon,
  BanknotesIcon, BriefcaseIcon, ReceiptIcon,
  ArrowRightIcon, ChartBarIcon, RefreshIcon, TrendingUpIcon,
} from '../components/Icons';

const DONUT_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

function KPICard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: JSX.Element; color?: string;
}) {
  return (
    <div className="relative rounded-3xl overflow-hidden" style={{
      padding: '1.25rem',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-2">{label}</div>
          <div className="text-3xl font-black t-text">{value}</div>
          {sub && <div className="text-xs t-text-4 mt-1">{sub}</div>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
          background: color || 'var(--color-overlay)',
          color: 'white',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function RevenueCard({ label, value, sub, icon, gradient }: {
  label: string; value: number; sub: string; icon: JSX.Element; gradient: string;
}) {
  return (
    <div className="relative rounded-3xl overflow-hidden" style={{
      padding: '1.5rem',
      background: gradient,
      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
      color: 'white',
    }}>
      <div className="absolute pointer-events-none" style={{ width: 140, height: 140, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.18)', top: -40, right: -30 }} />
      <div className="absolute pointer-events-none" style={{ width: 90, height: 90, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)', top: 10, right: 30 }} />
      <div className="absolute pointer-events-none" style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', bottom: -15, left: -10 }} />

      <div className="relative flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
          {icon}
        </div>
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</div>
      </div>
      <div className="relative text-4xl font-black leading-none mb-2">₹{value.toLocaleString('en-IN')}</div>
      <div className="relative text-xs font-medium" style={{ color: 'rgba(255,255,255,0.78)' }}>{sub}</div>
    </div>
  );
}

export default function Plan2AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStatsQuery();

  const dailyJoiningChartData = stats
    ? Object.entries(stats.dailyJoinings || {})
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

  const tooltipStyle = {
    contentStyle: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 13 },
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-heading">Plan 2 — Referral Program</h1>
        <p className="help-text mt-1">Admin dashboard for referral & payout management</p>
      </div>

      {/* KPIs — Users & Network */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-3">Users & Network</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard label="Users"            value={isLoading ? '—' : (stats?.regularUsers    || 0)} icon={<UserIcon size={18} />}         color="#0066ff" sub="Regular members" />
          <KPICard label="Root Users"       value={isLoading ? '—' : (stats?.rootUsers       || 0)} icon={<UsersIcon size={18} />}        color="#10b981" sub="Root-level members" />
          <KPICard label="Total Joinings"   value={isLoading ? '—' : (stats?.totalJoinings   || 0)} icon={<CheckCircleIcon size={18} />}  color="#ef4444" sub="All time" />
          <KPICard label="Pending Requests" value={isLoading ? '—' : (stats?.pendingRequests || 0)} icon={<ClockIcon size={18} />}        color="#9333ea" sub="Awaiting approval" />
        </div>
      </div>

      {/* KPIs — Financials */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-3">Financials</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <RevenueCard label="Total Payouts" value={stats?.totalPayoutAmount || 0}
            sub="Paid out to members" icon={<BanknotesIcon size={22} />}
            gradient="linear-gradient(135deg, #0066ff 0%, #0047b3 100%)" />
          <RevenueCard label="Total Revenue" value={stats?.totalRevenueAmount || 0}
            sub="Admin wallet income" icon={<BriefcaseIcon size={22} />}
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)" />
          <RevenueCard label="GST Collected" value={stats?.gstCollected || 0}
            sub="Tax collected from joinings" icon={<ReceiptIcon size={22} />}
            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" />
          <RevenueCard label="Platform Fees" value={stats?.companyFeeTotal || 0}
            sub="₹70 company fee per joining" icon={<BriefcaseIcon size={22} />}
            gradient="linear-gradient(135deg, #9333ea 0%, #6d28d9 100%)" />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin?tab=requests"
          className="card hover:shadow-lg transition-all flex items-center justify-between group">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-1">Join Requests</div>
            <div className="text-2xl font-black t-text">{stats?.pendingRequests || 0} pending</div>
            <div className="text-xs t-text-3 mt-1">Review and approve joining requests</div>
          </div>
          <ArrowRightIcon size={20} />
        </Link>

        <Link to="/admin?tab=payoutlog"
          className="card hover:shadow-lg transition-all flex items-center justify-between group">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-1">Payout Log</div>
            <div className="text-2xl font-black t-text">{stats?.totalJoinings || 0} joinings</div>
            <div className="text-xs t-text-3 mt-1">View all payout records & cycles</div>
          </div>
          <ArrowRightIcon size={20} />
        </Link>

        <Link to="/admin?tab=revenue"
          className="card hover:shadow-lg transition-all flex items-center justify-between group">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-1">Root Revenue</div>
            <div className="text-2xl font-black t-text">₹{(stats?.totalRevenueAmount || 0).toLocaleString('en-IN')}</div>
            <div className="text-xs t-text-3 mt-1">Company revenue & platform fees</div>
          </div>
          <ArrowRightIcon size={20} />
        </Link>
      </div>

      {/* Daily Joinings — Area Chart */}
      {dailyJoiningChartData.length > 0 && (
        <div className="relative rounded-3xl overflow-hidden" style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
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
        {cycleDistributionChartData.length > 0 && (
          <div className="relative rounded-3xl overflow-hidden" style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
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

        {revenueSplitChartData.length > 0 && (
          <div className="relative rounded-3xl overflow-hidden" style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div className="relative flex items-start justify-between mb-5">
              <div>
                <div className="font-bold t-text" style={{ fontSize: '1rem' }}>Revenue Split</div>
                <div className="text-xs t-text-4 mt-0.5">Breakdown by revenue category</div>
              </div>
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-overlay)', color: 'var(--color-text-3)' }}>
                <TrendingUpIcon size={16} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={revenueSplitChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85}>
                  {revenueSplitChartData.map((_e, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(value) => `₹${(value as number).toLocaleString('en-IN')}`} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="card border-l-4 border-l-brand-500">
        <div className="flex items-start gap-3">
          <ChartBarIcon size={20} />
          <div className="text-sm t-text-3">
            <div className="font-bold t-text mb-1">About Plan 2</div>
            <p>
              Plan 2 is the referral program. Members pay <strong>₹1,000</strong> to join and receive
              a <strong>₹1,000 coupon wallet</strong> credit. The fee is distributed as payouts to upline
              members (₹250 × 3 levels), plus <strong>₹180 GST</strong> and <strong>₹70 platform fee</strong> to admin.
              Members earn ₹250 for each referral across 9 cycle levels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
