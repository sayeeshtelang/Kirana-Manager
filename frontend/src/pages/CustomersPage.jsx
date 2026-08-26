import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { customerService } from '../services/customerService';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Button, Input, Modal, Badge, EmptyState, ErrorState, LoadingBlock, formatINR } from '../components/ui';

export default function CustomersPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('customers:manage');

  const [customers, setCustomers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState('');

  const load = (searchTerm = search) => {
    setStatus('loading');
    customerService.list({ search: searchTerm || undefined })
      .then((data) => { setCustomers(data.customers); setStatus('success'); })
      .catch((err) => { setError(err.response?.data?.message); setStatus('error'); });
  };

  useEffect(() => load(''), []);

  const handleDelete = async () => {
    try {
      const res = await customerService.remove(deleteTarget._id);
      setDeleteMsg(res.message);
      setTimeout(() => { setDeleteTarget(null); setDeleteMsg(''); load(); }, 1200);
    } catch (err) {
      setDeleteMsg(err.response?.data?.message || 'Unable to delete customer.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage customer records and khatta credit."
        actions={canManage && <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Add customer</Button>}
      />

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mb-4 max-w-sm relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)]" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40" />
      </form>

      {status === 'loading' && <LoadingBlock />}
      {status === 'error' && <ErrorState message={error} />}

      {status === 'success' && customers.length === 0 && (
        <EmptyState title="No customers yet" description="Add customers to track khatta credit and billing history." action={canManage && <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add customer</Button>} />
      )}

      {status === 'success' && customers.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Khatta balance</th>
                {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{c.name}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{c.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {c.khattaBalance > 0 ? <Badge tone="accent">{formatINR(c.khattaBalance)}</Badge> : <span className="text-[var(--color-ink-soft)]">₹0</span>}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditing(c); setModalOpen(true); }} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-brand-600)]" aria-label="Edit"><Pencil size={15} /></button>
                      <button onClick={() => { setDeleteTarget(c); setDeleteMsg(''); }} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-danger-600)]" aria-label="Delete"><Trash2 size={15} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <CustomerFormModal open={modalOpen} onClose={() => setModalOpen(false)} customer={editing} onSaved={() => { setModalOpen(false); load(); }} />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete customer">
        <p className="text-sm text-[var(--color-ink-soft)]">Delete <strong>{deleteTarget?.name}</strong>?</p>
        {deleteMsg && <p className="text-sm text-[var(--color-brand-700)] mt-2">{deleteMsg}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function CustomerFormModal({ open, onClose, customer, onSaved }) {
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (open) {
      reset(customer ? { name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, khattaCreditLimit: customer.khattaCreditLimit } : { name: '', phone: '', email: '', address: '', khattaCreditLimit: 0 });
      setServerError('');
    }
  }, [open, customer, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      if (customer) await customerService.update(customer._id, values);
      else await customerService.create(values);
      onSaved();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to save customer.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={customer ? 'Edit customer' : 'Add customer'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>}
        <Input label="Name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
        <Input label="Phone" {...register('phone')} />
        <Input label="Email (optional)" type="email" {...register('email')} />
        <Input label="Address (optional)" {...register('address')} />
        <Input label="Khatta credit limit (₹, 0 = use business default)" type="number" min="0" {...register('khattaCreditLimit')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{customer ? 'Save changes' : 'Add customer'}</Button>
        </div>
      </form>
    </Modal>
  );
}
