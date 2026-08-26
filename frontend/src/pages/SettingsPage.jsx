import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import { businessService } from '../services/businessService';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Button, Input, Badge, LoadingBlock, ErrorState } from '../components/ui';

const ROLES = ['admin', 'manager', 'cashier', 'inventory_staff'];

export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const canManageUsers = hasPermission('business:manage_users');

  const [business, setBusiness] = useState(null);
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = async () => {
    setStatus('loading');
    try {
      const [bizRes, memberRes] = await Promise.all([
        businessService.getBusiness(),
        canManageUsers ? businessService.listMembers() : Promise.resolve({ members: [] }),
      ]);
      setBusiness(bizRes.business);
      setMembers(memberRes.members);
      setStatus('success');
    } catch (err) {
      setError(err.response?.data?.message);
      setStatus('error');
    }
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (membershipId, role) => {
    try {
      await businessService.changeMemberRole(membershipId, role);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to change role.');
    }
  };

  const handleRemove = async (membershipId) => {
    if (!confirm('Remove this member from the business?')) return;
    try {
      await businessService.removeMember(membershipId);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to remove member.');
    }
  };

  if (status === 'loading') return <LoadingBlock />;
  if (status === 'error') return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Business Settings" subtitle="Manage your business profile and team." />

      <BusinessProfileForm business={business} onSaved={load} />

      {canManageUsers && (
        <Card className="p-4">
          <p className="font-semibold text-[var(--color-ink)] mb-4">Team members</p>
          <p className="text-xs text-[var(--color-ink-soft)] -mt-2 mb-4">
            To add someone new with login access, create them as an Employee and grant login access there.
          </p>

          <div className="divide-y divide-[var(--color-border)]">
            {members.length === 0 && (
              <p className="text-sm text-[var(--color-ink-soft)] py-4 text-center">No team members yet.</p>
            )}
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-[var(--color-ink)]">{m.user?.name || m.invitedEmail}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{m.user?.email || m.invitedEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  {m.status === 'invited' && <Badge tone="accent">Invited</Badge>}
                  {m.role === 'owner' ? (
                    <Badge tone="brand">Owner</Badge>
                  ) : (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className="text-sm border border-[var(--color-border)] rounded-lg px-2 py-1"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  )}
                  {m.role !== 'owner' && (
                    <button onClick={() => handleRemove(m.id)} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-danger-600)]" aria-label="Remove">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function BusinessProfileForm({ business, onSaved }) {
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (business) {
      reset({
        name: business.name,
        contactEmail: business.contactEmail,
        contactPhone: business.contactPhone,
        gstNumber: business.gstNumber,
        settings: {
          lowStockThreshold: business.settings?.lowStockThreshold,
          khattaCreditLimit: business.settings?.khattaCreditLimit,
          invoicePrefix: business.settings?.invoicePrefix,
        },
      });
    }
  }, [business, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    setSaved(false);
    try {
      const payload = {
        name: values.name,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        gstNumber: values.gstNumber,
        settings: {
          lowStockThreshold: Number(values.settings?.lowStockThreshold) || 10,
          khattaCreditLimit: Number(values.settings?.khattaCreditLimit) || 0,
          invoicePrefix: values.settings?.invoicePrefix || 'INV',
        },
      };
      await businessService.updateBusiness(payload);
      setSaved(true);
      onSaved();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to save settings.');
    }
  };

  return (
    <Card className="p-4">
      <p className="font-semibold text-[var(--color-ink)] mb-4">Business profile</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>}
        {saved && <p className="text-sm text-[var(--color-brand-700)] bg-[var(--color-brand-50)] px-3 py-2 rounded-lg">Settings saved.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Business name" error={errors.name?.message} {...register('name', { required: 'Required' })} />
          <Input label="Contact email" type="email" {...register('contactEmail')} />
          <Input label="Contact phone" {...register('contactPhone')} />
          <Input label="GST number" {...register('gstNumber')} />
          <Input label="Low stock threshold (default)" type="number" min="0" {...register('settings.lowStockThreshold')} />
          <Input label="Default khatta credit limit (₹)" type="number" min="0" {...register('settings.khattaCreditLimit')} />
          <Input label="Invoice number prefix" {...register('settings.invoicePrefix')} />
        </div>
        <Button type="submit" loading={isSubmitting}>Save settings</Button>
      </form>
    </Card>
  );
}
