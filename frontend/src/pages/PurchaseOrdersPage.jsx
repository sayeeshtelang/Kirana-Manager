import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, PackageCheck, Ban } from 'lucide-react';
import { purchaseOrderService } from '../services/purchaseOrderService';
import { supplierService } from '../services/supplierService';
import { productService } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Button, Input, Select, Modal, Badge, EmptyState, ErrorState, LoadingBlock, formatINR } from '../components/ui';

const STATUS_TONE = { draft: 'neutral', ordered: 'accent', partially_received: 'accent', received: 'brand', cancelled: 'danger' };

export default function PurchaseOrdersPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('purchase_orders:manage');

  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = async () => {
    setStatus('loading');
    try {
      const [poRes, supRes, prodRes] = await Promise.all([
        purchaseOrderService.list(),
        supplierService.list(),
        productService.list({ limit: 100 }),
      ]);
      setOrders(poRes.orders);
      setSuppliers(supRes.suppliers);
      setProducts(prodRes.products);
      setStatus('success');
    } catch (err) {
      setError(err.response?.data?.message);
      setStatus('error');
    }
  };

  useEffect(() => { load(); }, []);

  const handleReceive = async (id) => {
    setActionError('');
    try {
      await purchaseOrderService.receive(id);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Unable to receive this order.');
    }
  };

  const handleCancel = async (id) => {
    setActionError('');
    try {
      await purchaseOrderService.cancel(id);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Unable to cancel this order.');
    }
  };

  if (status === 'loading') return <LoadingBlock />;
  if (status === 'error') return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Order stock from suppliers and receive it into inventory."
        actions={canManage && <Button onClick={() => setModalOpen(true)}><Plus size={16} /> New purchase order</Button>}
      />

      {actionError && <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg mb-4">{actionError}</p>}

      {orders.length === 0 ? (
        <EmptyState title="No purchase orders yet" description="Create a PO to restock products from your suppliers." action={canManage && <Button onClick={() => setModalOpen(true)}><Plus size={16} /> New purchase order</Button>} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
                <th className="px-4 py-3 font-medium">PO Number</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{o.poNumber}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{o.supplier?.name}</td>
                  <td className="px-4 py-3">{formatINR(o.totalAmount)}</td>
                  <td className="px-4 py-3"><Badge tone={STATUS_TONE[o.status]}>{o.status.replace('_', ' ')}</Badge></td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {!['received', 'cancelled'].includes(o.status) && (
                        <>
                          <button onClick={() => handleReceive(o._id)} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-brand-600)]" aria-label="Receive"><PackageCheck size={15} /></button>
                          <button onClick={() => handleCancel(o._id)} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-danger-600)]" aria-label="Cancel"><Ban size={15} /></button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <CreatePOModal open={modalOpen} onClose={() => setModalOpen(false)} suppliers={suppliers} products={products} onSaved={() => { setModalOpen(false); load(); }} />
    </div>
  );
}

function CreatePOModal({ open, onClose, suppliers, products, onSaved }) {
  const [serverError, setServerError] = useState('');
  const { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { supplier: '', items: [{ product: '', quantity: 1, unitCost: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');

  useEffect(() => {
    if (open) { reset({ supplier: '', items: [{ product: '', quantity: 1, unitCost: 0 }] }); setServerError(''); }
  }, [open, reset]);

  const total = (items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0), 0);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await purchaseOrderService.create(values);
      onSaved();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to create purchase order.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New purchase order" wide>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>}

        <Select label="Supplier" error={errors.supplier?.message} {...register('supplier', { required: 'Select a supplier' })}>
          <option value="">Select a supplier</option>
          {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </Select>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--color-ink)]">Items</p>
          {fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <Select label={idx === 0 ? 'Product' : undefined} {...register(`items.${idx}.product`, { required: true })}>
                  <option value="">Select</option>
                  {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </Select>
              </div>
              <div className="col-span-3">
                <Input label={idx === 0 ? 'Quantity' : undefined} type="number" min="1" step="0.01" {...register(`items.${idx}.quantity`, { required: true, min: 1 })} />
              </div>
              <div className="col-span-3">
                <Input label={idx === 0 ? 'Unit cost (₹)' : undefined} type="number" min="0" step="0.01" {...register(`items.${idx}.unitCost`, { required: true, min: 0 })} />
              </div>
              <div className="col-span-1">
                <button type="button" onClick={() => remove(idx)} className="p-2 text-[var(--color-ink-soft)] hover:text-[var(--color-danger-600)]" aria-label="Remove line"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => append({ product: '', quantity: 1, unitCost: 0 })}>
            <Plus size={14} /> Add line
          </Button>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)]">
          <span className="text-sm text-[var(--color-ink-soft)]">Estimated total</span>
          <span className="font-semibold">{formatINR(total)}</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Create purchase order</Button>
        </div>
      </form>
    </Modal>
  );
}
