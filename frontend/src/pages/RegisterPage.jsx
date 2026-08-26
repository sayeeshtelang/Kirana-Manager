import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';

export default function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await registerAccount(values);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Unable to register. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-sunken)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-xl bg-[var(--color-brand-500)] flex items-center justify-center text-white mb-3">
            <Store size={22} />
          </div>
          <h1 className="font-display font-extrabold text-xl text-[var(--color-ink)]">Set up your business</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1 text-center">
            You'll be the Owner and can invite your staff afterwards.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
          {serverError && (
            <p className="text-sm text-[var(--color-danger-600)] bg-[var(--color-danger-50)] px-3 py-2 rounded-lg">{serverError}</p>
          )}
          <Input
            label="Business name"
            placeholder="Sharma General Store"
            error={errors.businessName?.message}
            {...register('businessName', { required: 'Business name is required' })}
          />
          <Input
            label="Your name"
            placeholder="Full name"
            error={errors.name?.message}
            {...register('name', { required: 'Your name is required' })}
          />
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
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Must be at least 8 characters' },
            })}
          />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Create business
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--color-ink-soft)] mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--color-brand-600)] font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
