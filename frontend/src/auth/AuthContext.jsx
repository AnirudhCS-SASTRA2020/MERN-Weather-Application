import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    refreshMe();
  }, [refreshMe]);

  const register = useCallback(async ({ email, password }) => {
    const { data } = await api.post('/api/auth/register', { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, register, login, logout, refreshMe }),
    [user, loading, register, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
