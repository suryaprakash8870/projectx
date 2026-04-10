import { useState } from 'react';
import toast from 'react-hot-toast';
import { useGetProductsQuery, useGetCategoriesQuery, useGetWalletQuery, usePlaceOrderMutation } from '../store/apiSlice';
import { MagnifyingGlassIcon, LeafIcon, CurrencyIcon, ShoppingCartIcon, XCircleIcon } from '../components/Icons';

interface CartItem { productId: string; name: string; price: number; qty: number; couponSplitPct: number }

export default function Shop() {
  const { data: products, isLoading } = useGetProductsQuery();
  const { data: categories, isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { data: wallet } = useGetWalletQuery();
  const [placeOrder, { isLoading: ordering }] = usePlaceOrderMutation();

  const [cart, setCart]           = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]   = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [, setCheckout] = useState<CartItem | null>(null);

  // Filter products by selected category
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

  function removeFromCart(id: string) {
    setCart(c => c.filter(i => i.productId !== id));
  }

  function totalCartCount() { return cart.reduce((s, i) => s + i.qty, 0); }

  function calculateCashback(amount: number): number {
    return Math.floor(amount * 2.5) / 100;
  }

  function totalCartCashback(): number {
    return cart.reduce((total, item) => {
      return total + calculateCashback(item.price * item.qty);
    }, 0);
  }

  async function handleOrder(item: CartItem) {
    const couponNeeded = Math.floor(item.price * item.qty * item.couponSplitPct / 100);
    const cashNeeded   = item.price * item.qty - couponNeeded;
    if ((wallet?.couponBalance ?? 0) < couponNeeded) { toast.error('Insufficient coupon balance'); return; }
    if ((wallet?.incomeBalance ?? 0) < cashNeeded)   { toast.error('Insufficient income balance'); return; }

    try {
      await placeOrder({ productId: item.productId, quantity: item.qty }).unwrap();
      const cashbackEarned = calculateCashback(item.price * item.qty);
      toast.success(`Order placed for ${item.name}! Earned ₹${cashbackEarned.toFixed(2)} cashback`);
      removeFromCart(item.productId);
      setCheckout(null);
      setCartOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Order failed');
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold t-text">Shop</h1>
          <p className="t-text-3 text-sm mt-0.5">Use your coupon + income to purchase</p>
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className="btn-secondary relative"
        >
          <ShoppingCartIcon size={16} /> Cart
          {totalCartCount() > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-brand-600 rounded-full text-xs text-white flex items-center justify-center font-bold">
              {totalCartCount()}
            </span>
          )}
        </button>
      </div>

      {/* Wallet banner - All 4 balances */}
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
            <div>
              <div className="text-xs text-purple-600 font-bold uppercase tracking-wider">GST</div>
              <div className="font-mono text-xl font-black t-text-1">₹{wallet.gstBalance?.toLocaleString('en-IN') ?? '0'}</div>
            </div>
          </div>
          <div className="text-xs t-text-4">Earn 2.5% cashback on every purchase</div>
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
            }`}
          >
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
              }`}
            >
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
            const coupon = Math.floor(p.price * p.couponSplitPct / 100);
            const cash   = p.price - coupon;
            const cashback = calculateCashback(p.price);
            const inCart = cart.find(i => i.productId === p.id);
            return (
              <div key={p.id} className="card hover:border-brand-500/50 transition-all duration-300 flex flex-col group">
                {/* Product image placeholder */}
                <div className="w-full h-40 rounded-xl mb-4 flex items-center justify-center border group-hover:scale-[1.02] transition-transform" style={{ background: 'var(--color-overlay)', borderColor: 'var(--color-border)' }}>
                  <LeafIcon size={48} className="text-brand-600/40" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold t-text mb-1">{p.name}</h3>
                  {p.description && <p className="text-xs t-text-4 mb-3">{p.description}</p>}

                  {/* Cashback badge */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 mb-3 inline-block">
                    <div className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CurrencyIcon size={12} /> 2.5% Cashback</div>
                    <div className="text-[10px] text-emerald-700/70 font-medium">₹{cashback.toFixed(2)} earned back</div>
                  </div>

                  {/* Cost breakdown */}
                  <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-2.5 py-2 mb-3">
                    <div className="text-[10px] font-bold t-text-4 uppercase tracking-wider mb-2">Payment Split</div>
                    <div className="flex items-center gap-2 text-xs mb-1.5">
                      <span className="w-2 h-2 bg-amber-500 rounded-full" />
                      <span className="t-text-2 font-medium">Coupon: ₹{coupon}</span>
                      <span className="t-text-5 ml-auto text-[10px]">({p.couponSplitPct}%)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="t-text-2 font-medium">Income: ₹{cash}</span>
                      <span className="t-text-5 ml-auto text-[10px]">({100 - p.couponSplitPct}%)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold t-text font-mono text-lg">₹{p.price}</span>
                  <button
                    onClick={() => { addToCart(p); setCheckout({ productId: p.id, name: p.name, price: p.price, qty: inCart ? inCart.qty + 1 : 1, couponSplitPct: p.couponSplitPct }); }}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    {inCart ? `In Cart (${inCart.qty})` : '+ Add to Cart'}
                  </button>
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

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-sm bg-[var(--color-bg)] border-l border-[var(--color-border)] h-full flex flex-col shadow-2xl animate-slide-left">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="font-bold t-text-1 text-lg">Cart ({totalCartCount()})</h2>
              <button onClick={() => setCartOpen(false)} className="t-text-4 hover:t-text-1 p-1 transition-colors"><XCircleIcon size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 t-text-4">
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map(item => {
                  const coupon = Math.floor(item.price * item.qty * item.couponSplitPct / 100);
                  const cash   = item.price * item.qty - coupon;
                  const itemCashback = calculateCashback(item.price * item.qty);
                  return (
                    <div key={item.productId} className="card py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold t-text text-sm">{item.name}</div>
                          <div className="text-xs t-text-4 mt-1">Qty: {item.qty}</div>
                          <div className="text-xs mt-1 font-medium">
                            <span className="text-amber-600">Coupon: ₹{coupon}</span>
                            <span className="t-text-5 mx-1">+</span>
                            <span className="text-emerald-600">Income: ₹{cash}</span>
                          </div>
                          <div className="mt-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded inline-block">
                            <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-1 uppercase tracking-wider"><CurrencyIcon size={10} /> Cashback: ₹{itemCashback.toFixed(2)}</span>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-300 text-xs ml-2">Remove</button>
                      </div>
                      <button
                        onClick={() => handleOrder(item)}
                        disabled={ordering}
                        className="btn-primary w-full mt-3 text-xs py-2"
                      >
                        {ordering ? 'Ordering...' : `Buy Now — ₹${item.price * item.qty}`}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            {cart.length > 0 && (
              <div className="px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm t-text-3 font-medium">Total Cashback</span>
                  <span className="text-sm font-bold text-emerald-600">₹{totalCartCashback().toFixed(2)}</span>
                </div>
                <div className="text-[10px] t-text-4">Cashback earned on all items in cart</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}