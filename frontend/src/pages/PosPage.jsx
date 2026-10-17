import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, ImagePlus } from 'lucide-react';
import { productService } from '../services/productService';
import { customerService } from '../services/customerService';
import { billService } from '../services/billService';
import { Card, Button, Input, Select, Badge, EmptyState, LoadingBlock, formatINR } from '../components/ui';

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]); // [{product, quantity}]
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastBill, setLastBill] = useState(null);

  useEffect(() => {
    Promise.all([productService.list({ limit: 100 }), customerService.list()])
      .then(([prodRes, custRes]) => { setProducts(prodRes.products); setCustomers(custRes.customers); })
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search) return products.slice(0, 24);
    return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product._id === product._id);
      if (existing) {
        return prev.map((c) => (c.product._id === product._id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => prev
      .map((c) => (c.product._id === productId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c))
      .filter((c) => c.quantity > 0));
  };

  const removeFromCart = (productId) => setCart((prev) => prev.filter((c) => c.product._id !== productId));

  const subtotal = cart.reduce((sum, c) => sum + c.product.sellingPrice * c.quantity, 0);
  const taxAmount = cart.reduce((sum, c) => sum + c.product.sellingPrice * c.quantity * (c.product.taxPercent / 100), 0);
  const totalAmount = Math.max(0, subtotal + taxAmount - Number(discountAmount || 0));

  const handleCheckout = async () => {
    setError('');
    if (cart.length === 0) { setError('Add at least one item to the cart.'); return; }
    if ((paymentMethod === 'khatta' || paymentMethod === 'split') && !customerId) {
      setError('Select a customer for khatta or split payments.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customerId: customerId || undefined,
        items: cart.map((c) => ({ product: c.product._id, quantity: c.quantity })),
        discountAmount: Number(discountAmount) || 0,
        paymentMethod,
        amountPaid: paymentMethod === 'split' ? Number(amountPaid) || 0 : undefined,
      };
      const { bill } = await billService.create(payload);
      setLastBill(bill);
      setCart([]);
      setCustomerId('');
      setDiscountAmount(0);
      setAmountPaid(0);
      setPaymentMethod('cash');
      // refresh product stock counts in the picker
      const prodRes = await productService.list({ limit: 100 });
      setProducts(prodRes.products);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to complete sale.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Product picker */}
      <div className="lg:col-span-2 flex flex-col min-h-0">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)]" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or SKU…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--color-border)] text-sm bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40"
          />
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState title="No products found" description="Try a different search term." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pb-4">
            {filteredProducts.map((p) => (
              <button
                key={p._id}
                onClick={() => addToCart(p)}
                disabled={p.stockQuantity <= 0}
                className="text-left bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 hover:border-[var(--color-brand-500)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="h-28 w-full mb-3 rounded-md overflow-hidden bg-[var(--color-surface-sunken)] flex items-center justify-center text-[var(--color-ink-soft)]">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus size={24} />
                  )}
                </div>
                <p className="font-medium text-sm text-[var(--color-ink)] line-clamp-2">{p.name}</p>
                <p className="text-xs text-[var(--color-ink-soft)] mt-1">{formatINR(p.sellingPrice)} / {p.unit}</p>
                <p className="text-xs mt-1">
                  {p.stockQuantity <= 0 ? <Badge tone="danger">Out of stock</Badge> : <span className="text-[var(--color-ink-soft)]">{p.stockQuantity} in stock</span>}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart */}
      <Card className="flex flex-col p-4 h-full">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart size={18} className="text-[var(--color-brand-600)]" />
          <p className="font-semibold text-[var(--color-ink)]">Cart</p>
        </div>

        {cart.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)] py-8 text-center flex-1">No items yet. Tap a product to add it.</p>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 mb-3">
            {cart.map((c) => (
              <div key={c.product._id} className="flex items-center justify-between gap-2 text-sm border-b border-[var(--color-border)] pb-2">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-ink)] truncate">{c.product.name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{formatINR(c.product.sellingPrice)} × {c.quantity}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => updateQuantity(c.product._id, -1)} className="p-1 rounded bg-[var(--color-surface-sunken)]" aria-label="Decrease"><Minus size={13} /></button>
                  <span className="w-6 text-center">{c.quantity}</span>
                  <button onClick={() => updateQuantity(c.product._id, 1)} className="p-1 rounded bg-[var(--color-surface-sunken)]" aria-label="Increase"><Plus size={13} /></button>
                  <button onClick={() => removeFromCart(c.product._id)} className="p-1 text-[var(--color-danger-500)]" aria-label="Remove"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 border-t border-[var(--color-border)] pt-3">
          <Select label="Customer (optional)" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Walk-in customer</option>
            {customers.map((c) => <option key={c._id} value={c._id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
          </Select>

          <Select label="Payment method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="khatta">Khatta (full credit)</option>
            <option value="split">Split (partial credit)</option>
          </Select>

          {paymentMethod === 'split' && (
            <Input label="Amount paid now (₹)" type="number" min="0" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
          )}

          <Input label="Discount (₹)" type="number" min="0" step="0.01" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} />

          <div className="text-sm space-y-1">
            <div className="flex justify-between text-[var(--color-ink-soft)]"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
            <div className="flex justify-between text-[var(--color-ink-soft)]"><span>Tax</span><span>{formatINR(taxAmount)}</span></div>
            <div className="flex justify-between font-semibold text-[var(--color-ink)] text-base pt-1 border-t border-[var(--color-border)]">
              <span>Total</span><span>{formatINR(totalAmount)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{error}</p>}

          <Button className="w-full" size="lg" onClick={handleCheckout} loading={submitting} disabled={cart.length === 0}>
            Complete sale
          </Button>
        </div>
      </Card>

      {lastBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setLastBill(null)} />
          <div className="relative bg-[var(--color-surface)] rounded-xl shadow-xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setLastBill(null)} className="absolute top-4 right-4 text-[var(--color-ink-soft)]" aria-label="Close"><X size={18} /></button>
            <div className="border-b border-[var(--color-border)] pb-4 mb-4">
              <p className="font-semibold text-[var(--color-brand-700)] mb-1">Sale completed</p>
              <p className="text-2xl font-bold text-[var(--color-ink)]">{lastBill.invoiceNumber}</p>
              <p className="text-sm text-[var(--color-ink-soft)] mt-1">{new Date(lastBill.createdAt).toLocaleString('en-IN')}</p>
              {lastBill.customer?.name && <p className="text-sm text-[var(--color-ink-soft)]">Customer: {lastBill.customer.name}</p>}
            </div>

            <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface-sunken)] text-left text-xs text-[var(--color-ink-soft)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 font-medium text-right">Qty</th>
                    <th className="px-3 py-2 font-medium text-right">Price</th>
                    <th className="px-3 py-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lastBill.items.map((item, index) => (
                    <tr key={`${item.product || item.name}-${index}`} className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-2.5 font-medium">{item.name}</td>
                      <td className="px-3 py-2.5 text-right">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-right">{formatINR(item.unitPrice)}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{formatINR(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <div className="w-full sm:w-72 space-y-2 text-sm">
                <div className="flex justify-between text-[var(--color-ink-soft)]"><span>Subtotal</span><span>{formatINR(lastBill.subtotal)}</span></div>
                <div className="flex justify-between text-[var(--color-ink-soft)]"><span>Tax</span><span>{formatINR(lastBill.taxAmount)}</span></div>
                {lastBill.discountAmount > 0 && <div className="flex justify-between text-[var(--color-ink-soft)]"><span>Discount</span><span>- {formatINR(lastBill.discountAmount)}</span></div>}
                <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-base font-semibold"><span>Total</span><span>{formatINR(lastBill.totalAmount)}</span></div>
                <div className="flex justify-between text-[var(--color-ink-soft)]"><span>Payment</span><span className="capitalize">{lastBill.paymentMethod}</span></div>
              </div>
            </div>

            <Button className="w-full mt-5" onClick={() => setLastBill(null)}>New sale</Button>
          </div>
        </div>
      )}
    </div>
  );
}
