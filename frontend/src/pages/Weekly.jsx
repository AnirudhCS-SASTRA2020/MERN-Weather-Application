import { useMemo, useState } from 'react';
import { CityMap } from '../components/CityMap';
import { LineChartCard } from '../components/LineChartCard';
import { WeatherSummary } from '../components/WeatherSummary';
import { useForecast } from '../hooks/useForecast';

export function Weekly() {
  const { data, loading, error } = useForecast();
  const [groupDays, setGroupDays] = useState(1);

  const chartData = useMemo(() => buildDailyGroups(data, groupDays), [data, groupDays]);

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Weekly</h1>
          <div className="text-xs text-slate-400">Grouping: {groupDays} day</div>
        </div>
        <select
          value={groupDays}
          onChange={(e) => setGroupDays(Number(e.target.value))}
          className="rounded-md bg-slate-900 border border-slate-800 px-2 py-2 text-xs outline-none focus:border-slate-600"
        >
          <option value={1}>1 day</option>
          <option value={2}>2 days</option>
          <option value={4}>4 days</option>
        </select>
      </div>

      <div className="mt-4 grid gap-4">
        {error ? (
          <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>
        ) : null}

        {loading ? <div className="text-sm text-slate-300">Loading…</div> : <WeatherSummary data={data} />}

        {!loading ? (
          <>
            <LineChartCard
              title="Daily temperature range (°C)"
              data={chartData}
              lines={[
                { key: 'max', color: '#38bdf8' },
                { key: 'min', color: '#f87171' },
              ]}
            />
            <LineChartCard
              title="Daily precipitation sum (mm)"
              data={chartData}
              lines={[{ key: 'precip', color: '#22c55e' }]}
            />
            <CityMap location={data?.location} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function buildDailyGroups(payload, groupDays = 1) {
  const d = payload?.daily;
  if (!d?.time) return [];

  const points = [];
  for (let i = 0; i < d.time.length; i += groupDays) {
    const sliceEnd = Math.min(i + groupDays, d.time.length);
    const label = d.time[i];

    const maxArr = d.temperature_2m_max?.slice(i, sliceEnd) || [];
    const minArr = d.temperature_2m_min?.slice(i, sliceEnd) || [];
    const precipArr = d.precipitation_sum?.slice(i, sliceEnd) || [];

    const max = maxArr.length ? Math.max(...maxArr) : null;
    const min = minArr.length ? Math.min(...minArr) : null;
    const precip = precipArr.length ? precipArr.reduce((a, b) => a + b, 0) : null;

    points.push({
      t: label,
      max,
      min,
      precip,
    });
  }

  return points;
}
