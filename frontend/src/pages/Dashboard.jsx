import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { CityMap } from '../components/CityMap';
import { LineChartCard } from '../components/LineChartCard';
import { WeatherSummary } from '../components/WeatherSummary';
import { getActiveCity, setActiveCity, STORAGE_KEYS } from '../utils/storage';

export function Dashboard() {
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pollingMinutes, setPollingMinutes] = useState(10);

  const modeLabel = useMemo(() => (user ? 'Authenticated' : 'Guest'), [user]);

  useEffect(() => {
    let mounted = true;

    async function fetchWeatherFor(cityName) {
      const res = user
        ? await api.get('/api/weather/city', { params: { query: cityName } })
        : await api.get('/api/weather/public/city', { params: { query: cityName } });
      return res.data;
    }

    async function load() {
      setLoading(true);
      setError('');
      try {
        if (user) {
          const pending = localStorage.getItem(STORAGE_KEYS.pendingCity);
          if (pending) {
            localStorage.removeItem(STORAGE_KEYS.pendingCity);
            const payload = await fetchWeatherFor(pending);
            if (mounted) {
              setData(payload);
              setActiveCity(payload?.location?.name || pending);
            }
            return;
          }

          const city = getActiveCity();
          const payload = await fetchWeatherFor(city);
          if (mounted) {
            setData(payload);
            setActiveCity(payload?.location?.name || city);
          }
          return;
        }

        const city = getActiveCity() || 'New York';
        const payload = await fetchWeatherFor(city);
        if (mounted) {
          setData(payload);
          setActiveCity(payload?.location?.name || city);
        }
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err.message || 'Failed to load weather');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!pollingMinutes) return;
    const id = setInterval(async () => {
      try {
        const city = getActiveCity() || 'New York';
        const res = user
          ? await api.get('/api/weather/city', { params: { query: city } })
          : await api.get('/api/weather/public/city', { params: { query: city } });
        setData(res.data);
      } catch {
        // Ignore polling errors; UI will show next manual load
      }
    }, pollingMinutes * 60 * 1000);
    return () => clearInterval(id);
  }, [pollingMinutes, user]);

  async function onSearch(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (!user) setActiveCity(trimmed);

    setLoading(true);
    setError('');
    try {
      const res = user
        ? await api.get('/api/weather/city', { params: { query: trimmed } })
        : await api.get('/api/weather/public/city', { params: { query: trimmed } });
      setData(res.data);
      setActiveCity(res.data?.location?.name || trimmed);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  const chartData = useMemo(() => buildHourlyChartData(data, 24, 1), [data]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <div className="text-xs text-slate-600">Mode: {modeLabel}</div>
          </div>

          <div className="flex items-center gap-2">
            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-md bg-white/80 hover:bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-sky-600 hover:bg-sky-500 px-3 py-2 text-xs font-semibold text-white shadow-sm"
                >
                  Register
                </Link>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-600">Refresh</div>
              <select
                value={pollingMinutes}
                onChange={(e) => setPollingMinutes(Number(e.target.value))}
                className="rounded-md bg-white/80 border border-slate-200 px-2 py-2 text-xs outline-none focus:border-sky-500 shadow-sm"
              >
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={30}>30 min</option>
              </select>
            </div>
          </div>
        </div>

        <form onSubmit={onSearch} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city (e.g., London)"
            className="flex-1 rounded-md bg-white/80 border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 shadow-sm"
          />
          <button className="rounded-md bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm">
            Search
          </button>
        </form>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        ) : null}

        {loading ? (
          <div className="text-sm text-slate-700">Loading weather…</div>
        ) : (
          <>
            <WeatherSummary data={data} />

            <div className="grid gap-4 mt-2">
              <LineChartCard
                title="Next 24 hours — Temperature (°C)"
                data={chartData}
                lines={[{ key: 'temp', color: '#38bdf8' }]}
              />
              <LineChartCard
                title="Next 24 hours — Wind speed (m/s)"
                data={chartData}
                lines={[{ key: 'wind', color: '#a78bfa' }]}
              />
              <CityMap location={data?.location} />
            </div>
          </>
        )}

        {!user ? (
          <div className="text-xs text-slate-600">Tip: You can search any city in guest mode.</div>
        ) : null}
      </div>
    </div>
  );
}

function buildHourlyChartData(payload, hours = 24, stepHours = 1) {
  const h = payload?.hourly;
  if (!h?.time || !h?.temperature_2m || !h?.wind_speed_10m) return [];

  const points = [];
  for (let i = 0; i < h.time.length && points.length < Math.ceil(hours / stepHours); i += stepHours) {
    const iso = h.time[i];
    const label = iso?.slice(11, 16);
    points.push({
      t: label,
      temp: h.temperature_2m[i],
      wind: h.wind_speed_10m[i],
    });
  }
  return points;
}
