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
      <PageHeader title="Bill History" subtitle="All completed and voided sales." />

      {bills.length === 0 ? (
        <EmptyState title="No bills yet" description="Sales made through the POS will show up here." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b._id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{b.invoiceNumber}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{b.customer?.name || 'Walk-in'}</td>
                  <td className="px-4 py-3">{formatINR(b.totalAmount)}</td>
                  <td className="px-4 py-3"><Badge>{b.paymentMethod}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={b.status === 'voided' ? 'danger' : 'brand'}>{b.status}</Badge></td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
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

      <Modal open={!!detailBill} onClose={() => setDetailBill(null)} title={`Bill ${detailBill?.invoiceNumber || ''}`}>
        {detailBill && (
          <div className="space-y-3 text-sm">
            <div className="divide-y divide-[var(--color-border)]">
              {detailBill.items.map((it, i) => (
                <div key={i} className="flex justify-between py-1.5">
                  <span>{it.name} × {it.quantity}</span>
                  <span>{formatINR(it.total)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-[var(--color-border)]">
              <span>Total</span><span>{formatINR(detailBill.totalAmount)}</span>
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
