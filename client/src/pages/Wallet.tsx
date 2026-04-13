import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { useGetWalletQuery, useGetTransactionsQuery, useTransferPurchaseToIncomeMutation } from '../store/apiSlice';
import {
  InboxIcon, ArrowDownIcon, ArrowUpIcon,
  TagIcon, ShoppingBagIcon, BanknotesIcon, ReceiptIcon,
} from '../components/Icons';

function WalletPagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void; }) {
  const pages: (number | '…')[] = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }
  return (
    <div className="table-footer mt-2">
      <span className="text-xs t-text-4 font-medium">Page {page} of {totalPages}</span>
      <div className="flex items-center gap-1">
        <button className="table-page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹ Prev</button>
        {pages.map((p, i) =>
          p === '…' ? <span key={`e${i}`} className="table-page-btn" style={{ cursor: 'default' }}>…</span>
          : <button key={p} className={`table-page-btn${p === page ? ' active' : ''}`} onClick={() => onPageChange(p as number)}>{p}</button>
        )}
        <button className="table-page-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next ›</button>
      </div>
    </div>
  );
}

type FieldFilter = 'ALL' | 'COUPON' | 'PURCHASE' | 'INCOME' | 'GST';
type TypeFilter  = 'ALL' | 'CREDIT' | 'DEBIT';

