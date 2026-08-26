import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { businessService } from '../services/businessService';
import { useAuth } from '../context/AuthContext';
import { Button, LoadingBlock } from '../components/ui';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { isAuthenticated, loading, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle | accepting | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return; // show login prompt below
    if (!token) {
      setStatus('error');
      setMessage('This invite link is missing a token.');
      return;
    }

    (async () => {
      setStatus('accepting');
      try {
        await businessService.acceptInvite(token);
        await refreshSession();
        setStatus('success');
        setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Unable to accept this invitation.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated, token]);

  if (loading) return <LoadingBlock />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-sunken)] px-4">
        <div className="text-center max-w-sm">
          <p className="font-semibold text-[var(--color-ink)]">Log in to accept this invitation</p>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Log in (or register) using the same email address the invite was sent to.
          </p>
          <Link to={`/login?redirect=/accept-invite?token=${token}`}>
            <Button className="mt-4">Go to log in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-sunken)] px-4">
      <div className="text-center max-w-sm">
        {status === 'accepting' && <p className="text-sm text-[var(--color-ink-soft)]">Accepting invitation…</p>}
        {status === 'success' && <p className="text-sm text-[var(--color-brand-700)] font-medium">Invitation accepted! Redirecting…</p>}
        {status === 'error' && <p className="text-sm text-[var(--color-danger-600)]">{message}</p>}
      </div>
    </div>
  );
}
