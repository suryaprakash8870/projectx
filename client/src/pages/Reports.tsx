import { useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUpIcon, BriefcaseIcon, BanknotesIcon, GlobeIcon, DocumentIcon,
  TagIcon, ChartBarIcon, ReceiptIcon, StarIcon, UsersIcon, LeafIcon, RefreshIcon,
  GemIcon, ShoppingCartIcon, BoxIcon, CurrencyIcon, CheckCircleIcon, ClockIcon,
  ClipboardIcon, UserIcon,
} from '../components/Icons';

type ReportSection = 'summary' | 'wallet' | 'income' | 'transactions' | 'network' | 'purchases' | 'membership';
import {
  useGetMeQuery,
  useGetWalletQuery,
  useGetTransactionsQuery,
  useGetNetworkStatsQuery,
  useGetPayoutSlotsQuery,
  useGetMyOrdersQuery,
  useGetMyJoiningQuery,
} from '../store/apiSlice';

// ── Colours ───────────────────────────────────────────────────────────────────
const WALLET_COLORS = {
  COUPON:   { fill: '#f59e0b', light: '#fef3c7', text: 'text-amber-500',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
  PURCHASE: { fill: '#3b82f6', light: '#dbeafe', text: 'text-blue-500',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
  INCOME:   { fill: '#10b981', light: '#d1fae5', text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  GST:      { fill: '#8b5cf6', light: '#ede9fe', text: 'text-purple-500',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30' },
};

// ── Reusable stat card ────────────────────────────────────────────────────────
function StatCard({
  label, value, subtext, icon, accentColor,
}: {
  label: string; value: string | number; subtext?: string; icon: React.ReactNode; accentColor: string;
}) {
  return (
    <div className="card">
      <div className="flex items-start gap-3 mb-2">
        <div className="mt-0.5 t-text-3">{icon}</div>
        <div className="flex-1">
          <div className="help-text font-semibold">{label}</div>
          {subtext && <div className="help-text mt-0.5">{subtext}</div>}
        </div>
      </div>
      <div className={`font-black font-mono tabular-nums ${accentColor}`} style={{ fontSize: '2rem', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function ReportSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-bold t-text flex items-center gap-2 mb-3" style={{ fontSize: '1.25rem' }}>
        <span className="t-text-3">{icon}</span>
        <span>{title}</span>
      </h2>
      {children}
    </section>
  );
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-xl border" style={{
      background: 'var(--color-surface-2)',
      borderColor: 'var(--color-border-2)',
      minWidth: '140px',
    }}>
      {label && <div className="help-text font-semibold mb-1">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="font-bold font-mono" style={{ color: p.fill || p.color, fontSize: '1rem' }}>
          ₹{Number(p.value).toLocaleString('en-IN')}
        </div>
      ))}
    </div>
  );
}

// ── Main Reports page ─────────────────────────────────────────────────────────
export default function Reports() {
  const [searchParams] = useSearchParams();
  const activeSection = (searchParams.get('section') as ReportSection) || 'summary';

  const { data: me,       isLoading: meLoading       } = useGetMeQuery();
  const { data: wallet,   isLoading: walletLoading   } = useGetWalletQuery();
  const { data: stats,    isLoading: statsLoading    } = useGetNetworkStatsQuery();
  const { data: slotsData,isLoading: slotsLoading    } = useGetPayoutSlotsQuery();
  const { data: txData,   isLoading: txLoading       } = useGetTransactionsQuery({ page: 1, limit: 100 });
  const { data: orders,   isLoading: ordersLoading   } = useGetMyOrdersQuery();
  const { data: joining,  isLoading: joiningLoading  } = useGetMyJoiningQuery();

  const isLoading = meLoading || walletLoading || statsLoading || txLoading;

  // ── Derived data ─────────────────────────────────────────────────────────
  const transactions: any[] = txData?.transactions || [];

  // Total earned vs spent
  const totalCredit = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
  const totalDebit  = transactions.filter(t => t.type === 'DEBIT' ).reduce((s, t) => s + t.amount, 0);

  // Credit by wallet type
  const creditByWallet = ['COUPON', 'PURCHASE', 'INCOME', 'GST'].map(f => ({
    name: f.charAt(0) + f.slice(1).toLowerCase(),
    value: transactions.filter(t => t.type === 'CREDIT' && t.field === f).reduce((s, t) => s + t.amount, 0),
    fill: WALLET_COLORS[f as keyof typeof WALLET_COLORS].fill,
  })).filter(d => d.value > 0);

  // Monthly income trend (last 6 months, INCOME CREDIT only)
  const now = new Date();
  const monthLabels = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  });
  const monthlyIncome = monthLabels.map(label => {
    const [mon, yr] = label.split(' ');
    const total = transactions
      .filter(t => t.type === 'CREDIT' && t.field === 'INCOME')
      .filter(t => {
        const d = new Date(t.createdAt);
        return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) === label;
      })
      .reduce((s, t) => s + t.amount, 0);
    return { month: `${mon} '${yr}`, amount: total };
  });

  // Wallet balance breakdown for pie
  const walletPie = wallet ? [
    { name: 'Coupon',   value: wallet.couponBalance,   fill: '#f59e0b' },
    { name: 'Purchase', value: wallet.purchaseBalance, fill: '#3b82f6' },
    { name: 'Income',   value: wallet.incomeBalance,   fill: '#10b981' },
    { name: 'GST',      value: wallet.gstBalance,      fill: '#8b5cf6' },
  ].filter(d => d.value > 0) : [];

  const totalWalletBalance = wallet
    ? (wallet.couponBalance + wallet.purchaseBalance + wallet.incomeBalance + wallet.gstBalance)
    : 0;

  // Orders summary
  const allOrders: any[] = orders || [];
  const totalOrderAmount = allOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const deliveredOrders  = allOrders.filter(o => o.status === 'DELIVERED').length;

  const SECTION_TITLES: Record<ReportSection, string> = {
    summary:     'Summary at a Glance',
    wallet:      'Wallet Balance',
    income:      'Monthly Income Trend',
    transactions:'Transaction Summary',
    network:     'Network Report',
    purchases:   'Purchase Report',
    membership:  'Membership Status',
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="page-heading">{SECTION_TITLES[activeSection]}</h1>
        {me && (
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full border font-semibold"
            style={{ background: 'var(--color-overlay)', borderColor: 'var(--color-border-2)', fontSize: '0.875rem', color: 'var(--color-text-3)' }}>
            <ClipboardIcon size={16} /> Report for: <span className="text-brand-400 font-bold font-mono">{me.memberId || me.name}</span>
          </div>
        )}
      </div>

      {/* ── 1. Summary Stats ────────────────────────────────────────────── */}
      {activeSection === 'summary' && <ReportSection title="Summary at a Glance" icon={<TrendingUpIcon size={22} />}>
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Wallet Balance"
              value={`₹${totalWalletBalance.toLocaleString('en-IN')}`}
              icon={<BriefcaseIcon size={22} />}
              accentColor="text-brand-400"
            />
            <StatCard
              label="Total Income Earned"
              value={`₹${(wallet?.incomeBalance ?? 0).toLocaleString('en-IN')}`}
              subtext="Referral payouts credited"
              icon={<BanknotesIcon size={22} />}
              accentColor="text-emerald-400"
            />
            <StatCard
              label="Network Size"
              value={stats?.realDownlines ?? 0}
              subtext={`${stats?.direct ?? 0} direct referrals`}
              icon={<GlobeIcon size={22} />}
              accentColor="text-purple-400"
            />
            <StatCard
              label="Total Transactions"
              value={transactions.length}
              subtext={`${transactions.filter(t => t.type === 'CREDIT').length} credits`}
              icon={<DocumentIcon size={22} />}
              accentColor="text-amber-400"
            />
          </div>
        )}
      </ReportSection>}

      {/* ── 2. Wallet Balance Breakdown ──────────────────────────────────── */}
      {activeSection === 'wallet' && <ReportSection title="Wallet Balance Breakdown" icon={<TagIcon size={22} />}>
        {walletLoading ? (
          <div className="skeleton h-64 rounded-2xl" />
        ) : (
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Pie chart */}
              <div>
                <div className="help-text font-semibold uppercase tracking-wide mb-3">Balance Distribution</div>
                {walletPie.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={walletPie}
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        innerRadius={40}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {walletPie.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<ChartTooltip />}
                        formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-32 flex items-center justify-center help-text">No balance yet</div>
                )}
              </div>

              {/* Balance table */}
              <div className="space-y-3">
                {([
                  ['Coupon',   wallet?.couponBalance   ?? 0, 'COUPON'],
                  ['Purchase', wallet?.purchaseBalance ?? 0, 'PURCHASE'],
                  ['Income',   wallet?.incomeBalance   ?? 0, 'INCOME'],
                  ['GST',      wallet?.gstBalance      ?? 0, 'GST'],
                ] as [string, number, string][]).map(([name, amount, key]) => {
                  const pct = totalWalletBalance > 0 ? (amount / totalWalletBalance) * 100 : 0;
                  const wc  = WALLET_COLORS[key as keyof typeof WALLET_COLORS];
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold ${wc.text}`} style={{ fontSize: '0.9375rem' }}>{name} Wallet</span>
                        <span className="font-bold font-mono t-text" style={{ fontSize: '1rem' }}>
                          ₹{amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full rounded-full h-3" style={{ background: 'var(--color-surface-3)' }}>
                        <div className="h-3 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: wc.fill }} />
                      </div>
                      <div className="help-text mt-0.5">{pct.toFixed(1)}% of total</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </ReportSection>}

      {/* ── 3. Monthly Income Trend ──────────────────────────────────────── */}
      {activeSection === 'income' && <ReportSection title="Monthly Income Trend (Last 6 Months)" icon={<ChartBarIcon size={22} />}>
        {txLoading ? (
          <div className="skeleton h-56 rounded-2xl" />
        ) : (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="help-text font-semibold">Referral income credited each month</div>
              <div className="font-bold text-emerald-400 font-mono" style={{ fontSize: '0.9375rem' }}>
                Total: ₹{monthlyIncome.reduce((s, m) => s + m.amount, 0).toLocaleString('en-IN')}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyIncome} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--color-text-3)', fontSize: 13 }} />
                <YAxis tick={{ fill: 'var(--color-text-3)', fontSize: 13 }} tickFormatter={v => `₹${v}`} width={72} />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: 'var(--color-overlay)' }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} name="Income" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ReportSection>}

      {/* ── 4. Transaction Summary ───────────────────────────────────────── */}
      {activeSection === 'transactions' && <ReportSection title="Transaction Summary" icon={<ReceiptIcon size={22} />}>
        {txLoading ? (
          <div className="skeleton h-48 rounded-2xl" />
        ) : (
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Credit vs Debit overview */}
              <div>
                <div className="help-text font-semibold uppercase tracking-wide mb-3">Credits vs Debits</div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border" style={{ background: 'var(--color-overlay)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
                      <span className="help-text font-semibold">Total Received</span>
                    </div>
                    <div className="font-black font-mono text-emerald-400" style={{ fontSize: '1.75rem' }}>
                      +₹{totalCredit.toLocaleString('en-IN')}
                    </div>
                    <div className="help-text mt-1">
                      {transactions.filter(t => t.type === 'CREDIT').length} credit transactions
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border" style={{ background: 'var(--color-overlay)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 rounded-full bg-red-400 shrink-0" />
                      <span className="help-text font-semibold">Total Spent</span>
                    </div>
                    <div className="font-black font-mono text-red-400" style={{ fontSize: '1.75rem' }}>
                      -₹{totalDebit.toLocaleString('en-IN')}
                    </div>
                    <div className="help-text mt-1">
                      {transactions.filter(t => t.type === 'DEBIT').length} debit transactions
                    </div>
                  </div>
                </div>
              </div>

              {/* Earnings by wallet type */}
              <div>
                <div className="help-text font-semibold uppercase tracking-wide mb-3">Credits by Wallet</div>
                {creditByWallet.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={creditByWallet} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name }) => name}>
                        {creditByWallet.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`}
                        contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-2)', borderRadius: 12 }} />
                      <Legend wrapperStyle={{ fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-32 flex items-center justify-center help-text">No credits recorded yet</div>
                )}
              </div>
            </div>
          </div>
        )}
      </ReportSection>}

      {/* ── 5. Network Report ────────────────────────────────────────────── */}
      {activeSection === 'network' && <ReportSection title="Network Report" icon={<GlobeIcon size={22} />}>
        {statsLoading || slotsLoading ? (
          <div className="skeleton h-40 rounded-2xl" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Network stats */}
            <div className="card">
              <div className="section-title">Network Stats</div>
              <div className="space-y-0">
                {[
                  { label: 'My Level in Network',  value: stats?.level ?? 0,            icon: <StarIcon size={16} /> },
                  { label: 'Direct Referrals',      value: stats?.direct ?? 0,           icon: <UsersIcon size={16} /> },
                  { label: 'Total Downline Network',value: stats?.realDownlines ?? 0,    icon: <LeafIcon size={16} /> },
                  { label: 'Current Cycle Position',value: `${slotsData?.cyclePosition ?? 1} / 9`, icon: <RefreshIcon size={16} /> },
                  { label: 'Active Payout Slots',   value: slotsData?.slots?.length ?? 0,icon: <GemIcon size={16} /> },
                ].map(item => (
                  <div key={item.label} className="info-row">
                    <div className="info-row-label flex items-center gap-2">
                      <span className="t-text-3">{item.icon}</span> {item.label}
                    </div>
                    <div className="info-row-value font-bold font-mono text-brand-400">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payout slots */}
            <div className="card">
              <div className="section-title">Payout Slots</div>
              <p className="help-text mb-4">Members who earn ₹250 when someone joins under you:</p>
              {(slotsData?.slots?.length ?? 0) === 0 ? (
                <div className="text-center py-6 help-text">No slots yet</div>
              ) : (
                <div className="space-y-2">
                  {slotsData!.slots.map((slot: any) => (
                    <div key={slot.levelDiff}
                      className="flex items-center justify-between p-3 rounded-xl border"
                      style={{ background: 'var(--color-overlay)', borderColor: 'var(--color-border)' }}
                    >
                      <div>
                        <div className="font-mono font-bold t-text" style={{ fontSize: '0.9375rem' }}>{slot.memberId}</div>
                        <div className="help-text">{slot.name} · Level {slot.levelDiff}</div>
                      </div>
                      <div className="font-bold text-emerald-400 font-mono" style={{ fontSize: '1rem' }}>₹250</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </ReportSection>}

      {/* ── 6. Purchase Report ───────────────────────────────────────────── */}
      {activeSection === 'purchases' && <ReportSection title="Purchase Report" icon={<ShoppingCartIcon size={22} />}>
        {ordersLoading ? (
          <div className="skeleton h-40 rounded-2xl" />
        ) : (
          <div className="card">
            {/* Summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Orders',     value: allOrders.length,                          icon: <BoxIcon size={24} />,          color: 'text-brand-400' },
                { label: 'Total Spent',      value: `₹${totalOrderAmount.toLocaleString('en-IN')}`, icon: <CurrencyIcon size={24} />, color: 'text-amber-400' },
                { label: 'Delivered',        value: deliveredOrders,                           icon: <CheckCircleIcon size={24} />,  color: 'text-emerald-400' },
                { label: 'Pending/Other',    value: allOrders.length - deliveredOrders,        icon: <ClockIcon size={24} />,        color: 'text-orange-400' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl text-center"
                  style={{ background: 'var(--color-overlay)' }}>
                  <div className="flex justify-center t-text-3">{item.icon}</div>
                  <div className={`font-black font-mono mt-1 ${item.color}`} style={{ fontSize: '1.25rem' }}>{item.value}</div>
                  <div className="help-text mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Order list */}
            {allOrders.length === 0 ? (
              <div className="text-center py-8 help-text">No orders placed yet</div>
            ) : (
              <div>
                <div className="help-text font-semibold uppercase tracking-wide mb-3">Recent Orders</div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Total (₹)</th>
                        <th>Coupon Used</th>
                        <th>Cash Paid</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allOrders.slice(0, 10).map((order: any) => {
                        const statusColors: Record<string, string> = {
                          PLACED:     'badge-pending',
                          PROCESSING: 'badge-pending',
                          SHIPPED:    'badge-approved',
                          DELIVERED:  'badge-active',
                          CANCELLED:  'badge-rejected',
                        };
                        return (
                          <tr key={order.id}>
                            <td className="font-mono font-semibold t-text" style={{ fontSize: '0.875rem' }}>
                              #{order.id?.slice(-8).toUpperCase()}
                            </td>
                            <td className="help-text">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="font-bold t-text font-mono">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                            <td className="text-amber-500 font-semibold font-mono">₹{(order.couponUsed || 0).toLocaleString('en-IN')}</td>
                            <td className="font-semibold font-mono t-text-2">₹{(order.cashPaid || 0).toLocaleString('en-IN')}</td>
                            <td>
                              <span className={`badge ${statusColors[order.status] || 'badge-company'}`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </ReportSection>}

      {/* ── 7. Membership Status ─────────────────────────────────────────── */}
      {activeSection === 'membership' && <ReportSection title="Membership Status" icon={<UserIcon size={22} />}>
        {meLoading || joiningLoading ? (
          <div className="skeleton h-36 rounded-2xl" />
        ) : (
          <div className="card">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="help-text font-semibold uppercase tracking-wide mb-3">Member Details</div>
                <div className="space-y-0">
                  {[
                    { label: 'Full Name',    value: me?.name    || '—' },
                    { label: 'Member ID',    value: me?.memberId || '—', mono: true, highlight: true },
                    { label: 'Mobile',       value: me?.mobile  || '—' },
                    { label: 'Account Type', value: me?.type    || 'Regular Member' },
                    { label: 'Member Since', value: me?.createdAt ? new Date(me.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                  ].map(row => (
                    <div key={row.label} className="info-row">
                      <div className="info-row-label">{row.label}</div>
                      <div className={`info-row-value ${row.mono ? 'font-mono' : ''} ${row.highlight ? 'text-brand-400' : ''}`}>
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="help-text font-semibold uppercase tracking-wide mb-3">Joining Status</div>
                {joining ? (
                  <div className="space-y-0">
                    {[
                      {
                        label: 'Request Status',
                        value: joining.status,
                        badge: joining.status === 'APPROVED' ? 'badge-active'
                             : joining.status === 'PENDING'  ? 'badge-pending'
                             : 'badge-rejected',
                      },
                      { label: 'Joining Amount', value: `₹${(joining.amount || 1000).toLocaleString('en-IN')}` },
                      { label: 'Submitted On',   value: joining.createdAt ? new Date(joining.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                    ].map(row => (
                      <div key={row.label} className="info-row">
                        <div className="info-row-label">{row.label}</div>
                        <div className="info-row-value">
                          {row.badge
                            ? <span className={`badge ${row.badge}`}>{row.value}</span>
                            : <span className="font-bold t-text">{row.value}</span>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl help-text" style={{ background: 'var(--color-overlay)' }}>
                    No joining request submitted yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </ReportSection>}

      {/* Footer */}
      <div className="text-center pb-2">
        <p className="help-text">
          Report generated on {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

    </div>
  );
}
