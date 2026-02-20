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
- If a guest tries to search a city, the app redirects to **Login**, then returns and runs the search after successful auth

### Authenticated mode

- Gmail-only register/login/logout using JWT stored in an **httpOnly cookie**
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
JWT_EXPIRES_IN=1h
COOKIE_NAME=wm_auth
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
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
3. Searching a city will redirect you to Login.

### Login / Register (Gmail-only)

The backend only allows emails ending with `@gmail.com`.

After login/register:

- The backend sets a JWT cookie (httpOnly).
- The frontend calls `/api/auth/me` to restore session.

### Searching cities

Authenticated users can search any city name supported by Open‑Meteo geocoding.

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

- `POST /api/auth/register` → `{ email, password }`
- `POST /api/auth/login` → `{ email, password }`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Weather

- `GET /api/weather/public/default` (NYC, guest)
- `GET /api/weather/city?query=London` (auth)
- `GET /api/weather/region?query=London` (auth)
  - Picks nearby cities in the same country using a radius-based approach and returns current weather for each.
- `GET /api/weather/country?query=London` (auth)
  - Picks top cities in that country (by population) and returns current weather for each.

### History

- `GET /api/history/monthly?query=London&months=1` (auth)

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
