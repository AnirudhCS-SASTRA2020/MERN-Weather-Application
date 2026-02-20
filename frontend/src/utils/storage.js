export const STORAGE_KEYS = {
  pendingCity: 'wm_pending_city',
  activeCity: 'wm_active_city',
};

export function getActiveCity() {
  return localStorage.getItem(STORAGE_KEYS.activeCity) || 'New York';
}

export function setActiveCity(city) {
  localStorage.setItem(STORAGE_KEYS.activeCity, city);
}
