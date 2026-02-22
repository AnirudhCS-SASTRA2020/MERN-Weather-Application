import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus('');
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/password/forgot', { email });
      setStatus(data?.message || 'If the account exists, an email was sent.');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 p-6 text-slate-900 shadow-sm">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="text-xs text-slate-600 mt-1">We’ll email you a reset link.</p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-md bg-white border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />

          {status ? (
            <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">{status}</div>
          ) : null}
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          ) : null}

          <button
            disabled={loading}
            className="rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white"
          >
            {loading ? 'Sending…' : 'Send reset email'}
          </button>
        </form>

        <div className="mt-4 text-xs text-slate-600">
          Back to <Link className="text-sky-700 hover:text-sky-600" to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
