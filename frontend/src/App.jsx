import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth/RequireAuth';
import { AppShell } from './layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Hourly } from './pages/Hourly';
import { Login } from './pages/Login';
import { Monthly } from './pages/Monthly';
import { Register } from './pages/Register';
import { Weekly } from './pages/Weekly';
import { Region } from './pages/Region';
import { Country } from './pages/Country';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-white text-slate-900">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/hourly" element={<Hourly />} />
          <Route path="/weekly" element={<Weekly />} />
          <Route path="/monthly" element={<Monthly />} />
          <Route path="/region" element={<Region />} />
          <Route path="/country" element={<Country />} />
        </Route>

        {/* Public guest dashboard */}
        <Route path="/" element={<Dashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
