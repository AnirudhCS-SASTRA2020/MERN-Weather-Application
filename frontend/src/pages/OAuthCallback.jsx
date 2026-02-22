import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function OAuthCallback() {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        await refreshSession();
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'OAuth sign-in failed');
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate, refreshSession]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 p-6 text-slate-900 shadow-sm">
        <h1 className="text-2xl font-semibold">Signing you in…</h1>
        <p className="text-xs text-slate-600 mt-1">Completing Google OAuth</p>
        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        ) : null}
      </div>
    </div>
  );
}
