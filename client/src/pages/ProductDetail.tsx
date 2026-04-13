import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGetProductDetailQuery, useGetWalletQuery, usePlaceOrderMutation } from '../store/apiSlice';
import {
  ShoppingCartIcon, ArrowLeftIcon, CheckCircleIcon,
  CurrencyIcon, StarIcon,
} from '../components/Icons';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useGetProductDetailQuery(id!, { skip: !id });
  const { data: wallet } = useGetWalletQuery();
  const [placeOrder, { isLoading: ordering }] = usePlaceOrderMutation();

  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-10 w-64 rounded-xl" />
            <div className="skeleton h-6 w-32 rounded-xl" />
            <div className="skeleton h-20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 t-text-4">
        <p className="text-lg mb-3">Product not found</p>
        <button onClick={() => navigate('/shop')} className="btn-primary">Back to Shop</button>
      </div>
    );
  }

  const total = product.price * qty;
  const couponUsed = Math.floor(total * product.couponSplitPct / 100);
  const cashNeeded = total - couponUsed;
  const cashback = Math.floor(total * 2.5) / 100;

  async function handleBuy() {
    if ((wallet?.couponBalance ?? 0) < couponUsed) { toast.error('Insufficient coupon balance'); return; }
    if ((wallet?.incomeBalance ?? 0) < cashNeeded)  { toast.error('Insufficient income balance'); return; }
    try {
      await placeOrder({ productId: product.id, quantity: qty }).unwrap();
      toast.success(`Order placed! Earned ₹${cashback.toFixed(2)} cashback`);
      navigate('/shop');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Order failed');
    }
  }

  // Static demo reviews for now
  const demoReviews = [
    { name: 'Ravi K.', rating: 5, comment: 'Excellent quality! Highly recommend this product.', date: '2 days ago' },
    { name: 'Priya S.', rating: 4, comment: 'Good value for money. Fast delivery.', date: '1 week ago' },
    { name: 'Arun M.', rating: 5, comment: 'Exactly as described. Very happy with the purchase.', date: '2 weeks ago' },
  ];
  const avgRating = 4.7;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back link */}
      <button
        onClick={() => navigate('/shop')}
        className="inline-flex items-center gap-2 text-sm font-semibold t-text-3 hover:t-text transition-colors"
      >
        <ArrowLeftIcon size={16} /> Back to Shop
      </button>

      {/* Product hero */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Image */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name}
              className="w-full h-80 object-contain p-6" />
          ) : (
            <div className="w-full h-80 flex flex-col items-center justify-center gap-3"
              style={{ background: `linear-gradient(135deg, hsl(${(product.name.charCodeAt(0) * 37) % 360}, 55%, 70%) 0%, hsl(${(product.name.charCodeAt(0) * 37 + 60) % 360}, 55%, 55%) 100%)` }}>
              <span style={{ fontSize: '5rem', fontWeight: 900, color: 'rgba(255,255,255,0.9)', lineHeight: 1, textTransform: 'uppercase' }}>
                {product.name[0]}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                {product.name}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          {product.category && (
            <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{ background: 'var(--color-brand-primary)', color: 'white', opacity: 0.8 }}>
              {product.category.name}
            </span>
          )}

          <h1 className="text-2xl font-black t-text">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <StarIcon key={n} size={16} filled={n <= Math.round(avgRating)} />
              ))}
            </div>
            <span className="text-sm font-bold t-text">{avgRating}</span>
            <span className="text-xs t-text-4">({demoReviews.length} reviews)</span>
          </div>

          <div className="font-mono text-3xl font-black t-text">₹{product.price.toLocaleString('en-IN')}</div>

          {/* Cashback badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CurrencyIcon size={14} />
            <span className="text-sm font-bold text-emerald-500">2.5% cashback (₹{cashback.toFixed(2)} on this order)</span>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold t-text-3">Qty:</label>
            <div className="flex items-center gap-0 rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center font-bold t-text-3 hover:bg-[var(--color-surface-2)] transition-colors">
                -
              </button>
              <div className="w-10 h-10 flex items-center justify-center font-mono font-bold t-text" style={{ background: 'var(--color-surface-2)' }}>
                {qty}
              </div>
              <button onClick={() => setQty(q => q + 1)}
                className="w-10 h-10 flex items-center justify-center font-bold t-text-3 hover:bg-[var(--color-surface-2)] transition-colors">
                +
              </button>
            </div>
            <span className="font-mono font-bold t-text text-lg">₹{total.toLocaleString('en-IN')}</span>
          </div>

          {/* Payment breakdown */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
            <div className="text-xs font-bold t-text-4 uppercase tracking-wider mb-2">Payment Breakdown</div>
            <div className="flex justify-between text-sm">
              <span className="t-text-3">Coupon ({product.couponSplitPct}%)</span>
              <span className="font-mono font-semibold text-amber-500">₹{couponUsed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="t-text-3">Income wallet</span>
              <span className="font-mono font-semibold text-blue-500">₹{cashNeeded}</span>
            </div>
            <div className="flex justify-between text-sm pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
              <span className="font-bold t-text">Total</span>
              <span className="font-mono font-bold t-text">₹{total}</span>
            </div>
          </div>

          {/* Buy button */}
          <button onClick={handleBuy} disabled={ordering}
            className="w-full btn-primary py-3.5 text-base font-bold rounded-xl flex items-center justify-center gap-2">
            <ShoppingCartIcon size={18} />
            {ordering ? 'Placing Order...' : `Buy Now — ₹${total.toLocaleString('en-IN')}`}
          </button>

          {/* Highlights */}
          <div className="flex flex-wrap gap-3 text-xs">
            {['Free delivery', 'Genuine product', '100% secure payment'].map(text => (
              <span key={text} className="inline-flex items-center gap-1 t-text-4">
                <CheckCircleIcon size={12} /> {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: Description / Reviews */}
      <div className="card">
        <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          {(['description', 'reviews'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 px-4 rounded-lg font-bold capitalize transition-all text-sm"
              style={{
                background: activeTab === tab ? 'var(--color-surface)' : 'transparent',
                color: activeTab === tab ? 'var(--color-text)' : 'var(--color-text-4)',
                boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              {tab === 'reviews' ? `Reviews (${demoReviews.length})` : 'Description'}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div className="animate-fade-in space-y-4">
            <p className="text-sm t-text-3 leading-relaxed">
              {product.description || 'No description available for this product.'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Category', value: product.category?.name || 'Uncategorized' },
                { label: 'Price', value: `₹${product.price}` },
                { label: 'Coupon Split', value: `${product.couponSplitPct}% coupon + ${100 - product.couponSplitPct}% income` },
                { label: 'Cashback', value: '2.5% on total purchase' },
              ].map(spec => (
                <div key={spec.label} className="p-3 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  <div className="text-[10px] font-bold t-text-4 uppercase tracking-wider">{spec.label}</div>
                  <div className="text-sm font-semibold t-text mt-0.5">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="animate-fade-in space-y-4">
            {/* Rating summary */}
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <div className="text-center">
                <div className="text-3xl font-black t-text">{avgRating}</div>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <StarIcon key={n} size={14} filled={n <= Math.round(avgRating)} />
                  ))}
                </div>
                <div className="text-xs t-text-4 mt-1">{demoReviews.length} reviews</div>
              </div>
            </div>

            {/* Reviews list */}
            {demoReviews.map((r, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-sm font-bold text-brand-500">
                      {r.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold t-text text-sm">{r.name}</div>
                      <div className="text-xs t-text-4">{r.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <StarIcon key={n} size={12} filled={n <= r.rating} />
                    ))}
                  </div>
                </div>
                <p className="text-sm t-text-3">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
