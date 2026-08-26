import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Wallet, History } from 'lucide-react';
import { khattaService } from '../services/khattaService';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Button, Input, Select, Modal, Badge, EmptyState, ErrorState, LoadingBlock, formatINR } from '../components/ui';

export default function KhattaPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('khatta:manage');

  const [customers, setCustomers] = useState([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [repayTarget, setRepayTarget] = useState(null);
  const [ledgerTarget, setLedgerTarget] = useState(null);

  const load = () => {
    setStatus('loading');
    khattaService.listOutstanding()
      .then((data) => { setCustomers(data.customers); setTotalOutstanding(data.totalOutstanding); setStatus('success'); })
      .catch((err) => { setError(err.response?.data?.message); setStatus('error'); });
  };

  useEffect(load, []);

  if (status === 'loading') return <LoadingBlock />;
  if (status === 'error') return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader title="Khatta / Credit" subtitle="Track customer credit balances and repayments." />

      <Card className="p-4 mb-5 flex items-center gap-3">
        <span className="h-10 w-10 rounded-lg bg-[var(--color-accent-100)] text-[var(--color-accent-600)] flex items-center justify-center"><Wallet size={18} /></span>
        <div>
          <p className="text-sm text-[var(--color-ink-soft)]">Total outstanding across all customers</p>
          <p className="text-xl font-bold text-[var(--color-ink)]">{formatINR(totalOutstanding)}</p>
        </div>
      </Card>

      {customers.length === 0 ? (
        <EmptyState title="No outstanding khatta" description="Customers with a credit balance will appear here." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Balance</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{c.name}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{c.phone || '—'}</td>
                  <td className="px-4 py-3"><Badge tone="accent">{formatINR(c.khattaBalance)}</Badge></td>
                  <td className="px-4 py-3 text-right flex justify-end gap-1">
                    <button onClick={() => setLedgerTarget(c)} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-brand-600)]" aria-label="View ledger"><History size={15} /></button>
                    {canManage && (
                      <Button size="sm" onClick={() => setRepayTarget(c)}>Record payment</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <RepayModal open={!!repayTarget} onClose={() => setRepayTarget(null)} customer={repayTarget} onSaved={() => { setRepayTarget(null); load(); }} />
      <LedgerModal open={!!ledgerTarget} onClose={() => setLedgerTarget(null)} customer={ledgerTarget} />
    </div>
  );
}

function RepayModal({ open, onClose, customer, onSaved }) {
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => { if (open) { reset({ paymentMethod: 'cash' }); setServerError(''); } }, [open, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await khattaService.repay(customer._id, values);
      onSaved();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to record payment.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Record payment — ${customer?.name || ''}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>}
        <p className="text-sm text-[var(--color-ink-soft)]">Current balance: <strong>{formatINR(customer?.khattaBalance)}</strong></p>
        <Input label="Amount received (₹)" type="number" min="0.01" step="0.01" error={errors.amount?.message} {...register('amount', { required: 'Required', min: 0.01 })} />
        <Select label="Payment method" {...register('paymentMethod')}>
          {['cash', 'upi', 'card', 'bank_transfer', 'other'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
        </Select>
        <Input label="Note (optional)" {...register('note')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Save payment</Button>
        </div>
      </form>
    </Modal>
  );
}

function LedgerModal({ open, onClose, customer }) {
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (open && customer) {
      setStatus('loading');
      khattaService.getLedger(customer._id)
        .then((data) => { setTransactions(data.transactions); setStatus('success'); })
        .catch(() => setStatus('error'));
    }
  }, [open, customer]);

  return (
    <Modal open={open} onClose={onClose} title={`Khatta ledger — ${customer?.name || ''}`} wide>
      {status === 'loading' && <LoadingBlock />}
      {status === 'error' && <ErrorState />}
      {status === 'success' && transactions.length === 0 && <EmptyState title="No transactions yet" />}
      {status === 'success' && transactions.length > 0 && (
        <div className="divide-y divide-[var(--color-border)] max-h-96 overflow-y-auto">
          {transactions.map((t) => (
            <div key={t._id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="font-medium text-[var(--color-ink)] capitalize">{t.type.replace('_', ' ')}</p>
                <p className="text-xs text-[var(--color-ink-soft)]">{new Date(t.createdAt).toLocaleString('en-IN')} · {t.recordedBy?.name}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${t.type === 'credit_sale' ? 'text-[var(--color-danger-600)]' : 'text-[var(--color-brand-600)]'}`}>
                  {t.type === 'credit_sale' ? '+' : '-'}{formatINR(t.amount)}
                </p>
                <p className="text-xs text-[var(--color-ink-soft)]">Balance: {formatINR(t.balanceAfter)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
