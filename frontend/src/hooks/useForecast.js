import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getActiveCity } from '../utils/storage';

export function useForecast() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const city = getActiveCity();
        const res = await api.get('/api/weather/city', { params: { query: city } });
        if (mounted) setData(res.data);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error, setData };
}
