import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState('');
  const csrfInFlightRef = useRef(null);
  const refreshInFlightRef = useRef(null);

  const setAccessToken = useCallback((token) => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      // eslint-disable-next-line no-param-reassign
      delete api.defaults.headers.common.Authorization;
    }
  }, []);

  const ensureCsrf = useCallback(async () => {
    if (csrfToken) {
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      return csrfToken;
    }

    if (csrfInFlightRef.current) {
      return csrfInFlightRef.current;
    }

    csrfInFlightRef.current = (async () => {
      const { data } = await api.get('/api/auth/csrf');
      setCsrfToken(data.csrfToken);
      api.defaults.headers.common['X-CSRF-Token'] = data.csrfToken;
      return data.csrfToken;
    })();

    try {
      return await csrfInFlightRef.current;
    } finally {
      csrfInFlightRef.current = null;
    }
  }, [csrfToken]);

  const refreshSession = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    refreshInFlightRef.current = (async () => {
      await ensureCsrf();
      const { data } = await api.post('/api/auth/refresh');
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.user;
    })();

    try {
      return await refreshInFlightRef.current;
    } finally {
      refreshInFlightRef.current = null;
    }
  }, [ensureCsrf, setAccessToken]);

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshSession();
      } catch {
        setAccessToken('');
        setUser(null);
        try {
          await ensureCsrf();
        } catch {
          // ignore
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [ensureCsrf, refreshSession, setAccessToken]);

  const register = useCallback(async ({ username, email, phone, password }) => {
    await ensureCsrf();
    const { data } = await api.post('/api/auth/register', { username, email, phone, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, [ensureCsrf, setAccessToken]);

  const login = useCallback(async ({ email, password }) => {
    await ensureCsrf();
    const { data } = await api.post('/api/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, [ensureCsrf, setAccessToken]);

  const logout = useCallback(async () => {
    await ensureCsrf();
    await api.post('/api/auth/logout');
    setAccessToken('');
    setUser(null);
  }, [ensureCsrf, setAccessToken]);

  const requestVerifyEmail = useCallback(async () => {
    await ensureCsrf();
    await api.post('/api/auth/verify-email/request');
  }, [ensureCsrf]);

  const confirmVerifyEmail = useCallback(
    async ({ token }) => {
      await ensureCsrf();
      await api.post('/api/auth/verify-email/confirm', { token });
      try {
        await refreshMe();
      } catch {
        // ignore
      }
    },
    [ensureCsrf, refreshMe]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      register,
      login,
      logout,
      refreshMe,
      refreshSession,
      requestVerifyEmail,
      confirmVerifyEmail,
    }),
    [
      user,
      loading,
      register,
      login,
      logout,
      refreshMe,
      refreshSession,
      requestVerifyEmail,
      confirmVerifyEmail,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
