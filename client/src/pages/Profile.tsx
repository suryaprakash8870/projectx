import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '../store/store';
import { useGetMeQuery, useUpdateMeMutation, useGetMyOrdersQuery, useChangePasswordMutation } from '../store/apiSlice';
import { DocumentIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/Icons';

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success('Copied!'));
}

export default function Profile() {
  const { memberId } = useSelector((s: RootState) => s.auth);
  const { data: user, isLoading, refetch } = useGetMeQuery();
  const { data: orders } = useGetMyOrdersQuery();
  const [update, { isLoading: updating }] = useUpdateMeMutation();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });

  function startEdit() {
    setForm({ name: user?.name || '', email: user?.email || '' });
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update(form).unwrap();
      toast.success('Profile updated!');
      setEditing(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Update failed');
    }
  }

  const [changePassword, { isLoading: isChangingPw }] = useChangePasswordMutation();
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '' });
  const [changingPw, setChangingPw] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    try {
      await changePassword(pwForm).unwrap();
      toast.success('Password successfully changed!');
      setChangingPw(false);
      setPwForm({ oldPassword: '', newPassword: '' });
    } catch (err: any) {
      toast.error(err?.data?.message || 'Password change failed');
    }
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold t-text">Profile</h1>
        <p className="t-text-3 text-sm mt-0.5">Manage your account details</p>
      </div>

      {/* Avatar + Member ID */}
      <div className="card text-center">
        <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-3xl font-black text-white mx-auto mb-4">
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <h2 className="text-xl font-bold t-text mb-1">{user?.name}</h2>
        <div className="member-id-chip mx-auto mb-2 justify-center">{memberId}</div>
        <div className="flex items-center justify-center gap-3 text-xs t-text-4">
          <span className={`badge ${user?.status === 'ACTIVE' ? 'badge-active' : 'badge-pending'}`}>
            {user?.status}
          </span>
          <span>Level {user?.level}</span>
          <span>Cycle {user?.cyclePosition ?? 1}/9</span>
          {user?.referrer && <span>Referred by: <span className="font-mono text-brand-400">{user.referrer.memberId}</span></span>}
        </div>
      </div>

      {/* Edit form */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="section-title mb-0">Personal Details</div>
          {!editing && (
            <button onClick={startEdit} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
        ) : editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="input-label">Full Name</label>
              <input className="input t-text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input className="input t-text" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={updating} className="btn-primary flex-1">
                {updating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Name',   value: user?.name },
              { label: 'Mobile', value: user?.mobile },
              { label: 'Email',  value: user?.email || '—' },
              { label: 'Joined', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—' },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                <span className="text-xs t-text-4 font-semibold uppercase tracking-wider">{item.label}</span>
                <span className="text-sm t-text-2">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Password Block */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="section-title mb-0">Security</div>
          {!changingPw && (
            <button onClick={() => setChangingPw(true)} className="btn-secondary text-xs py-1.5 px-3">Change Password</button>
          )}
        </div>

        {changingPw ? (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="input-label">Current Password</label>
              <input type="password" required className="input t-text" value={pwForm.oldPassword} onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))} />
            </div>
            <div>
              <label className="input-label">New Password</label>
              <input type="password" required className="input t-text" minLength={6} value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setChangingPw(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={isChangingPw} className="btn-primary flex-1">
                {isChangingPw ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm t-text-3">
            Keep your account secure by regularly updating your password.
          </div>
        )}
      </div>

      {/* Referral Links */}
      <div className="card space-y-3">
        <div className="section-title mb-0">Referral Links</div>
        <p className="text-xs t-text-4">Share the correct link so new members land exactly where you want them in your binary tree.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* LEFT */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)' }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#0ea5e9', color: '#fff' }}>
                <ChevronLeftIcon size={12} />
              </div>
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#0ea5e9' }}>Left</span>
            </div>
            <div className="text-[10px] font-mono truncate mb-3 px-2 py-1.5 rounded-lg" style={{ background: 'var(--color-surface)', color: 'var(--color-text-3)', border: '1px solid rgba(14,165,233,0.2)' }}>
              {`${window.location.origin}/?ref=${memberId}&leg=LEFT`}
            </div>
            <button
              onClick={() => copyToClipboard(`${window.location.origin}/?ref=${memberId}&leg=LEFT`)}
              className="w-full text-xs font-bold py-2 rounded-xl transition-colors"
              style={{ background: '#0ea5e9', color: '#ffffff', border: 'none' }}
            >
              Copy Left Link
            </button>
          </div>
          {/* RIGHT */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#8b5cf6', color: '#fff' }}>
                <ChevronRightIcon size={12} />
              </div>
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#8b5cf6' }}>Right</span>
            </div>
            <div className="text-[10px] font-mono truncate mb-3 px-2 py-1.5 rounded-lg" style={{ background: 'var(--color-surface)', color: 'var(--color-text-3)', border: '1px solid rgba(139,92,246,0.2)' }}>
              {`${window.location.origin}/?ref=${memberId}&leg=RIGHT`}
            </div>
            <button
              onClick={() => copyToClipboard(`${window.location.origin}/?ref=${memberId}&leg=RIGHT`)}
              className="w-full text-xs font-bold py-2 rounded-xl transition-colors"
              style={{ background: '#8b5cf6', color: '#ffffff', border: 'none' }}
            >
              Copy Right Link
            </button>
          </div>
        </div>
      </div>

      {/* Order history */}
      <div className="card">
        <div className="section-title">Order History</div>
        {!orders?.length ? (
          <div className="text-center py-8 t-text-4">
            <div className="flex justify-center mb-2"><DocumentIcon size={32} /></div>
            <p className="text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-4 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)] shadow-sm">
                <div>
                  <div className="text-sm font-semibold t-text-2">{o.product.name}</div>
                  <div className="text-xs t-text-4">Qty {o.quantity} · {new Date(o.placedAt).toLocaleDateString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold t-text">₹{o.totalAmount}</div>
                  <div className={`badge mt-1 ${o.status === 'DELIVERED' ? 'badge-approved' : 'badge-pending'}`}>{o.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
