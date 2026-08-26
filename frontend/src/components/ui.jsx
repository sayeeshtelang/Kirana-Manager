// Small shared UI primitives used across every page, so every module
// (products, customers, bills, etc.) looks and behaves consistently.
import { Loader2 } from 'lucide-react';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-ink)]">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Button({ variant = 'primary', size = 'md', loading, className = '', children, ...props }) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-2.5 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  const variants = {
    primary: 'bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)]',
    secondary: 'bg-[var(--color-surface-sunken)] text-[var(--color-ink)] hover:bg-[var(--color-border)]',
    danger: 'bg-[var(--color-danger-500)] text-white hover:bg-[var(--color-danger-600)]',
    ghost: 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunken)]',
    accent: 'bg-[var(--color-accent-500)] text-white hover:bg-[var(--color-accent-600)]',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-[var(--color-ink)] mb-1">{label}</span>}
      <input
        className={`w-full px-3 py-2 rounded-lg border text-sm bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40 focus:border-[var(--color-brand-500)] ${
          error ? 'border-[var(--color-danger-500)]' : 'border-[var(--color-border)]'
        } ${className}`}
        {...props}
      />
      {error && <span className="block text-xs text-[var(--color-danger-500)] mt-1">{error}</span>}
    </label>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-[var(--color-ink)] mb-1">{label}</span>}
      <select
        className={`w-full px-3 py-2 rounded-lg border text-sm bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40 focus:border-[var(--color-brand-500)] ${
          error ? 'border-[var(--color-danger-500)]' : 'border-[var(--color-border)]'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="block text-xs text-[var(--color-danger-500)] mt-1">{error}</span>}
    </label>
  );
}

export function Badge({ tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-soft)]',
    brand: 'bg-[var(--color-brand-50)] text-[var(--color-brand-700)]',
    accent: 'bg-[var(--color-accent-100)] text-[var(--color-accent-600)]',
    danger: 'bg-[var(--color-danger-50)] text-[var(--color-danger-600)]',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <p className="font-semibold text-[var(--color-ink)]">{title}</p>
      {description && <p className="text-sm text-[var(--color-ink-soft)] mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <p className="font-semibold text-[var(--color-danger-600)]">Something went wrong</p>
      <p className="text-sm text-[var(--color-ink-soft)] mt-1">{message || 'Please try again.'}</p>
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={22} className="animate-spin text-[var(--color-brand-500)]" />
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-[var(--color-surface)] rounded-xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-ink)]">{title}</h2>
          <button onClick={onClose} className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]" aria-label="Close">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function formatINR(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
}
