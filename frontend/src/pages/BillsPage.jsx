import { useEffect, useState } from 'react';
import { Ban, Eye } from 'lucide-react';
import { billService } from '../services/billService';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Button, Modal, Badge, EmptyState, ErrorState, LoadingBlock, formatINR } from '../components/ui';

export default function BillsPage() {
  const { hasPermission } = useAuth();
  const canVoid = hasPermission('billing:void');

  const [bills, setBills] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [detailBill, setDetailBill] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');

  const load = () => {
    setStatus('loading');
    billService.list({ limit: 50 })
      .then((data) => { setBills(data.bills); setStatus('success'); })
      .catch((err) => { setError(err.response?.data?.message); setStatus('error'); });
  };

  useEffect(load, []);

  const handleVoid = async () => {
    setVoidError('');
    try {
      await billService.void(voidTarget._id, voidReason);
      setVoidTarget(null);
      setVoidReason('');
      load();
    } catch (err) {
      setVoidError(err.response?.data?.message || 'Unable to void this bill.');
    }
  };

  if (status === 'loading') return <LoadingBlock />;
  if (status === 'error') return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader title="Bill History" subtitle="Review completed and voided sales, tax, and payment details." />

      {bills.length === 0 ? (
        <EmptyState title="No bills yet" description="Sales made through the POS will show up here." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date & time</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b._id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{b.invoiceNumber}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{b.customer?.name || 'Walk-in'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{formatINR(b.totalAmount)}</p>
                    <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">Tax {formatINR(b.taxAmount)}</p>
                  </td>
                  <td className="px-4 py-3"><Badge>{b.paymentMethod}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={b.status === 'voided' ? 'danger' : 'brand'}>{b.status}</Badge></td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                    <p>{new Date(b.createdAt).toLocaleDateString('en-IN')}</p>
                    <p className="text-xs mt-0.5">{new Date(b.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDetailBill(b)} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-brand-600)]" aria-label="View"><Eye size={15} /></button>
                    {canVoid && b.status !== 'voided' && (
                      <button onClick={() => { setVoidTarget(b); setVoidError(''); }} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-danger-600)]" aria-label="Void"><Ban size={15} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={!!detailBill} onClose={() => setDetailBill(null)} title={`Bill ${detailBill?.invoiceNumber || ''}`} wide>
        {detailBill && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[var(--color-ink-soft)]">
              <div>
                <p className="text-xs uppercase tracking-wide">Customer</p>
                <p className="font-medium text-[var(--color-ink)] mt-1">{detailBill.customer?.name || 'Walk-in'}</p>
                {detailBill.customer?.phone && <p className="text-xs mt-0.5">{detailBill.customer.phone}</p>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide">Payment</p>
                <p className="font-medium text-[var(--color-ink)] mt-1 capitalize">{detailBill.paymentMethod}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide">Cashier</p>
                <p className="font-medium text-[var(--color-ink)] mt-1">{detailBill.cashier?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide">Date</p>
                <p className="font-medium text-[var(--color-ink)] mt-1">{new Date(detailBill.createdAt).toLocaleDateString('en-IN')}</p>
                <p className="text-xs mt-0.5">{new Date(detailBill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface-sunken)] text-left text-xs text-[var(--color-ink-soft)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 font-medium text-right">Qty</th>
                    <th className="px-3 py-2 font-medium text-right">Unit price</th>
                    <th className="px-3 py-2 font-medium text-right">Tax</th>
                    <th className="px-3 py-2 font-medium text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailBill.items.map((it, i) => {
                    const taxableAmount = it.unitPrice * it.quantity;
                    const itemTax = it.total - taxableAmount;
                    return (
                      <tr key={i} className="border-t border-[var(--color-border)]">
                        <td className="px-3 py-2.5 font-medium">{it.name}</td>
                        <td className="px-3 py-2.5 text-right">{it.quantity}</td>
                        <td className="px-3 py-2.5 text-right">{formatINR(it.unitPrice)}</td>
                        <td className="px-3 py-2.5 text-right">
                          <p>{formatINR(itemTax)}</p>
                          <p className="text-xs text-[var(--color-ink-soft)]">{it.taxPercent || 0}%</p>
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium">{formatINR(it.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2">
                <div className="flex justify-between text-[var(--color-ink-soft)]"><span>Subtotal</span><span>{formatINR(detailBill.subtotal)}</span></div>
                <div className="flex justify-between text-[var(--color-ink-soft)]"><span>Tax</span><span>{formatINR(detailBill.taxAmount)}</span></div>
                {detailBill.discountAmount > 0 && <div className="flex justify-between text-[var(--color-ink-soft)]"><span>Discount</span><span>- {formatINR(detailBill.discountAmount)}</span></div>}
                <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-base font-semibold text-[var(--color-ink)]">
                  <span>Grand total</span><span>{formatINR(detailBill.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[var(--color-ink-soft)]"><span>Paid</span><span>{formatINR(detailBill.amountPaid)}</span></div>
                {detailBill.khattaAmount > 0 && <div className="flex justify-between text-[var(--color-ink-soft)]"><span>On khatta</span><span>{formatINR(detailBill.khattaAmount)}</span></div>}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!voidTarget} onClose={() => setVoidTarget(null)} title="Void bill">
        <p className="text-sm text-[var(--color-ink-soft)]">
          Void <strong>{voidTarget?.invoiceNumber}</strong>? Stock and any khatta charge will be reversed.
        </p>
        <textarea
          value={voidReason}
          onChange={(e) => setVoidReason(e.target.value)}
          placeholder="Reason (optional)"
          className="w-full mt-3 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm"
          rows={2}
        />
        {voidError && <p className="text-sm text-[var(--color-danger-600)] mt-2">{voidError}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setVoidTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleVoid}>Void bill</Button>
        </div>
      </Modal>
    </div>
  );
}
