import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGetProductsQuery, useGetCategoriesQuery, useGetWalletQuery, useGetMyOrdersQuery, usePlaceOrderMutation } from '../store/apiSlice';
import { MagnifyingGlassIcon, CurrencyIcon, ShoppingCartIcon, XCircleIcon, CheckCircleIcon, ClockIcon, ArrowRightIcon } from '../components/Icons';

interface CartItem { productId: string; name: string; price: number; qty: number; couponSplitPct: number }

export default function Shop() {
  const navigate = useNavigate();
  const { data: products, isLoading } = useGetProductsQuery();
  const { data: categories, isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { data: wallet } = useGetWalletQuery();
  const { data: orders } = useGetMyOrdersQuery();
  const [placeOrder, { isLoading: ordering }] = usePlaceOrderMutation();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = selectedCategory
    ? products?.filter((p: any) => p.categoryId === selectedCategory)
    : products;

  function addToCart(p: any) {
    setCart(c => {
      const existing = c.find(i => i.productId === p.id);
      if (existing) return c.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { productId: p.id, name: p.name, price: p.price, qty: 1, couponSplitPct: p.couponSplitPct }];
    });
    toast.success(`${p.name} added to cart`);
  }

  function removeFromCart(id: string) { setCart(c => c.filter(i => i.productId !== id)); }
  function totalCartCount() { return cart.reduce((s, i) => s + i.qty, 0); }
  function calculateCashback(amount: number) { return Math.floor(amount * 2.5) / 100; }
  function totalCartCashback() { return cart.reduce((t, i) => t + calculateCashback(i.price * i.qty), 0); }

  async function handleOrder(item: CartItem) {
    const couponNeeded = Math.floor(item.price * item.qty * item.couponSplitPct / 100);
    const cashNeeded = item.price * item.qty - couponNeeded;
    if ((wallet?.couponBalance ?? 0) < couponNeeded) { toast.error('Insufficient coupon balance'); return; }
    if ((wallet?.incomeBalance ?? 0) < cashNeeded) { toast.error('Insufficient income balance'); return; }
    try {
      await placeOrder({ productId: item.productId, quantity: item.qty }).unwrap();
      toast.success(`Order placed for ${item.name}! Earned ₹${calculateCashback(item.price * item.qty).toFixed(2)} cashback`);
      removeFromCart(item.productId);
      setCartOpen(false);
    } catch (err: any) { toast.error(err?.data?.message || 'Order failed'); }
  }

  const recentOrders = (orders || []).slice(0, 4);
  const statusColors: Record<string, string> = {
    PLACED: '#f59e0b', PROCESSING: '#3b82f6', SHIPPED: '#8b5cf6', DELIVERED: '#10b981', CANCELLED: '#ef4444',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold t-text">Shop</h1>
          <p className="t-text-3 text-sm mt-0.5">Use your coupon + income to purchase</p>
        </div>
        <button onClick={() => setCartOpen(true)} className="btn-secondary relative">
          <ShoppingCartIcon size={16} /> Cart
          {totalCartCount() > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-brand-600 rounded-full text-xs text-white flex items-center justify-center font-bold">
              {totalCartCount()}
            </span>
          )}
        </button>
      </div>

      {/* Wallet banner */}
      {wallet && (
        <div className="card flex flex-col gap-4">
          <div className="section-title">Available Balance</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-amber-600 font-bold uppercase tracking-wider">Coupon</div>
              <div className="font-mono text-xl font-black t-text-1">₹{wallet.couponBalance.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Purchase</div>
              <div className="font-mono text-xl font-black t-text-1">₹{wallet.purchaseBalance?.toLocaleString('en-IN') ?? '0'}</div>
            </div>
            <div>
              <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">Income</div>
              <div className="font-mono text-xl font-black t-text-1">₹{wallet.incomeBalance.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="text-xs t-text-4">Earn 2.5% cashback on every purchase</div>
        </div>
      )}

      {/* Recent Purchases & Tracking */}
      {recentOrders.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="section-title mb-0">Recent Purchases</div>
            <button onClick={() => navigate('/reports?section=purchases')} className="text-xs font-semibold text-brand-500 hover:text-brand-400 transition-colors flex items-center gap-1">
              View All <ArrowRightIcon size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {recentOrders.map((o: any) => (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                <div className="w-11 h-11 rounded-lg shrink-0 flex items-center justify-center overflow-hidden" style={{ background: 'var(--color-overlay)' }}>
                  {o.product?.imageUrl ? (
                    <img src={o.product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-lg font-bold t-text-4">{o.product?.name?.[0] || '?'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold t-text text-sm truncate">{o.product?.name}</div>
                  <div className="text-xs t-text-4">Qty {o.quantity} · {new Date(o.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold t-text text-sm">₹{o.totalAmount}</div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${statusColors[o.status] || '#94a3b8'}15`, color: statusColors[o.status] || '#94a3b8', border: `1px solid ${statusColors[o.status] || '#94a3b8'}30` }}>
                    {o.status === 'DELIVERED' ? <CheckCircleIcon size={10} /> : <ClockIcon size={10} />}
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter tabs */}
      {categoriesLoading ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-8 w-24 rounded-lg" />)}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-[var(--color-surface-2)] t-text-3 hover:bg-[var(--color-surface-3)] border border-[var(--color-border)]'
            }`}>
            All Products
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-[var(--color-surface-2)] t-text-3 hover:bg-[var(--color-surface-3)] border border-[var(--color-border)]'
              }`}>
              {cat.name}
            </button>
          ))}
        </div>
      ) : null}

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : filteredProducts && filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p: any) => {
            const inCart = cart.find(i => i.productId === p.id);
            return (
              <div key={p.id}
                className="rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                onClick={() => navigate(`/shop/${p.id}`)}
              >
                <div className="relative w-full overflow-hidden" style={{ height: '200px', background: 'var(--color-surface-2)' }}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                      style={{ background: `linear-gradient(135deg, hsl(${(p.name.charCodeAt(0) * 37) % 360}, 55%, 70%) 0%, hsl(${(p.name.charCodeAt(0) * 37 + 60) % 360}, 55%, 55%) 100%)` }}>
                      <span style={{ fontSize: '3.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.9)', lineHeight: 1, textTransform: 'uppercase' }}>{p.name[0]}</span>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>{p.name.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">2.5% cashback</div>
                </div>
                <div className="flex flex-col flex-1 p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold t-text text-base leading-tight">{p.name}</h3>
                    <span className="font-black font-mono t-text shrink-0 text-base">₹{p.price}</span>
                  </div>
                  {p.description && <p className="text-xs t-text-4 mb-4 line-clamp-2 leading-relaxed">{p.description}</p>}
                  <div className="mt-auto">
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                      className="w-full btn-primary py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
                    >
                      <ShoppingCartIcon size={14} />
                      {inCart ? `In Cart (${inCart.qty})` : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 t-text-4">
          <div className="flex justify-center mb-3"><MagnifyingGlassIcon size={32} /></div>
          <p>No products found in this category</p>
        </div>
      )}

      {/* Cart popup modal — portaled to body so fixed positioning works */}
      {cartOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div
            className="relative w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="font-bold t-text text-lg flex items-center gap-2">
                <ShoppingCartIcon size={18} /> Cart ({totalCartCount()})
              </h2>
              <button onClick={() => setCartOpen(false)} className="t-text-4 hover:t-text transition-colors">
                <XCircleIcon size={22} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 t-text-4" style={{ background: 'var(--color-surface-2)' }}>
                    <ShoppingCartIcon size={32} />
                  </div>
                  <div className="font-bold t-text text-lg mb-1">Your cart is empty</div>
                  <p className="text-sm t-text-4 mb-5 max-w-[220px]">Browse our products and add items to get started.</p>
                  <button onClick={() => setCartOpen(false)} className="btn-primary px-5 py-2 text-sm inline-flex items-center gap-2">
                    <ArrowRightIcon size={14} /> Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => {
                    const coupon = Math.floor(item.price * item.qty * item.couponSplitPct / 100);
                    const cash = item.price * item.qty - coupon;
                    const itemCashback = calculateCashback(item.price * item.qty);
                    return (
                      <div key={item.productId} className="rounded-2xl p-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold t-text text-sm">{item.name}</div>
                            <div className="text-xs t-text-4 mt-1">Qty: {item.qty} · ₹{item.price} each</div>
                            <div className="text-xs mt-2 flex items-center gap-2">
                              <span className="text-amber-500 font-medium">Coupon: ₹{coupon}</span>
                              <span className="t-text-5">+</span>
                              <span className="text-blue-500 font-medium">Income: ₹{cash}</span>
                            </div>
                            <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-0.5">
                              <CurrencyIcon size={10} /> Cashback: ₹{itemCashback.toFixed(2)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2">
                            <div className="font-mono font-bold t-text">₹{item.price * item.qty}</div>
                            <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-300 text-xs font-medium">Remove</button>
                          </div>
                        </div>
                        <button onClick={() => handleOrder(item)} disabled={ordering}
                          className="btn-primary w-full mt-3 text-sm py-2.5 font-semibold rounded-xl">
                          {ordering ? 'Ordering...' : `Buy Now — ₹${item.price * item.qty}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="px-5 py-3 shrink-0" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm t-text-3 font-medium">Total Cashback</span>
                  <span className="text-sm font-bold text-emerald-500">₹{totalCartCashback().toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
