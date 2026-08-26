import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function RequirePermission({ permission, children }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center px-4">
        <p className="text-lg font-semibold text-[var(--color-ink)]">You don't have access to this page</p>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">Ask your business owner or admin to grant this permission.</p>
      </div>
    );
  }
  return children;
}

export function FullPageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-[var(--color-surface-sunken)]">
      <div className="h-8 w-8 rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent animate-spin" />
    </div>
  );
}
