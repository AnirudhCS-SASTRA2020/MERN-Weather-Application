# File Guide (What each file does)

This document explains the purpose of the key files/folders in the MERN Weather Application.

> Notes
>
>- `node_modules/` is intentionally not documented here.
>- If you’re reading this as a PDF, the main setup guide is in `README.md`.

---

## Top-level (repo root)

| Path | Purpose |
|---|---|
| `package.json` | Root scripts to run backend + frontend together using `concurrently`. |
| `package-lock.json` | Lockfile for the root dev dependency (`concurrently`). |
| `README.md` | Complete start-to-finish documentation (setup, usage, endpoints). |
| `FILE_GUIDE.md` | This file: explains each important file. |
| `FLOWS_AND_DIAGRAMS.md` | Mermaid diagrams for the main application flows. |
| `docs/pdf.css` | Optional CSS for Markdown → PDF export styling. |

---

## Backend (`backend/`)

### Backend entrypoints

| Path | Purpose |
|---|---|
| `backend/src/server.js` | Process entrypoint. Connects to MongoDB then starts the Express server. |
| `backend/src/app.js` | Creates the Express app: security middleware, CORS, JSON parsing, routes, error handling. |

### Configuration

| Path | Purpose |
|---|---|
| `backend/src/config/env.js` | Loads `.env` and exposes a typed `env` object (port, Mongo URI, JWT, CORS origin, cookie name). |
| `backend/src/config/db.js` | MongoDB connection helper (`connectDb`). |
| `backend/.env.example` | Example environment file. Copy to `.env` for local dev. |
| `backend/.env` | Your actual local environment file (should not be committed). |

### Routes (Express route registration)

| Path | Purpose |
|---|---|
| `backend/src/routes/authRoutes.js` | `/api/auth/*` endpoints: register, login, logout, me. |
| `backend/src/routes/weatherRoutes.js` | `/api/weather/*` endpoints: public default, city forecast, region, country. |
| `backend/src/routes/historyRoutes.js` | `/api/history/*` endpoints: monthly snapshot aggregation. |

### Controllers (request handlers)

| Path | Purpose |
|---|---|
| `backend/src/controllers/authController.js` | Auth logic: gmail check, password hashing, JWT cookie set/clear, `me` response. |
| `backend/src/controllers/weatherController.js` | Weather endpoints for default (NYC) and authenticated city forecast. |
| `backend/src/controllers/aggregateController.js` | Region/Country endpoints: selects many cities and fetches current weather with concurrency limits. Uses `all-the-cities`. |
| `backend/src/controllers/historyController.js` | Monthly endpoint: saves/reads daily snapshots and returns an aggregated view. |

### Middleware

| Path | Purpose |
|---|---|
| `backend/src/middleware/authMiddleware.js` | `requireAuth` reads the httpOnly JWT cookie and populates `req.user`. |
| `backend/src/middleware/errorMiddleware.js` | 404 handler + error-to-JSON handler. |

### Models (MongoDB)

| Path | Purpose |
|---|---|
| `backend/src/models/User.js` | User schema (email + password hash). |
| `backend/src/models/WeatherSnapshot.js` | Daily snapshot schema (per user + coords + date) used for Monthly view. |

### Services (external API + business logic)

| Path | Purpose |
|---|---|
| `backend/src/services/openMeteo.js` | Low-level client for Open‑Meteo geocoding + forecast/current endpoints. |
| `backend/src/services/weatherService.js` | Normalizes provider responses and caches results to avoid excessive API calls. |
| `backend/src/services/snapshotService.js` | Upserts and queries `WeatherSnapshot` documents for monthly aggregation. |

### Validation / helpers

| Path | Purpose |
|---|---|
| `backend/src/utils/validators.js` | Zod schemas for input validation and helpers like the Gmail check. |

---

## Frontend (`frontend/`)

### Frontend entrypoints

| Path | Purpose |
|---|---|
| `frontend/src/main.jsx` | React bootstrap: Router + AuthProvider + Leaflet icon fix for Vite bundling. |
| `frontend/src/App.jsx` | Route definitions. Public `/` shows Dashboard; authenticated routes are nested under `RequireAuth`. |

### API client

| Path | Purpose |
|---|---|
| `frontend/src/api/client.js` | Axios instance pointing at the backend, configured for cookie-based auth (`withCredentials`). |

### Authentication

| Path | Purpose |
|---|---|
| `frontend/src/auth/AuthContext.jsx` | Auth state provider: keeps `user` + `loading`, exposes `register/login/logout/refreshMe`. |
| `frontend/src/auth/useAuth.jsx` | Hook wrapper (`useAuth`) that reads the context. (Split for React Fast Refresh.) |
| `frontend/src/auth/RequireAuth.jsx` | Route guard that redirects unauthenticated users to `/login`. |

### Layout

| Path | Purpose |
|---|---|
| `frontend/src/layout/AppShell.jsx` | Sidebar + outlet layout for authenticated pages. |

### Pages (screens)

| Path | Purpose |
|---|---|
| `frontend/src/pages/Dashboard.jsx` | Guest NYC dashboard + authenticated city search; charts + map; polling refresh. |
| `frontend/src/pages/Hourly.jsx` | Hourly forecast view with stepping controls. |
| `frontend/src/pages/Weekly.jsx` | Daily/weekly view with grouping controls. |
| `frontend/src/pages/Monthly.jsx` | Monthly view driven by snapshot aggregation endpoint. |
| `frontend/src/pages/Region.jsx` | Multi-city “region” view using `/api/weather/region`. |
| `frontend/src/pages/Country.jsx` | Multi-city “country” view using `/api/weather/country`. |
| `frontend/src/pages/Login.jsx` | Login form + redirect/back behavior. |
| `frontend/src/pages/Register.jsx` | Registration form (gmail-only enforced by backend). |

### Components

| Path | Purpose |
|---|---|
| `frontend/src/components/WeatherSummary.jsx` | Current conditions grid (temp, humidity, wind, pressure, visibility, precipitation). |
| `frontend/src/components/MetricCard.jsx` | Individual metric card with unit toggle (per card). |
| `frontend/src/components/LineChartCard.jsx` | Recharts line chart wrapper used across pages. |
| `frontend/src/components/BarChartCard.jsx` | Recharts bar chart wrapper used across pages. |
| `frontend/src/components/CityMap.jsx` | Leaflet map for a single city. |
| `frontend/src/components/MultiCityMap.jsx` | Leaflet map for multiple cities (Region/Country). |

### Hooks and utilities

| Path | Purpose |
|---|---|
| `frontend/src/hooks/useForecast.js` | Reusable fetch hook for forecast endpoints with loading/error state. |
| `frontend/src/utils/storage.js` | LocalStorage helpers for active city and pending city search. |
| `frontend/src/utils/units.js` | Shared numeric helpers (rounding + some unit conversions). |

### Styling and tooling

| Path | Purpose |
|---|---|
| `frontend/src/index.css` | Tailwind CSS entry + global styles. |
| `frontend/tailwind.config.js` | Tailwind configuration. |
| `frontend/postcss.config.js` | PostCSS config for Tailwind. |
| `frontend/vite.config.js` | Vite configuration. |
| `frontend/eslint.config.js` | ESLint config. |

---

## Where to look first

- Want to understand auth? Start with `frontend/src/auth/AuthContext.jsx` and `backend/src/controllers/authController.js`.
- Want to understand weather fetching? Start with `frontend/src/pages/Dashboard.jsx` and `backend/src/services/weatherService.js`.
- Want to understand the monthly design? Start with `backend/src/models/WeatherSnapshot.js` and `backend/src/services/snapshotService.js`.
