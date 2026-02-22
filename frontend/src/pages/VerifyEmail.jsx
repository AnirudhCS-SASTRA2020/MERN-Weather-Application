import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function VerifyEmail() {
  const { user, confirmVerifyEmail, requestVerifyEmail, refreshMe } = useAuth();
  const [params] = useSearchParams();

  const token = useMemo(() => params.get('token') || '', [params]);

  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;

    (async () => {
      setBusy(true);
      setError('');
      setStatus('Verifying…');
      try {
        await confirmVerifyEmail({ token });
        await refreshMe();
        setStatus('Email verified. You can continue.');
      } catch (err) {
        setStatus('');
        setError(err?.response?.data?.message || err.message || 'Verification failed');
      } finally {
        setBusy(false);
      }
    })();
  }, [confirmVerifyEmail, refreshMe, token]);

  async function onResend() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      await requestVerifyEmail();
      setStatus('Verification email sent.');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to send email');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 p-6 text-slate-900 shadow-sm">
        <h1 className="text-2xl font-semibold">Verify email</h1>
        <p className="text-xs text-slate-600 mt-1">
          {user?.email ? `Signed in as ${user.email}` : 'Open the verification link from your email.'}
        </p>

        {status ? (
          <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">{status}</div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        ) : null}

        <div className="mt-6 grid gap-2">
          {user && user.role !== 'admin' && !user.emailVerified ? (
            <button
              type="button"
              disabled={busy}
              onClick={onResend}
              className="rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white"
            >
              {busy ? 'Sending…' : 'Resend verification email'}
            </button>
          ) : null}

          <Link
            to={user ? '/dashboard' : '/login'}
            className="text-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Continue
          </Link>
        </div>
      </div>
    </div>
  );
}
