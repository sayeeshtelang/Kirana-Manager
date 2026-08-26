import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Pencil, Trash2, ImagePlus } from 'lucide-react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import {
  Card, PageHeader, Button, Input, Select, Modal, Badge,
  EmptyState, ErrorState, LoadingBlock, formatINR,
} from '../components/ui';

export default function ProductsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('products:manage');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async (searchTerm = search) => {
    setStatus('loading');
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.list({ search: searchTerm || undefined }),
        categoryService.list(),
      ]);
      setProducts(prodRes.products);
      setCategories(catRes.categories);
      setStatus('success');
    } catch (err) {
      setError(err.response?.data?.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    load(search);
  };

  const handleDelete = async () => {
    try {
      await productService.remove(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to delete product.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your catalog, pricing, and stock levels."
        actions={
          canManage && (
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus size={16} /> Add product
            </Button>
          )
        }
      />

      <form onSubmit={onSearchSubmit} className="mb-4 max-w-sm relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40"
        />
      </form>

      {status === 'loading' && <LoadingBlock />}
      {status === 'error' && <ErrorState message={error} />}

      {status === 'success' && products.length === 0 && (
        <EmptyState
          title="No products yet"
          description="Add your first product to start tracking stock and selling through the POS."
          action={canManage && <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add product</Button>}
        />
      )}

      {status === 'success' && products.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="h-9 w-9 rounded-lg object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-[var(--color-surface-sunken)] flex items-center justify-center text-[var(--color-ink-soft)]">
                          <ImagePlus size={14} />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[var(--color-ink)]">{p.name}</p>
                        {p.sku && <p className="text-xs text-[var(--color-ink-soft)]">{p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3">{formatINR(p.sellingPrice)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{p.stockQuantity} {p.unit}</span>
                      {p.isLowStock && <Badge tone="danger">Low</Badge>}
                    </div>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditing(p); setModalOpen(true); }} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-brand-600)]" aria-label="Edit">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-danger-600)]" aria-label="Delete">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editing}
        categories={categories}
        onSaved={() => { setModalOpen(false); load(); }}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Deactivate product">
        <p className="text-sm text-[var(--color-ink-soft)]">
          This will deactivate <strong>{deleteTarget?.name}</strong>. It will no longer appear in the POS but past bills are preserved.
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Deactivate</Button>
        </div>
      </Modal>
    </div>
  );
}

function ProductFormModal({ open, onClose, product, categories, onSaved }) {
  const [serverError, setServerError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (open) {
      reset(
        product
          ? {
              name: product.name, sku: product.sku, barcode: product.barcode,
              category: product.category?._id || '', unit: product.unit,
              costPrice: product.costPrice, sellingPrice: product.sellingPrice,
              mrp: product.mrp, taxPercent: product.taxPercent,
              stockQuantity: product.stockQuantity, lowStockThreshold: product.lowStockThreshold,
            }
          : { unit: 'pcs', taxPercent: 0, stockQuantity: 0, lowStockThreshold: 10 }
      );
      setImageFile(null);
      setServerError('');
    }
  }, [open, product, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => { if (v !== undefined && v !== '') formData.append(k, v); });
      if (imageFile) formData.append('image', imageFile);

      if (product) await productService.update(product._id, formData);
      else await productService.create(formData);

      onSaved();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to save product.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={product ? 'Edit product' : 'Add product'} wide>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Product name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <Input label="SKU (optional)" {...register('sku')} />
          <Select label="Category" {...register('category')}>
            <option value="">Uncategorized</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Select label="Unit" {...register('unit')}>
            {['pcs', 'kg', 'g', 'l', 'ml', 'box', 'dozen'].map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
          <Input label="Cost price (₹)" type="number" step="0.01" error={errors.costPrice?.message} {...register('costPrice', { required: 'Required', min: 0 })} />
          <Input label="Selling price (₹)" type="number" step="0.01" error={errors.sellingPrice?.message} {...register('sellingPrice', { required: 'Required', min: 0 })} />
          <Input label="MRP (₹, optional)" type="number" step="0.01" {...register('mrp')} />
          <Input label="Tax %" type="number" step="0.01" {...register('taxPercent')} />
          {!product && <Input label="Opening stock" type="number" {...register('stockQuantity')} />}
          <Input label="Low stock threshold" type="number" {...register('lowStockThreshold')} />
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-[var(--color-ink)] mb-1">Product image (optional)</span>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="text-sm" />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{product ? 'Save changes' : 'Add product'}</Button>
        </div>
      </form>
    </Modal>
  );
}
