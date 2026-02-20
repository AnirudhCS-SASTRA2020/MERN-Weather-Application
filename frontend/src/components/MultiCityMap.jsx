import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

export function MultiCityMap({ cities }) {
  const points = (cities || [])
    .map((c) => ({
      name: c?.location?.name,
      lat: c?.location?.latitude,
      lon: c?.location?.longitude,
      current: c?.current,
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  if (!points.length) return null;

  const center = [points[0].lat, points[0].lon];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <div className="text-sm font-semibold">Map</div>
        <div className="text-xs text-slate-400">Top cities as markers</div>
      </div>
      <div className="h-96">
        <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p) => (
            <Marker key={`${p.name}-${p.lat}-${p.lon}`} position={[p.lat, p.lon]}>
              <Popup>
                <div className="text-sm font-semibold">{p.name}</div>
                {p.current?.temperature_2m !== undefined ? (
                  <div className="text-xs">Temp: {p.current.temperature_2m} °C</div>
                ) : null}
                {p.current?.wind_speed_10m !== undefined ? (
                  <div className="text-xs">Wind: {p.current.wind_speed_10m} m/s</div>
                ) : null}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
