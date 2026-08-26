import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supplierService } from '../services/supplierService';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Button, Input, Modal, EmptyState, ErrorState, LoadingBlock } from '../components/ui';

export default function SuppliersPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('suppliers:manage');

  const [suppliers, setSuppliers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const load = () => {
    setStatus('loading');
    supplierService.list()
      .then((data) => { setSuppliers(data.suppliers); setStatus('success'); })
      .catch((err) => { setError(err.response?.data?.message); setStatus('error'); });
  };

  useEffect(load, []);

  const handleDelete = async () => {
    setDeleteError('');
    try {
      await supplierService.remove(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Unable to delete supplier.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Vendors you purchase stock from."
        actions={canManage && <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Add supplier</Button>}
      />

      {status === 'loading' && <LoadingBlock />}
      {status === 'error' && <ErrorState message={error} />}

      {status === 'success' && suppliers.length === 0 && (
        <EmptyState title="No suppliers yet" description="Add a supplier to start creating purchase orders." action={canManage && <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add supplier</Button>} />
      )}

      {status === 'success' && suppliers.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s._id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{s.name}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{s.contactPerson || '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{s.phone || '—'}</td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditing(s); setModalOpen(true); }} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-brand-600)]" aria-label="Edit"><Pencil size={15} /></button>
                      <button onClick={() => { setDeleteTarget(s); setDeleteError(''); }} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-danger-600)]" aria-label="Delete"><Trash2 size={15} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <SupplierFormModal open={modalOpen} onClose={() => setModalOpen(false)} supplier={editing} onSaved={() => { setModalOpen(false); load(); }} />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete supplier">
        <p className="text-sm text-[var(--color-ink-soft)]">Delete <strong>{deleteTarget?.name}</strong>?</p>
        {deleteError && <p className="text-sm text-[var(--color-danger-600)] mt-2">{deleteError}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function SupplierFormModal({ open, onClose, supplier, onSaved }) {
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (open) {
      reset(supplier || { name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '', notes: '' });
      setServerError('');
    }
  }, [open, supplier, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      if (supplier) await supplierService.update(supplier._id, values);
      else await supplierService.create(values);
      onSaved();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to save supplier.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={supplier ? 'Edit supplier' : 'Add supplier'} wide>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Supplier name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <Input label="Contact person" {...register('contactPerson')} />
          <Input label="Phone" {...register('phone')} />
          <Input label="Email" type="email" {...register('email')} />
          <Input label="GST number" {...register('gstNumber')} />
          <Input label="Address" {...register('address')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{supplier ? 'Save changes' : 'Add supplier'}</Button>
        </div>
      </form>
    </Modal>
  );
}
