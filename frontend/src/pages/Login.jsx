import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 p-6 text-slate-900 shadow-sm">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-xs text-slate-600 mt-1">Sign in to access saved features</p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-md bg-white border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="rounded-md bg-white border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          ) : null}

          <button
            disabled={loading}
            className="rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = `${API_BASE}/api/auth/google`;
            }}
            className="rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Continue with Google
          </button>
        </form>

        <div className="mt-4 text-xs text-slate-600">
          No account? <Link className="text-sky-700 hover:text-sky-600" to="/register">Register</Link>
        </div>

        <div className="mt-2 text-xs text-slate-600">
          Forgot password? <Link className="text-sky-700 hover:text-sky-600" to="/forgot-password">Reset</Link>
        </div>
      </div>
    </div>
  );
}
