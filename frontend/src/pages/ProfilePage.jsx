import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { profileService } from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader, Button, Input } from '../components/ui';

export default function ProfilePage() {
  const { user, refreshSession } = useAuth();
  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader title="My Profile" subtitle="Manage your personal account details." />
      <ProfileForm user={user} onSaved={refreshSession} />
      <PasswordForm />
    </div>
  );
}

function ProfileForm({ user, onSaved }) {
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { name: user?.name, phone: user?.phone },
  });

  const onSubmit = async (values) => {
    setServerError(''); setSaved(false);
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      if (values.phone) formData.append('phone', values.phone);
      if (avatarFile) formData.append('avatar', avatarFile);
      await profileService.update(formData);
      setSaved(true);
      onSaved();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to update profile.');
    }
  };

  return (
    <Card className="p-4">
      <p className="font-semibold text-[var(--color-ink)] mb-4">Account details</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>}
        {saved && <p className="text-sm text-[var(--color-brand-700)] bg-[var(--color-brand-50)] px-3 py-2 rounded-lg">Profile updated.</p>}
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-[var(--color-brand-100)] flex items-center justify-center text-[var(--color-brand-700)] font-bold text-lg">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="text-sm" />
        </div>
        <Input label="Full name" {...register('name', { required: true })} />
        <Input label="Phone" {...register('phone')} />
        <Input label="Email" value={user?.email} disabled />
        <Button type="submit" loading={isSubmitting}>Save changes</Button>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    setServerError(''); setSaved(false);
    try {
      await profileService.changePassword(values);
      setSaved(true);
      reset();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to change password.');
    }
  };

  return (
    <Card className="p-4">
      <p className="font-semibold text-[var(--color-ink)] mb-4">Change password</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>}
        {saved && <p className="text-sm text-[var(--color-brand-700)] bg-[var(--color-brand-50)] px-3 py-2 rounded-lg">Password changed. You'll need to log in again on other devices.</p>}
        <Input label="Current password" type="password" error={errors.currentPassword?.message} {...register('currentPassword', { required: 'Required' })} />
        <Input label="New password" type="password" error={errors.newPassword?.message} {...register('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
        <Button type="submit" loading={isSubmitting}>Update password</Button>
      </form>
    </Card>
  );
}
