import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';

export default function NoBusinessPage() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-sunken)] px-4">
      <div className="text-center max-w-sm">
        <p className="font-semibold text-[var(--color-ink)]">You're not part of any business yet</p>
        <p className="text-sm text-[var(--color-ink-soft)] mt-1">
          Ask a business owner to invite your email address, or register your own business.
        </p>
        <Button variant="secondary" className="mt-4" onClick={logout}>Log out</Button>
      </div>
    </div>
  );
}
