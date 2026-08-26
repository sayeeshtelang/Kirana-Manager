import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BusinessSwitcher() {
  const { businesses, currentBusinessId, currentMembership, switchBusiness } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (businesses.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-brand-50)] text-[var(--color-brand-700)]">
        <Store size={16} />
        <span className="text-sm font-medium truncate max-w-[160px]">{currentMembership?.name || 'Loading…'}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-brand-50)] text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)] transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Store size={16} />
        <span className="text-sm font-medium truncate max-w-[160px]">{currentMembership?.name}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 mt-2 w-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg py-1 z-50"
        >
          <p className="px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] uppercase tracking-wide">
            Switch business
          </p>
          {businesses.map((b) => (
            <button
              key={b.businessId}
              role="option"
              aria-selected={b.businessId === currentBusinessId}
              onClick={() => {
                switchBusiness(b.businessId);
                setOpen(false);
                window.location.href = '/dashboard';
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--color-surface-sunken)] text-left"
            >
              <span className="flex flex-col">
                <span className="font-medium">{b.name}</span>
                <span className="text-xs text-[var(--color-ink-soft)] capitalize">{b.role.replace('_', ' ')}</span>
              </span>
              {b.businessId === currentBusinessId && <Check size={16} className="text-[var(--color-brand-600)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
