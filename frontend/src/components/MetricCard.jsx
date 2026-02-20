import { useMemo, useState } from 'react';
import { cToF, msToMph, round } from '../utils/units';

export function MetricCard({ label, kind, value, unit }) {
  const [alt, setAlt] = useState(false);

  const display = useMemo(() => {
    if (value === null || value === undefined) return { v: '—', u: '' };

    if (kind === 'temp') {
      const v = alt ? round(cToF(value), 1) : round(value, 1);
      return { v: v ?? '—', u: alt ? '°F' : '°C' };
    }

    if (kind === 'wind') {
      const v = alt ? round(msToMph(value), 1) : round(value, 1);
      return { v: v ?? '—', u: alt ? 'mph' : (unit || 'm/s') };
    }

    if (kind === 'pressure') {
      // baseline: hPa
      const v = alt ? round(value * 0.029529983071445, 2) : round(value, 0);
      return { v: v ?? '—', u: alt ? 'inHg' : (unit || 'hPa') };
    }

    if (kind === 'visibility') {
      // baseline: meters
      const km = value / 1000;
      const v = alt ? round(km * 0.621371, 1) : round(km, 1);
      return { v: v ?? '—', u: alt ? 'mi' : 'km' };
    }

    if (kind === 'precip') {
      // baseline: mm
      const v = alt ? round(value / 25.4, 2) : round(value, 1);
      return { v: v ?? '—', u: alt ? 'in' : (unit || 'mm') };
    }

    const v = round(value, 1);
    return { v: v ?? '—', u: unit || '' };
  }, [alt, kind, unit, value]);

  const canToggle = kind === 'temp' || kind === 'wind' || kind === 'pressure' || kind === 'visibility' || kind === 'precip';

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-slate-600">{label}</div>
        {canToggle ? (
          <button
            type="button"
            onClick={() => setAlt((x) => !x)}
            className="text-[11px] px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            aria-label={`Toggle units for ${label}`}
          >
            {kind === 'temp'
              ? alt
                ? '°C'
                : '°F'
              : kind === 'wind'
                ? alt
                  ? 'm/s'
                  : 'mph'
                : kind === 'pressure'
                  ? alt
                    ? 'hPa'
                    : 'inHg'
                  : kind === 'visibility'
                    ? alt
                      ? 'km'
                      : 'mi'
                    : alt
                      ? 'mm'
                      : 'in'}
          </button>
        ) : null}
      </div>

      <div className="mt-1 text-lg font-semibold">
        {display.v}
        {display.u ? <span className="text-sm text-slate-600"> {display.u}</span> : null}
      </div>
    </div>
  );
}
