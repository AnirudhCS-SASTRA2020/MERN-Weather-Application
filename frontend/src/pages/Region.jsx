import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { BarChartCard } from '../components/BarChartCard';
import { MultiCityMap } from '../components/MultiCityMap';
import { getActiveCity } from '../utils/storage';

export function Region() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const city = getActiveCity();
        const res = await api.get('/api/weather/region', { params: { query: city } });
        if (mounted) setPayload(res.data);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err.message || 'Failed to load region data');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const barData = useMemo(() => {
    const cities = payload?.cities || [];
    return cities
      .map((c) => ({
        name: c.location?.name,
        temp: c.current?.temperature_2m,
        wind: c.current?.wind_speed_10m,
      }))
      .filter((x) => x.name);
  }, [payload]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold">Region</h1>
      <div className="text-xs text-slate-600 mt-1">Today summary for top cities in your selected region.</div>

      <div className="mt-4 grid gap-4">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        ) : null}
        {loading ? <div className="text-sm text-slate-700">Loading…</div> : null}

        {!loading ? (
          <>
            <BarChartCard title="Temperature (°C)" data={barData} barKey="temp" color="#38bdf8" />
            <BarChartCard title="Wind speed (m/s)" data={barData} barKey="wind" color="#a78bfa" />
            <MultiCityMap cities={payload?.cities} />
            <div className="text-xs text-slate-600">Note: City lists are best-effort and may vary by data coverage.</div>
          </>
        ) : null}
      </div>
    </div>
  );
}
