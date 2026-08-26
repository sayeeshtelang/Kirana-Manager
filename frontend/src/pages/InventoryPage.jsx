import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PackagePlus, AlertTriangle } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { productService } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Button, Input, Select, Modal, Badge, EmptyState, ErrorState, LoadingBlock } from '../components/ui';

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('inventory:manage');

  const [lowStock, setLowStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [adjustOpen, setAdjustOpen] = useState(false);

  const load = async () => {
    setStatus('loading');
    try {
      const [lowRes, movRes, prodRes] = await Promise.all([
        inventoryService.listLowStock(),
        inventoryService.listMovements({ limit: 25 }),
        productService.list({ limit: 100 }),
      ]);
      setLowStock(lowRes.products);
      setMovements(movRes.movements);
      setProducts(prodRes.products);
      setStatus('success');
    } catch (err) {
      setError(err.response?.data?.message);
      setStatus('error');
    }
  };

  useEffect(() => { load(); }, []);

  if (status === 'loading') return <LoadingBlock />;
  if (status === 'error') return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels and history across all products."
        actions={canManage && <Button onClick={() => setAdjustOpen(true)}><PackagePlus size={16} /> Adjust stock</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm font-semibold text-[var(--color-ink)] mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-[var(--color-danger-500)]" /> Low stock
          </p>
          {lowStock.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-soft)] py-6 text-center">Everything is well stocked.</p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {lowStock.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-[var(--color-ink)]">{p.name}</span>
                  <Badge tone="danger">{p.stockQuantity} {p.unit} left</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">Recent stock movements</p>
          {movements.length === 0 ? (
            <EmptyState title="No movements yet" description="Stock changes from sales, purchases, and adjustments will show up here." />
          ) : (
            <div className="divide-y divide-[var(--color-border)] max-h-96 overflow-y-auto">
              {movements.map((m) => (
                <div key={m._id} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--color-ink)]">{m.product?.name}</span>
                    <Badge tone={m.type.includes('in') ? 'brand' : 'danger'}>{m.type.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {m.quantityBefore} → {m.quantityAfter} · {m.performedBy?.name} · {new Date(m.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <AdjustStockModal open={adjustOpen} onClose={() => setAdjustOpen(false)} products={products} onSaved={() => { setAdjustOpen(false); load(); }} />
    </div>
  );
}

function AdjustStockModal({ open, onClose, products, onSaved }) {
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => { if (open) { reset({ direction: 'in' }); setServerError(''); } }, [open, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await inventoryService.adjust(values);
      onSaved();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to adjust stock.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Adjust stock">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>}
        <Select label="Product" error={errors.productId?.message} {...register('productId', { required: 'Select a product' })}>
          <option value="">Select a product</option>
          {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.stockQuantity} {p.unit})</option>)}
        </Select>
        <Select label="Direction" {...register('direction')}>
          <option value="in">Stock in (add)</option>
          <option value="out">Stock out (remove)</option>
        </Select>
        <Input label="Quantity" type="number" min="1" step="0.01" error={errors.quantity?.message} {...register('quantity', { required: 'Required', min: 1 })} />
        <Input label="Reason / note (optional)" {...register('note')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Save adjustment</Button>
        </div>
      </form>
    </Modal>
  );
}
