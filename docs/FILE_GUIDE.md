# File Guide (What each file does)

This document explains the purpose of the key files/folders in the MERN Weather Application.

> Notes
>
>- `node_modules/` is intentionally not documented here.
>- If you’re reading this as a PDF, the main setup guide is in `docs/README.md`.

---

## Top-level (repo root)

| Path | Purpose |
|---|---|
| `package.json` | Root scripts to run backend + frontend together using `concurrently`. |
| `package-lock.json` | Lockfile for the root dev dependency (`concurrently`). |
| `docs/README.md` | Complete start-to-finish documentation (setup, usage, endpoints). |
| `docs/FILE_GUIDE.md` | This file: explains each important file. |
| `docs/FLOWS_AND_DIAGRAMS.md` | Mermaid diagrams for the main application flows. |
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
| `backend/src/routes/authRoutes.js` | `/api/auth/*` endpoints: csrf, register/login, refresh, logout, email verification, password reset, Google OAuth. |
| `backend/src/routes/adminRoutes.js` | `/api/admin/*` endpoints (admin only): revoke sessions by session or by user. |
| `backend/src/routes/weatherRoutes.js` | `/api/weather/*` endpoints: public default, public city, city forecast, region, country. |
| `backend/src/routes/historyRoutes.js` | `/api/history/*` endpoints: monthly snapshot aggregation. |

### Controllers (request handlers)

| Path | Purpose |
|---|---|
| `backend/src/controllers/authController.js` | Advanced auth: access/refresh tokens, refresh rotation, sessions, email verification, password reset, Google OAuth auto-link. |
| `backend/src/controllers/adminController.js` | Admin revocation: revoke by `{userId, sessionId}` and revoke all by `{userId}`. |
| `backend/src/controllers/weatherController.js` | Weather endpoints for default (NYC), guest city forecast, and authenticated city forecast. |
| `backend/src/controllers/aggregateController.js` | Region/Country endpoints: selects many cities and fetches current weather with concurrency limits. Uses `all-the-cities`. |
| `backend/src/controllers/historyController.js` | Monthly endpoint: saves/reads daily snapshots and returns an aggregated view. |

### Middleware

| Path | Purpose |
|---|---|
| `backend/src/middleware/authMiddleware.js` | `requireAuth` validates `Authorization: Bearer <accessToken>` and checks session existence. |
| `backend/src/middleware/verificationMiddleware.js` | Blocks non-admin users until `emailVerified=true`. |
| `backend/src/middleware/rbacMiddleware.js` | Role-based access control (`requireRole`). |
| `backend/src/middleware/csrfMiddleware.js` | Double-submit CSRF cookie + `X-CSRF-Token` header validation. |
| `backend/src/middleware/rateLimiters.js` | Route-specific limiters (auth/refresh/email). |
| `backend/src/middleware/requestIdMiddleware.js` | Adds request IDs for tracing (`X-Request-Id`). |
| `backend/src/middleware/validateMiddleware.js` | Zod validation helper (reusable request validator). |
| `backend/src/middleware/errorMiddleware.js` | 404 + structured error JSON `{ requestId, code, message, details? }`. |

### Models (MongoDB)

| Path | Purpose |
|---|---|
| `backend/src/models/User.js` | User schema (username, email, phone + password hash). |
| `backend/src/models/Session.js` | Refresh-session storage (hashed refresh token + revoke fields + TTL). |
| `backend/src/models/WeatherSnapshot.js` | Daily snapshot schema (per user + coords + date) used for Monthly view. |

### Services (external API + business logic)

| Path | Purpose |
|---|---|
| `backend/src/services/openMeteo.js` | Low-level client for Open‑Meteo geocoding + forecast/current endpoints. |
| `backend/src/services/weatherService.js` | Normalizes provider responses and caches results to avoid excessive API calls. |
| `backend/src/services/snapshotService.js` | Upserts and queries `WeatherSnapshot` documents for monthly aggregation. |
| `backend/src/services/tokenService.js` | Signs/verifies access+refresh JWTs + token hashing helpers. |
| `backend/src/services/emailService.js` | SMTP2GO email sender for verification + password reset. |

### Scripts

| Path | Purpose |
|---|---|
| `backend/src/scripts/seedAdmin.js` | Creates/updates an admin user from env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, ...). |

### Validation / helpers

| Path | Purpose |
|---|---|
| `backend/src/utils/validators.js` | Zod schemas for input validation (auth, verification, password reset, revoke). |

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
| `frontend/src/api/client.js` | Axios instance pointing at the backend (`withCredentials` for refresh cookie); access token is sent via `Authorization` header. |

### Authentication

| Path | Purpose |
|---|---|
| `frontend/src/auth/AuthContext.jsx` | Auth provider: stores access token in memory, restores session via `/api/auth/refresh`, sets CSRF header. |
| `frontend/src/auth/useAuth.jsx` | Hook wrapper (`useAuth`) that reads the context. (Split for React Fast Refresh.) |
| `frontend/src/auth/RequireAuth.jsx` | Route guard that redirects unauthenticated users to `/login` and unverified users to `/verify-email` (admin bypass). |

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
| `frontend/src/pages/Login.jsx` | Login form. |
| `frontend/src/pages/Register.jsx` | Registration form. |
| `frontend/src/pages/VerifyEmail.jsx` | Email verification UI (confirm token + resend). |
| `frontend/src/pages/ForgotPassword.jsx` | Request a password reset email. |
| `frontend/src/pages/ResetPassword.jsx` | Set a new password using a reset token. |
| `frontend/src/pages/OAuthCallback.jsx` | Final step after Google OAuth redirect; calls `/api/auth/refresh`. |

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
| `frontend/src/utils/storage.js` | LocalStorage helper for active city (and a legacy pending city key). |
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
