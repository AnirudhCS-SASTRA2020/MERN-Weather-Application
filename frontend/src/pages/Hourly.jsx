import { useMemo, useState } from 'react';
import { CityMap } from '../components/CityMap';
import { LineChartCard } from '../components/LineChartCard';
import { WeatherSummary } from '../components/WeatherSummary';
import { useForecast } from '../hooks/useForecast';

export function Hourly() {
  const { data, loading, error } = useForecast();
  const [stepHours, setStepHours] = useState(1);

  const chartData = useMemo(() => buildHourly(data, 48, stepHours), [data, stepHours]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hourly</h1>
          <div className="text-xs text-slate-600">Timeframe: {stepHours} hour step</div>
        </div>
        <select
          value={stepHours}
          onChange={(e) => setStepHours(Number(e.target.value))}
          className="rounded-md bg-white/80 border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500 shadow-sm"
        >
          <option value={1}>1 hour</option>
          <option value={4}>4 hours</option>
          <option value={8}>8 hours</option>
          <option value={12}>12 hours</option>
        </select>
      </div>

      <div className="mt-4 grid gap-4">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        ) : null}

        {loading ? <div className="text-sm text-slate-700">Loading…</div> : <WeatherSummary data={data} />}

        {!loading ? (
          <>
            <LineChartCard
              title="Temperature & feels-like (°C)"
              data={chartData}
              lines={[
                { key: 'temp', color: '#38bdf8' },
                { key: 'feels', color: '#fbbf24' },
              ]}
            />
            <LineChartCard
              title="Wind speed (m/s)"
              data={chartData}
              lines={[{ key: 'wind', color: '#a78bfa' }]}
            />
            <CityMap location={data?.location} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function buildHourly(payload, hours = 48, stepHours = 1) {
  const h = payload?.hourly;
  if (!h?.time) return [];
  const maxPoints = Math.ceil(hours / stepHours);

  const points = [];
  for (let i = 0; i < h.time.length && points.length < maxPoints; i += stepHours) {
    const iso = h.time[i];
    points.push({
      t: iso?.slice(5, 16).replace('T', ' '),
      temp: h.temperature_2m?.[i],
      feels: h.apparent_temperature?.[i],
      wind: h.wind_speed_10m?.[i],
    });
  }

  return points;
}
