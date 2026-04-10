import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useGetMyVendorQuery,
  useGetCategoriesQuery,
  useGetVendorListQuery,
  useRegisterVendorMutation,
  useCheckVendorSlotQuery,
} from '../store/apiSlice';

export default function Vendor() {
  const [tab, setTab] = useState<'browse' | 'my' | 'register'>('browse');
  const [catFilter, setCatFilter] = useState('');
  const [pinFilter, setPinFilter] = useState('');
  const [regForm, setRegForm] = useState({ businessName: '', categoryId: '', pinCode: '' });

  const { data: myVendor, isLoading: loadingMy } = useGetMyVendorQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: vendorData } = useGetVendorListQuery({
    categoryId: catFilter || undefined,
    pinCode: pinFilter || undefined,
  });
  const [registerVendor, { isLoading: registering }] = useRegisterVendorMutation();

  // Slot check (only when both fields are filled)
  const skipSlotCheck = !regForm.categoryId || !regForm.pinCode;
  const { data: slotCheck } = useCheckVendorSlotQuery(
    { categoryId: regForm.categoryId, pinCode: regForm.pinCode },
    { skip: skipSlotCheck }
  );

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regForm.businessName || !regForm.categoryId || !regForm.pinCode) {
      toast.error('All fields are required.');
      return;
    }
    try {
      await registerVendor(regForm).unwrap();
      toast.success('Vendor registration submitted! Awaiting admin approval.');
      setTab('my');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Registration failed.');
    }
  }

  const tabs = [
    { key: 'browse', label: 'Browse Vendors' },
    { key: 'my', label: 'My Vendor Profile' },
    { key: 'register', label: 'Become a Vendor' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold t-text">Marketplace</h1>
        <p className="text-sm t-text-3 mt-1 font-medium">
          One vendor per category per PIN code area. 10% platform fee on all sales.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--color-surface-2)] rounded-lg p-1.5 border border-[var(--color-border)] shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-bold transition-all ${
              tab === t.key
                ? 'bg-[var(--color-surface-3)] t-text-1 shadow-sm'
                : 't-text-4 hover:t-text-2'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Browse Vendors */}
      {tab === 'browse' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="flex-1 input"
            >
              <option value="">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              placeholder="PIN Code"
              value={pinFilter}
              onChange={(e) => setPinFilter(e.target.value)}
              className="w-32 input"
            />
          </div>

          {vendorData?.vendors?.length === 0 && (
            <div className="text-center py-12 t-text-4">
              <p className="text-lg font-bold">No vendors found</p>
              <p className="text-sm mt-1">Try adjusting your filters for categories or PIN codes</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {vendorData?.vendors?.map((v: any) => (
              <div key={v.id} className="card hover:border-brand-500/50 transition-all cursor-pointer group shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold t-text-1 group-hover:text-brand-600 transition-colors">{v.businessName}</h3>
                    <p className="text-xs t-text-3 font-medium mt-0.5">{v.category?.name}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-brand-500/10 text-brand-600 rounded-lg text-xs font-bold border border-brand-500/20">
                    PIN {v.pinCode}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] t-text-4 font-bold uppercase tracking-wider">
                  <span>Owner: {v.user?.name}</span>
                  <span className="opacity-50 font-mono">({v.user?.memberId})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Vendor Profile */}
      {tab === 'my' && (
        <div className="card shadow-sm">
          {loadingMy ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-[var(--color-surface-3)] rounded w-1/3"></div>
              <div className="h-4 bg-[var(--color-surface-3)] rounded w-1/2"></div>
            </div>
          ) : myVendor ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 border-b border-[var(--color-border)] pb-4 mb-4">
                <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-600 font-black text-xl border border-brand-500/20 shadow-sm">
                  {myVendor.businessName[0]}
                </div>
                <div>
                  <h3 className="font-bold t-text-1 text-lg">{myVendor.businessName}</h3>
                  <p className="text-sm t-text-3 font-medium">{myVendor.category?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-[10px] t-text-4 font-bold uppercase tracking-wider mb-1">PIN Code</p>
                  <p className="font-mono t-text-1 font-bold">{myVendor.pinCode}</p>
                </div>
                <div>
                  <p className="text-[10px] t-text-4 font-bold uppercase tracking-wider mb-1">Platform Fee</p>
                  <p className="font-mono t-text-1 font-bold">{myVendor.platformFee}%</p>
                </div>
                <div>
                  <p className="text-[10px] t-text-4 font-bold uppercase tracking-wider mb-1">Status</p>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                    myVendor.isApproved
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}>
                    {myVendor.isApproved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] t-text-4 font-bold uppercase tracking-wider mb-1">Active</p>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                    myVendor.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 border-red-500/20'
                  }`}>
                    {myVendor.isActive ? 'Yes' : 'Suspended'}
                  </span>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 text-xs text-blue-600 font-medium">
                <span className="font-bold">Revenue split on sales:</span> 18% GST + 30% Company + Remaining to You
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-lg">Not registered as a vendor</p>
              <p className="text-sm mt-1">Switch to the "Become a Vendor" tab to register</p>
            </div>
          )}
        </div>
      )}

      {/* Register as Vendor */}
      {tab === 'register' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {myVendor ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-lg">You are already registered as a vendor</p>
              <p className="text-sm mt-1">Check your profile in the "My Vendor Profile" tab</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <h3 className="font-semibold text-gray-900">Vendor Registration</h3>
              <p className="text-sm text-gray-500">
                Register as a vendor in one category for your PIN code area. Only one vendor is allowed per category per PIN.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  value={regForm.businessName}
                  onChange={(e) => setRegForm({ ...regForm, businessName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Your business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={regForm.categoryId}
                  onChange={(e) => setRegForm({ ...regForm, categoryId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                <input
                  value={regForm.pinCode}
                  onChange={(e) => setRegForm({ ...regForm, pinCode: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="6-digit PIN code"
                  maxLength={6}
                />
              </div>

              {/* Slot availability check */}
              {!skipSlotCheck && slotCheck && (
                <div className={`rounded-lg p-3 text-sm ${
                  slotCheck.available
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {slotCheck.available
                    ? 'This slot is available! You can register.'
                    : `This slot is taken by "${slotCheck.existingVendor?.businessName}".`}
                </div>
              )}

              <button
                type="submit"
                disabled={registering || (!skipSlotCheck && !slotCheck?.available)}
                className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registering ? 'Registering...' : 'Register as Vendor'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}