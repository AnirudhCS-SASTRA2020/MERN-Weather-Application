import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { LineChartCard } from '../components/LineChartCard';
import { getActiveCity } from '../utils/storage';

export function Monthly() {
  const [months, setMonths] = useState(1);
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
        const res = await api.get('/api/history/monthly', { params: { query: city, months } });
        if (mounted) setPayload(res.data);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err.message || 'Failed to load monthly data');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [months]);

  const series = useMemo(() => {
    const snapshots = payload?.snapshots || [];
    return snapshots.map((s) => ({
      t: new Date(s.date).toISOString().slice(0, 10),
      max: s.summary?.temp_max_c,
      min: s.summary?.temp_min_c,
      precip: s.summary?.precip_mm,
      wind: s.summary?.wind_max_ms,
    }));
  }, [payload]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Monthly</h1>
          <div className="text-xs text-slate-600">Accumulates one snapshot per day as you use the app.</div>
        </div>
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="rounded-md bg-white/80 border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500 shadow-sm"
        >
          <option value={1}>1 month</option>
          <option value={2}>2 months</option>
          <option value={4}>4 months</option>
        </select>
      </div>

      <div className="mt-4 grid gap-4">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        ) : null}

        {loading ? <div className="text-sm text-slate-700">Loading…</div> : null}

        {!loading && !series.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700 shadow-sm">
            No snapshots yet for this city. Use the app daily and this view will populate automatically.
          </div>
        ) : null}

        {!loading && series.length ? (
          <>
            <LineChartCard
              title="Daily temperature max/min (°C)"
              data={series}
              lines={[
                { key: 'max', color: '#38bdf8' },
                { key: 'min', color: '#f87171' },
              ]}
            />
            <LineChartCard title="Daily precipitation (mm)" data={series} lines={[{ key: 'precip', color: '#22c55e' }]} />
            <LineChartCard title="Daily max wind (m/s)" data={series} lines={[{ key: 'wind', color: '#a78bfa' }]} />
          </>
        ) : null}
      </div>
    </div>
  );
}
