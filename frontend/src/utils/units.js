export function cToF(c) {
  return (c * 9) / 5 + 32;
}

export function msToMph(ms) {
  return ms * 2.2369362920544;
}

export function round(value, digits = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}
