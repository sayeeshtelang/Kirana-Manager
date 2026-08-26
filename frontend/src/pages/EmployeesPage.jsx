import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, UserX, KeyRound } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Button, Input, Select, Modal, Badge, EmptyState, ErrorState, LoadingBlock, formatINR } from '../components/ui';

const LOGIN_ROLES = ['admin', 'manager', 'cashier', 'inventory_staff'];

export default function EmployeesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('employees:manage');
  const canGrantLogin = hasPermission('business:manage_users');

  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setStatus('loading');
    employeeService.list()
      .then((data) => { setEmployees(data.employees); setStatus('success'); })
      .catch((err) => { setError(err.response?.data?.message); setStatus('error'); });
  };

  useEffect(load, []);

  const handleDelete = async () => {
    try {
      await employeeService.remove(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to delete employee.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Staff records — optionally grant login access so they can use the system with a role."
        actions={canManage && <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Add employee</Button>}
      />

      {status === 'loading' && <LoadingBlock />}
      {status === 'error' && <ErrorState message={error} />}

      {status === 'success' && employees.length === 0 && (
        <EmptyState title="No employees yet" description="Add staff records to track roles and salaries." action={canManage && <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add employee</Button>} />
      )}

      {status === 'success' && employees.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Position</th>
                <th className="px-4 py-3 font-medium">Salary</th>
                <th className="px-4 py-3 font-medium">Login access</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e._id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{e.name}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{e.position || '—'}</td>
                  <td className="px-4 py-3">{formatINR(e.monthlySalary)}/mo</td>
                  <td className="px-4 py-3">
                    {e.user ? (
                      <span className="inline-flex items-center gap-1 text-[var(--color-brand-600)] text-xs font-medium">
                        <KeyRound size={13} /> Enabled
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-ink-soft)]">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><Badge tone={e.status === 'active' ? 'brand' : 'danger'}>{e.status}</Badge></td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditing(e); setModalOpen(true); }} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-brand-600)]" aria-label="Edit"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(e)} className="p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-danger-600)]" aria-label="Delete"><UserX size={15} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <EmployeeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        employee={editing}
        canGrantLogin={canGrantLogin}
        onSaved={() => { setModalOpen(false); load(); }}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete employee">
        <p className="text-sm text-[var(--color-ink-soft)]">Delete <strong>{deleteTarget?.name}</strong> and their employee record?</p>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function EmployeeFormModal({ open, onClose, employee, canGrantLogin, onSaved }) {
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();
  const grantLogin = watch('grantLogin');
  const alreadyHasLogin = !!employee?.user;

  useEffect(() => {
    if (open) {
      reset(employee
        ? { name: employee.name, phone: employee.phone, email: employee.email, position: employee.position, monthlySalary: employee.monthlySalary, address: employee.address, grantLogin: false }
        : { name: '', phone: '', email: '', position: '', monthlySalary: 0, address: '', grantLogin: false, role: 'cashier' });
      setServerError('');
    }
  }, [open, employee, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      if (employee) {
        // Editing an existing HR record never changes login access here —
        // that's managed once, at creation time.
        const { grantLogin: _g, password: _p, role: _r, ...editable } = values;
        await employeeService.update(employee._id, editable);
      } else {
        await employeeService.create(values);
      }
      onSaved();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to save employee.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={employee ? 'Edit employee' : 'Add employee'} wide>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <Input label="Position" {...register('position')} />
          <Input label="Phone" {...register('phone')} />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email', { required: grantLogin ? 'Email is required to grant login access' : false })}
            disabled={alreadyHasLogin}
          />
          <Input label="Monthly salary (₹)" type="number" min="0" {...register('monthlySalary')} />
          <Input label="Address" {...register('address')} />
        </div>

        {!employee && canGrantLogin && (
          <div className="border-t border-[var(--color-border)] pt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
              <input type="checkbox" {...register('grantLogin')} />
              Grant login access to the system
            </label>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              They'll be able to log in immediately with the email and password below, and will see only what their role allows.
            </p>

            {grantLogin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <Input
                  label="Set a password"
                  type="password"
                  error={errors.password?.message}
                  {...register('password', { required: grantLogin ? 'Required' : false, minLength: { value: 8, message: 'Min 8 characters' } })}
                />
                <Select label="Role" {...register('role')}>
                  {LOGIN_ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </Select>
              </div>
            )}
          </div>
        )}

        {alreadyHasLogin && (
          <p className="text-xs text-[var(--color-ink-soft)] border-t border-[var(--color-border)] pt-3">
            This employee already has login access. Manage their role from Business Settings → Team members.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{employee ? 'Save changes' : 'Add employee'}</Button>
        </div>
      </form>
    </Modal>
  );
}