// ── Wallet card ───────────────────────────────────────────────────────────────
function WalletBalanceCard({
  label, amount, description, accentClass, icon, action,
}: {
  label: string;
  amount: number;
  description: string;
  accentClass: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={`wallet-card ${accentClass}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="t-text-3 mt-0.5">{icon}</div>
        <div className="flex-1">
          <div className="section-title mb-0">{label}</div>
          <div className="help-text">{description}</div>
        </div>
      </div>
      {/* Very large amount — 35+ users can read it easily */}
      <div className="amount-display-lg my-3">
        ₹{amount.toLocaleString('en-IN')}
      </div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────────
function TxRow({ tx }: { tx: any }) {
  const isCredit = tx.type === 'CREDIT';
  const fieldColors: Record<string, { bg: string; text: string }> = {
    COUPON:   { bg: 'bg-amber-500/10',   text: 'text-amber-600' },
    PURCHASE: { bg: 'bg-blue-500/10',    text: 'text-blue-600' },
    INCOME:   { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
    GST:      { bg: 'bg-purple-500/10',  text: 'text-purple-600' },
  };
  const fc = fieldColors[tx.field] || { bg: 'bg-slate-100', text: 'text-slate-600' };

  return (
    <div
      className="flex items-center gap-3 px-3 py-4 hover:bg-[var(--color-overlay)] rounded-xl transition-colors"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      {/* Direction icon — large, clear */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
        isCredit
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
          : 'bg-red-500/10 border-red-500/20 text-red-500'
      }`}>
        {isCredit ? <ArrowDownIcon size={22} /> : <ArrowUpIcon size={22} />}
      </div>

      <div className="flex-1 min-w-0">
        {/* Note — prominent */}
        <div className="font-semibold t-text truncate" style={{ fontSize: '0.9375rem' }}>
          {tx.note || 'Transaction'}
        </div>
        <div className="flex items-center flex-wrap gap-2 mt-1">
          <span className={`px-2 py-0.5 rounded font-bold uppercase ${fc.bg} ${fc.text}`}
            style={{ fontSize: '0.75rem' }}>
            {tx.field}
          </span>
          <span className="help-text">
            {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Amount — large, clearly colored */}
      <div className={`font-mono font-bold shrink-0 ${isCredit ? 'text-emerald-500' : 'text-red-500'}`}
        style={{ fontSize: '1.0625rem' }}>
        {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
      </div>
    </div>
  );
}

// ── Filter button ─────────────────────────────────────────────────────────────
function FilterBtn({
  active, onClick, children, activeClass,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl font-semibold transition-all border ${
        active
          ? (activeClass || 'bg-brand-500/20 text-brand-400 border-brand-500/30')
          : 't-text-3 border-transparent hover:bg-[var(--color-overlay)]'
      }`}
      style={{ fontSize: '0.875rem', minHeight: '40px' }}
    >
      {children}
    </button>
  );
}

// ── Transfer modal ────────────────────────────────────────────────────────────
function TransferModal({
  onClose, purchaseBalance,
}: {
  onClose: () => void; purchaseBalance: number;
}) {
  const [amount, setAmount] = useState('');
  const [transferPurchaseToIncome, { isLoading }] = useTransferPurchaseToIncomeMutation();

  const handleTransfer = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (val > purchaseBalance) {
      toast.error('Insufficient purchase balance');
      return;
    }
    try {
      await transferPurchaseToIncome({ amount: val }).unwrap();
      toast.success(`₹${val.toLocaleString('en-IN')} transferred to Income Wallet`);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Transfer failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl border max-w-sm w-full"
        style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border-2)' }}
      >
        <div className="p-6">
          <h2 className="font-bold t-text mb-1" style={{ fontSize: '1.375rem' }}>Transfer to Income</h2>
          <p className="help-text mb-5">Move your cashback to your Income Wallet for withdrawal.</p>

          {/* Balance info */}
          <div className="p-4 rounded-xl mb-4" style={{ background: 'var(--color-overlay)' }}>
            <div className="help-text font-semibold mb-1">Available Purchase Balance</div>
            <div className="font-bold font-mono text-blue-400" style={{ fontSize: '1.5rem' }}>
              ₹{purchaseBalance.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Amount input */}
          <div className="mb-5">
            <label className="input-label">Amount to Transfer (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="input"
              min="1"
              max={purchaseBalance}
            />
            {/* Quick fill buttons */}
            <div className="flex gap-2 mt-2">
              {[25, 50, 100].map(pct => {
                const val = Math.floor(purchaseBalance * pct / 100);
                return val > 0 ? (
                  <button
                    key={pct}
                    onClick={() => setAmount(String(val))}
                    className="flex-1 py-1.5 rounded-lg font-semibold t-text-3 hover:t-text transition-colors border"
                    style={{ background: 'var(--color-overlay)', borderColor: 'var(--color-border)', fontSize: '0.8125rem' }}
                  >
                    {pct}% (₹{val.toLocaleString('en-IN')})
                  </button>
                ) : null;
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              disabled={isLoading}
              className="btn btn-primary flex-1"
            >
              {isLoading ? 'Transferring…' : 'Transfer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Wallet page ──────────────────────────────────────────────────────────
export default function Wallet() {
  const [page, setPage]       = useState(1);
  const [field, setField]     = useState<FieldFilter>('ALL');
  const [type,  setType]      = useState<TypeFilter>('ALL');
  const [showModal, setShowModal] = useState(false);
  const limit = 10;
  const isAdmin = useSelector((s: RootState) => s.auth.role) === 'ADMIN';

  const { data: wallet, isLoading: walletLoading } = useGetWalletQuery();
  const { data: txData, isLoading: txLoading }     = useGetTransactionsQuery({ page, limit });

  const allTx: any[] = txData?.transactions || [];
  const filtered = allTx.filter(tx =>
    (field === 'ALL' || tx.field === field) &&
    (type  === 'ALL' || tx.type  === type)
  );

  const fieldBtns: { f: FieldFilter; label: string; activeClass: string }[] = [
    { f: 'ALL',      label: 'All',      activeClass: 'bg-brand-500/20 text-brand-400 border-brand-500/30' },
    { f: 'COUPON',   label: 'Coupon',   activeClass: 'bg-amber-500/20 text-amber-500 border-amber-500/30' },
    { f: 'PURCHASE', label: 'Purchase', activeClass: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
    { f: 'INCOME',   label: 'Income',   activeClass: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' },
    ...(isAdmin ? [{ f: 'GST' as FieldFilter, label: 'GST', activeClass: 'bg-purple-500/20 text-purple-500 border-purple-500/30' }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="page-heading">My Wallets</h1>
        <p className="help-text mt-1">Manage your Coupon, Purchase, and Income wallets</p>
      </div>

      {/* ── 4 Wallet cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {walletLoading ? (
          <>
            <div className="skeleton h-40 rounded-2xl" />
            <div className="skeleton h-40 rounded-2xl" />
            <div className="skeleton h-40 rounded-2xl" />
            <div className="skeleton h-40 rounded-2xl" />
          </>
        ) : (
          <>
            <WalletBalanceCard
              label="Coupon Wallet"
              amount={wallet?.couponBalance ?? 0}
              description="Used to pay up to 50% of product price"
              accentClass="border-l-[3px] border-l-[#ff8a00]"
              icon={<TagIcon size={28} />}
            />
            <WalletBalanceCard
              label="Purchase Wallet"
              amount={wallet?.purchaseBalance ?? 0}
              description="Cashback 2.5% from your orders"
              accentClass="border-l-[3px] border-l-[#0066ff]"
              icon={<ShoppingBagIcon size={28} />}
              action={
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full btn btn-primary"
                >
                  Transfer to Income Wallet
                </button>
              }
            />
            <WalletBalanceCard
              label="Income Wallet"
              amount={wallet?.incomeBalance ?? 0}
              description="Referral earnings — can be withdrawn"
              accentClass="border-l-[3px] border-l-[#10b981]"
              icon={<BanknotesIcon size={28} />}
            />
            {/* GTC Wallet — Plan 1 subscription reward */}
            <div className="wallet-card border-l-[3px] border-l-[#f59e0b]">
              <div className="flex items-start gap-3 mb-3">
                <div className="t-text-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="w-7 h-7" style={{ color: '#f59e0b' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="section-title mb-0">GTC Wallet</div>
                  <div className="help-text">Global Token Credits — earned from Plan 1 subscription</div>
                </div>
              </div>
              <div className="amount-display-lg my-3" style={{ color: '#f59e0b' }}>
                {(wallet?.gtcBalance ?? 0).toLocaleString('en-IN')} GTC
              </div>
              {wallet?.gtcAddress && (
                <div className="mt-2 p-2 rounded-lg text-xs font-mono break-all t-text-4"
                  style={{ background: 'var(--color-overlay)', border: '1px solid var(--color-border)' }}>
                  {wallet.gtcAddress}
                </div>
              )}
              <div className="mt-2 px-2 py-1 rounded-lg text-xs font-medium text-center"
                style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                Marketplace usage — Coming Soon
              </div>
            </div>
            {isAdmin && (
              <WalletBalanceCard
                label="GST Wallet"
                amount={wallet?.gstBalance ?? 0}
                description="Goods & Services Tax — tracking only"
                accentClass="border-l-[3px] border-l-[#8b5cf6]"
                icon={<ReceiptIcon size={28} />}
              />
            )}
          </>
        )}
      </div>

      {/* Transfer modal */}
      {showModal && (
        <TransferModal
          onClose={() => setShowModal(false)}
          purchaseBalance={wallet?.purchaseBalance ?? 0}
        />
      )}

      {/* ── Transaction History ──────────────────────────────────────────── */}
      <div className="card">

        {/* Header + filters */}
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex items-center justify-between">
            <div className="section-title mb-0">Transaction History</div>
            {txData && (
              <span className="help-text font-semibold">
                {filtered.length} record{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Wallet filter */}
          <div>
            <div className="help-text font-semibold mb-2">Filter by Wallet</div>
            <div className="flex flex-wrap gap-2">
              {fieldBtns.map(({ f, label, activeClass }) => (
                <FilterBtn
                  key={f}
                  active={field === f}
                  onClick={() => { setField(f); setPage(1); }}
                  activeClass={activeClass}
                >
                  {label}
                </FilterBtn>
              ))}
            </div>
          </div>

          {/* Type filter */}
          <div>
            <div className="help-text font-semibold mb-2">Filter by Type</div>
            <div className="flex gap-2">
              <FilterBtn active={type === 'ALL'}    onClick={() => { setType('ALL');    setPage(1); }}>All</FilterBtn>
              <FilterBtn active={type === 'CREDIT'} onClick={() => { setType('CREDIT'); setPage(1); }}
                activeClass="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                ▲ Received (Credit)
              </FilterBtn>
              <FilterBtn active={type === 'DEBIT'}  onClick={() => { setType('DEBIT');  setPage(1); }}
                activeClass="bg-red-500/20 text-red-500 border-red-500/30">
                ▼ Spent (Debit)
              </FilterBtn>
            </div>
          </div>
        </div>

        {/* Transactions */}
        {txLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14" style={{ color: 'var(--color-text-4)' }}>
            <InboxIcon size={44} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold" style={{ fontSize: '1rem' }}>No transactions found</p>
            <p className="help-text mt-1">Try changing the filters above</p>
          </div>
        ) : (
          <div className="-mx-2">
            {filtered.map((tx: any) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        )}

        {txData && txData.totalPages > 1 && (
          <WalletPagination page={page} totalPages={txData.totalPages} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
