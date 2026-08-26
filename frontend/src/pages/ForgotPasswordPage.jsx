import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { authService } from '../services/authService';
import { Button, Input } from '../components/ui';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email }) => {
    setServerError('');
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-sunken)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-xl bg-[var(--color-brand-500)] flex items-center justify-center text-white mb-3">
            <Store size={22} />
          </div>
          <h1 className="font-display font-extrabold text-xl text-[var(--color-ink)]">Reset your password</h1>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
          {sent ? (
            <p className="text-sm text-[var(--color-ink)]">
              If an account with that email exists, we've sent a reset link. Check your inbox.
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>
              )}
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email', { required: 'Email is required' })}
              />
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Send reset link
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[var(--color-ink-soft)] mt-4">
          <Link to="/login" className="text-[var(--color-brand-600)] font-medium hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
