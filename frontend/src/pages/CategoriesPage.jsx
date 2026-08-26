import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Button, Input, Modal, EmptyState, ErrorState, LoadingBlock } from '../components/ui';

export default function CategoriesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('categories:manage');

  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const load = () => {
    setStatus('loading');
    categoryService.list()
      .then((data) => { setCategories(data.categories); setStatus('success'); })
      .catch((err) => { setError(err.response?.data?.message); setStatus('error'); });
  };

  useEffect(load, []);

  const handleDelete = async () => {
    setDeleteError('');
    try {
      await categoryService.remove(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Unable to delete this category.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Group products for easier browsing and reporting."
        actions={canManage && <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Add category</Button>}
      />

      {status === 'loading' && <LoadingBlock />}
      {status === 'error' && <ErrorState message={error} />}

      {status === 'success' && categories.length === 0 && (
        <EmptyState title="No categories yet" description="Create categories like Dairy, Snacks, or Beverages to organize your products." action={canManage && <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add category</Button>} />
      )}

      {status === 'success' && categories.length > 0 && (
        <Card className="divide-y divide-[var(--color-border)]">
          {categories.map((c) => (
            <div key={c._id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-[var(--color-ink)]">{c.name}</p>
                {c.description && <p className="text-xs text-[var(--color-ink-soft)]">{c.description}</p>}
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditing(c); setModalOpen(true); }} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-brand-600)]" aria-label="Edit"><Pencil size={15} /></button>
                  <button onClick={() => { setDeleteTarget(c); setDeleteError(''); }} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-danger-600)]" aria-label="Delete"><Trash2 size={15} /></button>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      <CategoryFormModal open={modalOpen} onClose={() => setModalOpen(false)} category={editing} onSaved={() => { setModalOpen(false); load(); }} />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete category">
        <p className="text-sm text-[var(--color-ink-soft)]">Delete <strong>{deleteTarget?.name}</strong>? This can't be undone.</p>
        {deleteError && <p className="text-sm text-[var(--color-danger-600)] mt-2">{deleteError}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function CategoryFormModal({ open, onClose, category, onSaved }) {
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (open) {
      reset(category ? { name: category.name, description: category.description } : { name: '', description: '' });
      setServerError('');
    }
  }, [open, category, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      if (category) await categoryService.update(category._id, values);
      else await categoryService.create(values);
      onSaved();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to save category.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={category ? 'Edit category' : 'Add category'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>}
        <Input label="Name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
        <Input label="Description (optional)" {...register('description')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{category ? 'Save changes' : 'Add category'}</Button>
        </div>
      </form>
    </Modal>
  );
}
