import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await login(values);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to log in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-sunken)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-xl bg-[var(--color-brand-500)] flex items-center justify-center text-white mb-3">
            <Store size={22} />
          </div>
          <h1 className="font-display font-extrabold text-xl text-[var(--color-ink)]">Kirana Manager</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">Log in to your business</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
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
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />
          <div className="flex justify-end -mt-2">
            <Link to="/forgot-password" className="text-xs text-[var(--color-brand-600)] hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Log in
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--color-ink-soft)] mt-4">
          New here?{' '}
          <Link to="/register" className="text-[var(--color-brand-600)] font-medium hover:underline">
            Register your business
          </Link>
        </p>
      </div>
    </div>
  );
}
