import { MetricCard } from './MetricCard';

export function WeatherSummary({ data }) {
  const loc = data?.location;
  const current = data?.current;

  if (!data) return null;

  return (
    <div className="grid gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">
            {loc?.name}{loc?.admin1 ? `, ${loc.admin1}` : ''}{loc?.country ? `, ${loc.country}` : ''}
          </div>
          <div className="text-xs text-slate-400">Source: {data.source} • {new Date(data.fetchedAt).toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Timezone</div>
          <div className="text-sm">{data.timezone}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Temperature"
          kind="temp"
          value={current?.temperature_2m}
          unit={data?.units?.current_units?.temperature_2m}
        />
        <MetricCard
          label="Feels like"
          kind="temp"
          value={current?.apparent_temperature}
          unit={data?.units?.current_units?.apparent_temperature}
        />
        <MetricCard
          label="Wind speed"
          kind="wind"
          value={current?.wind_speed_10m}
          unit={data?.units?.current_units?.wind_speed_10m}
        />
        <MetricCard
          label="Wind gusts"
          kind="wind"
          value={current?.wind_gusts_10m}
          unit={data?.units?.current_units?.wind_gusts_10m}
        />
        <MetricCard
          label="Humidity"
          kind="other"
          value={current?.relative_humidity_2m}
          unit={data?.units?.current_units?.relative_humidity_2m}
        />
        <MetricCard
          label="Precipitation"
          kind="precip"
          value={current?.precipitation}
          unit={data?.units?.current_units?.precipitation}
        />
        <MetricCard
          label="Pressure"
          kind="pressure"
          value={current?.pressure_msl}
          unit={data?.units?.current_units?.pressure_msl}
        />
        <MetricCard
          label="Visibility"
          kind="visibility"
          value={current?.visibility}
          unit={data?.units?.current_units?.visibility}
        />
        <MetricCard
          label="Direction"
          kind="other"
          value={current?.wind_direction_10m}
          unit={data?.units?.current_units?.wind_direction_10m}
        />
      </div>
    </div>
  );
}
