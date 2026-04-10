import { useState } from 'react';
import {
  TagIcon, ShoppingBagIcon, BanknotesIcon, ReceiptIcon,
  GiftIcon,
} from '../components/Icons';

// ── FAQ accordion item ─────────────────────────────────────────────────────────
function FAQItem({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl border overflow-hidden transition-colors"
      style={{ borderColor: open ? 'var(--color-border-2)' : 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left font-semibold t-text transition-colors hover:bg-[var(--color-overlay)]"
        style={{ fontSize: '0.9375rem', minHeight: '56px' }}
      >
        <span>{q}</span>
        <span className={`shrink-0 text-brand-400 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
          style={{ fontSize: '1.25rem', lineHeight: 1 }}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-4 t-text-3 leading-relaxed" style={{ fontSize: '0.9375rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Step badge ────────────────────────────────────────────────────────────────
function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-full bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 font-black shrink-0"
        style={{ fontSize: '1rem' }}>{n}</div>
      <div>
        <div className="font-bold t-text" style={{ fontSize: '0.9375rem' }}>{title}</div>
        <div className="help-text mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="page-heading">How Plan-I Works</h1>
        <p className="help-text mt-1">Everything you need to know about the network, payouts, and your wallets</p>
      </div>

      {/* ── ₹1,000 Breakdown ────────────────────────────────────────────── */}
      <div className="card border-l-[3px] border-l-[#0066ff]">
        <div className="section-title">Your ₹1,000 Joining Fee — Where It Goes</div>
        <p className="help-text mb-5">When you pay ₹1,000 to join, here is exactly how that amount is distributed:</p>

        <div className="space-y-1 mb-5">
          {[
            { label: 'Payouts to 3 receivers (₹250 × 3)', amount: '₹750', color: 'text-emerald-400', bar: 75, barColor: 'bg-emerald-500' },
            { label: 'GST (18%)',                          amount: '₹180', color: 'text-amber-400',   bar: 18, barColor: 'bg-amber-500' },
            { label: 'Company fee',                        amount: '₹70',  color: 'text-[var(--color-text-3)]', bar: 7, barColor: 'bg-brand-500' },
          ].map(item => (
            <div key={item.label} className="p-4 rounded-xl" style={{ background: 'var(--color-overlay)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium t-text-2" style={{ fontSize: '0.9375rem' }}>{item.label}</span>
                <span className={`font-mono font-black ${item.color}`} style={{ fontSize: '1rem' }}>{item.amount}</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'var(--color-border-2)' }}>
                <div className={`h-full rounded-full ${item.barColor}`} style={{ width: `${item.bar}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/20" style={{ background: 'rgba(16,185,129,0.05)' }}>
          <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1" style={{ fontSize: '0.9375rem' }}><GiftIcon size={18} /> You also receive ₹1,000 Coupon Balance</div>
          <p className="help-text">Immediately credited to your Coupon Wallet upon admin approval — use it to pay up to 50% of any product price in the Shop.</p>
        </div>
      </div>

      {/* ── Cycle System ─────────────────────────────────────────────────── */}
      <div className="card border-l-[3px] border-l-[#8b5cf6]">
        <div className="section-title">The 9-Level Cycle Payout System</div>
        <p className="help-text mb-5">
          Plan-I uses a rotating cycle to determine who receives the ₹250 payouts when a new member joins.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {[1,2,3,4,5,6,7,8,9].map(level => (
            <div key={level} className="text-center p-3 rounded-xl border"
              style={{ background: 'var(--color-overlay)', borderColor: 'var(--color-border)' }}>
              <div className="font-black text-purple-400 font-mono" style={{ fontSize: '1.5rem' }}>{level}</div>
              <div className="help-text mt-0.5">Level {level}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-purple-500/20" style={{ background: 'rgba(139,92,246,0.05)' }}>
            <div className="font-bold text-purple-400 mb-1" style={{ fontSize: '0.9375rem' }}>How receivers are chosen</div>
            <p className="help-text">Each payout goes to: <strong className="t-text">yourself + 2 upline members</strong>. The exact levels depend on your referrer's current cycle position (1–9), which rotates automatically after each join.</p>
          </div>
          <div className="p-4 rounded-xl border border-brand-500/20" style={{ background: 'var(--color-primary-dim)' }}>
            <div className="font-bold text-brand-400 mb-1" style={{ fontSize: '0.9375rem' }}>Why 9 levels?</div>
            <p className="help-text">9 levels ensure fair, rotating distribution. No single member always benefits — the cycle spreads earnings across all active members over time.</p>
          </div>
        </div>
      </div>

      {/* ── How to Join steps ─────────────────────────────────────────────── */}
      <div className="card border-l-[3px] border-l-[#ff8a00]">
        <div className="section-title">How to Join — Step by Step</div>
        <div className="space-y-5">
          <Step n={1} title="Pay ₹1,000 cash to the Plan-I admin"
            desc="This is a one-time joining fee. No recurring charges." />
          <Step n={2} title="Share your Member ID with the admin"
            desc="Your unique ID is shown on the Join page and your Dashboard." />
          <Step n={3} title="Submit your joining request in the app"
            desc="Go to the Join section and tap 'Submit Joining Request'." />
          <Step n={4} title="Wait for admin approval (usually within 24 hours)"
            desc="You'll see your status update to APPROVED on the Join page." />
          <Step n={5} title="₹1,000 coupon is credited to your wallet"
            desc="Use it to shop immediately. Your network position is now active." />
        </div>
      </div>

      {/* ── 4 Wallets explained ───────────────────────────────────────────── */}
      <div className="card">
        <div className="section-title">Your 4 Wallets Explained</div>
        <div className="space-y-3">
          {[
            { icon: <TagIcon size={26} />,         name: 'Coupon Wallet',   color: '#ff8a00', desc: 'Credited ₹1,000 on joining approval. Use to pay up to 50% of any product price at checkout.' },
            { icon: <ShoppingBagIcon size={26} />, name: 'Purchase Wallet', color: '#0066ff', desc: 'Earns 2.5% cashback on every order you place. Transfer this balance to your Income Wallet anytime.' },
            { icon: <BanknotesIcon size={26} />,   name: 'Income Wallet',   color: '#10b981', desc: 'Receives ₹250 referral payouts and transferred purchase cashback. This is your withdrawable balance.' },
            { icon: <ReceiptIcon size={26} />,     name: 'GST Wallet',      color: '#8b5cf6', desc: 'Tracks the 18% GST component of your joining fee. For record-keeping and compliance only.' },
          ].map(w => (
            <div key={w.name} className="flex gap-4 p-4 rounded-xl border items-start"
              style={{ background: 'var(--color-overlay)', borderColor: 'var(--color-border)' }}>
              <div style={{ color: w.color, marginTop: '2px', flexShrink: 0 }}>{w.icon}</div>
              <div>
                <div className="font-bold mb-0.5" style={{ fontSize: '0.9375rem', color: w.color }}>{w.name}</div>
                <div className="help-text">{w.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="section-title mb-4">Frequently Asked Questions</div>
        <div className="space-y-2">
          <FAQItem q="Do I need to pay again after joining?">
            No. The ₹1,000 is a one-time joining fee. There are no monthly or recurring charges.
          </FAQItem>
          <FAQItem q="When do I receive my ₹250 referral payout?">
            Automatically when one of your direct or indirect referrals submits and gets approved for joining. The payout goes to the correct 3 receivers based on the cycle system — no manual action needed.
          </FAQItem>
          <FAQItem q="How do I withdraw my Income Wallet balance?">
            Withdrawal requests are processed through the admin. Contact the Plan-I admin with your Member ID and Income Wallet balance to initiate a withdrawal.
          </FAQItem>
          <FAQItem q="Can I use my Coupon Wallet for the full product price?">
            No — coupons can only cover up to 50% of any product's price. The remaining 50% must be paid via other means at checkout.
          </FAQItem>
          <FAQItem q="What happens if my joining request is rejected?">
            The admin will add a note explaining the reason. You can re-submit after resolving the issue (usually a payment verification problem).
          </FAQItem>
          <FAQItem q="What is my cycle position?">
            Your cycle position (1–9) determines which upline members receive ₹250 when someone joins under your referral tree. It rotates automatically after each join event so every position is treated fairly.
          </FAQItem>
          <FAQItem q="How do I refer someone to Plan-I?">
            Share your Member ID or referral link. New members can register using your ID as the referrer. Once they join and are approved, the cycle payout is triggered automatically.
          </FAQItem>
          <FAQItem q="Is the ₹180 GST refundable?">
            No. GST is a government tax collected on the transaction. It is recorded in your GST Wallet for transparency but cannot be withdrawn or used for purchases.
          </FAQItem>
        </div>
      </div>

    </div>
  );
}
