import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Store } from 'lucide-react';
import { authService } from '../services/authService';
import { Button, Input } from '../components/ui';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ password }) => {
    setServerError('');
    try {
      await authService.resetPassword({ token, password });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to reset password.');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-sunken)] px-4">
        <p className="text-sm text-[var(--color-danger-600)]">
          This reset link is missing a token. Please request a new one from{' '}
          <Link to="/forgot-password" className="underline">the forgot password page</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-sunken)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-xl bg-[var(--color-brand-500)] flex items-center justify-center text-white mb-3">
            <Store size={22} />
          </div>
          <h1 className="font-display font-extrabold text-xl text-[var(--color-ink)]">Choose a new password</h1>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
          {done ? (
            <p className="text-sm text-[var(--color-brand-700)]">Password updated. Redirecting to log in…</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>
              )}
              <Input
                label="New password"
                type="password"
                placeholder="At least 8 characters"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Must be at least 8 characters' },
                })}
              />
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Reset password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
