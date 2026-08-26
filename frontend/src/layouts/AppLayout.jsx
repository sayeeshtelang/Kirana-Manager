import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, UserCircle2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS, ACCOUNT_NAV_ITEM } from '../config/nav';
import BusinessSwitcher from '../components/BusinessSwitcher';

export default function AppLayout() {
  const { user, hasPermission, role, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission));

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const SidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-[var(--color-border)]">
        <h1 className="font-display font-extrabold text-lg text-[var(--color-brand-700)]">Kirana Manager</h1>
        <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">Grocery store management</p>
      </div>

      <div className="px-4 py-3">
        <BusinessSwitcher />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-brand-500)] text-white'
                  : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-[var(--color-border)] space-y-0.5">
        <NavLink
          to={ACCOUNT_NAV_ITEM.to}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-[var(--color-surface-sunken)] text-[var(--color-ink)]' : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-sunken)]'
            }`
          }
        >
          <UserCircle2 size={17} />
          My Profile
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-danger-600)] hover:bg-[var(--color-danger-50)] transition-colors"
        >
          <LogOut size={17} />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[var(--color-surface-sunken)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)]">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-[var(--color-surface)] flex flex-col shadow-xl">
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <button className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--color-ink-soft)]">{user?.name}</span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--color-accent-100)] text-[var(--color-accent-600)] text-xs font-semibold capitalize">
              {role?.replace('_', ' ')}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
