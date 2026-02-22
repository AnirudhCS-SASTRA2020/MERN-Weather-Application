# MERN Weather Application (Open‑Meteo)

Localhost MERN Weather application with authentication, charts, maps, and multiple timeframes.

- Weather Provider: **Open‑Meteo** (no API key required)
- Backend: **Node.js + Express + MongoDB (Mongoose)**
- Frontend: **React (Vite) + Tailwind + Recharts + Leaflet**

---

## Features (What you can do)

### Guest mode

- Landing page (Dashboard) works without login
- Shows **New York** by default
- Guests can search any city and see live results (no login required)
- Quick access buttons: **Login** and **Register**

### Authenticated mode

- Local register/login using **access + refresh** tokens
- Access token is returned in JSON and sent as `Authorization: Bearer <token>`
- Refresh token is stored in an **httpOnly cookie** and rotated on refresh
- Email verification blocks protected routes for non-admin users
- Google OAuth login (auto-links accounts by email)
- Sidebar routes:
  - Dashboard (polling refresh, charts, map)
  - Hourly (time stepping)
  - Weekly (day grouping)
  - Monthly (1/2/4 months) using MongoDB daily snapshots
  - Region + Country (today summary across multiple cities with map markers)

### Unit toggles (per metric)

- Temperature: °C ↔ °F
- Wind speed: m/s ↔ mph
- Pressure: hPa ↔ inHg
- Visibility: km ↔ mi
- Precipitation: mm ↔ in

---

## Architecture (High level)

The frontend never calls Open‑Meteo directly.

1. React UI calls the Express API (`/api/...`).
2. Express proxies requests to Open‑Meteo and normalizes the response.
3. MongoDB stores:
   - Users
   - Daily weather snapshots for monthly aggregation

---

## Prerequisites

- Node.js 18+
- MongoDB running locally
- Ports free:
  - Frontend: `5173`
  - Backend: `5000`

---

## Getting started (Start → Finish)

### 1) Install dependencies

This repo is a small monorepo with `backend/` and `frontend/`.

On Windows PowerShell, you may need to use `npm.cmd` (because `npm.ps1` can be blocked by execution policy).

From the project root (this folder):

```bash
npm.cmd install
npm.cmd --prefix backend install
npm.cmd --prefix frontend install
```

### 2) Configure backend environment

Backend env file: `backend/.env`

Copy the example:

```bash
copy backend\.env.example backend\.env
```

Example contents:

```dotenv
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/weather_mern
JWT_SECRET=change_me_in_real_use
ACCESS_JWT_SECRET=change_me_in_real_use
REFRESH_JWT_SECRET=change_me_in_real_use
ACCESS_JWT_EXPIRES_IN=15m
REFRESH_JWT_EXPIRES_IN=30d
REFRESH_COOKIE_NAME=wm_refresh
CSRF_COOKIE_NAME=wm_csrf
CORS_ORIGIN=http://localhost:5173
FRONTEND_BASE_URL=http://localhost:5173
NODE_ENV=development

# SMTP2GO (required for verify/reset emails)
SMTP2GO_HOST=
SMTP2GO_PORT=2525
SMTP2GO_USER=
SMTP2GO_PASS=
SMTP_FROM=

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

Optional (seed an admin user):

```bash
npm.cmd --prefix backend run seed:admin
```

### 3) Start the app

From this folder:

```bash
npm.cmd run dev
```

This starts:

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

---

## Usage guide

### Guest flow

1. Open the app at `/`.
2. You will see New York weather.
3. Guests can search a city and see live results.

### Login / Register

After login/register:

- Backend returns `accessToken` in JSON
- Frontend stores it in memory and uses `Authorization: Bearer ...`
- Backend sets a refresh token in an httpOnly cookie
- On page reload, the frontend calls `/api/auth/refresh` to restore session

Email verification:

- Non-admin users must verify email to access protected weather/history endpoints
- Admin users bypass verification checks

### Searching cities

Both guests and authenticated users can search any city name supported by Open‑Meteo geocoding.

### Monthly data

Monthly values are based on MongoDB snapshots:

- One snapshot per day per user + city
- The monthly view aggregates these saved days

---

## API Reference

Base URL: `http://localhost:5000`

### Health

- `GET /api/health`

### Auth

- `GET /api/auth/csrf` → returns `{ csrfToken }` and sets CSRF cookie
- `POST /api/auth/register` → `{ username, email, phone, password }` → `{ user, accessToken }`
- `POST /api/auth/login` → `{ email, password }` → `{ user, accessToken }`
- `POST /api/auth/refresh` (requires CSRF header + refresh cookie) → `{ user, accessToken }`
- `POST /api/auth/logout` (requires auth + CSRF)
- `POST /api/auth/logout-all` (requires auth + CSRF)
- `GET /api/auth/me` (requires auth)
- `POST /api/auth/verify-email/request` (requires auth)
- `POST /api/auth/verify-email/confirm` → `{ token }`
- `POST /api/auth/password/forgot` → `{ email }`
- `POST /api/auth/password/reset` → `{ token, newPassword }`
- `GET /api/auth/google` → redirects to Google OAuth
- `GET /api/auth/google/callback` → redirects to frontend `/oauth/callback`

### Admin

- `POST /api/admin/sessions/revoke` → `{ userId, sessionId, reason? }` (admin)
- `POST /api/admin/users/revoke-sessions` → `{ userId, reason? }` (admin)

### Weather

- `GET /api/weather/public/default` (NYC, guest)
- `GET /api/weather/public/city?query=London` (guest)
- `GET /api/weather/city?query=London` (auth + verified)
- `GET /api/weather/region?query=London` (auth + verified)
  - Picks nearby cities in the same country using a radius-based approach and returns current weather for each.
- `GET /api/weather/country?query=London` (auth + verified)
  - Picks top cities in that country (by population) and returns current weather for each.

### History

- `GET /api/history/monthly?query=London&months=1` (auth + verified)

---

## Troubleshooting

### `npm` fails in PowerShell (execution policy)

Use `npm.cmd`:

```bash
npm.cmd run dev
```

### CORS / cookies not working

Ensure:

- Backend `CORS_ORIGIN` matches your frontend URL (`http://localhost:5173`)
- Requests include credentials (this app is configured to do that)

### MongoDB connection issues

Confirm MongoDB is running and `MONGODB_URI` is correct.

---

## PDF Preview / Export styling

If you use a Markdown-to-PDF tool (for example, VS Code “Markdown PDF”), you can apply a simple CSS stylesheet:

- CSS file: `docs/pdf.css`
- Configure your exporter to use that stylesheet when generating a PDF.

---

## Additional docs

- File-by-file guide: `FILE_GUIDE.md`
- Flow diagrams (Mermaid): `FLOWS_AND_DIAGRAMS.md`
