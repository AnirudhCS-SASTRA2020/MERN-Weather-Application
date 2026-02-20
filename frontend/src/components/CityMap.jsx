import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

export function CityMap({ location }) {
  const lat = location?.latitude;
  const lon = location?.longitude;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <div className="text-sm font-semibold">Map</div>
        <div className="text-xs text-slate-400">Click marker for details</div>
      </div>
      <div className="h-80">
        <MapContainer center={[lat, lon]} zoom={9} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lon]}>
            <Popup>
              {location?.name}
              {location?.admin1 ? `, ${location.admin1}` : ''}
              {location?.country ? `, ${location.country}` : ''}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
