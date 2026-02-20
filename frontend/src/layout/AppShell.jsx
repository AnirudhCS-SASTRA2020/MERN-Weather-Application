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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950/60 backdrop-blur">
          <div className="p-4 border-b border-slate-800">
            <div className="text-lg font-semibold">Weather MERN</div>
            <div className="text-xs text-slate-400 break-all">{user?.email}</div>
          </div>
          <nav className="p-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm ${
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={logout}
              className="w-full px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
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
