import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function Register() {
  const { register } = useAuth();
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
      await register({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h1 className="text-2xl font-semibold">Register</h1>
        <p className="text-xs text-slate-400 mt-1">Only gmail.com emails are allowed</p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-md bg-slate-900 border border-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-600"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 chars)"
            type="password"
            className="rounded-md bg-slate-900 border border-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-600"
          />

          {error ? (
            <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>
          ) : null}

          <button
            disabled={loading}
            className="rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-60 px-4 py-2 text-sm font-semibold"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-xs text-slate-400">
          Have an account? <Link className="text-sky-400 hover:text-sky-300" to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
