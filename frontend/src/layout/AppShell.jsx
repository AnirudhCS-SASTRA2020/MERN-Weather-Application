import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/hourly', label: 'Hourly' },
  { to: '/weekly', label: 'Weekly' },
  { to: '/monthly', label: 'Monthly' },
  { to: '/region', label: 'Region' },
  { to: '/country', label: 'Country' },
];

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="flex">
        <aside className="w-64 shrink-0 border-r border-slate-200 bg-white/70 backdrop-blur">
          <div className="p-4 border-b border-slate-200">
            <div className="text-lg font-semibold text-slate-900">Weather</div>
            <div className="text-xs text-slate-600 break-all">
              {user?.username ? `${user.username} • ` : ''}{user?.email}
            </div>
          </div>
          <nav className="p-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm ${
                    isActive ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={logout}
              className="w-full px-3 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-sm"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
