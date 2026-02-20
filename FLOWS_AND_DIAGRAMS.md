# Flows and Diagrams (How the app works)

This document provides end-to-end diagrams for the major flows in the MERN Weather Application.

> Tip: Mermaid diagrams render nicely in VS Code Markdown Preview (and many PDF exporters).

---

## 1) System architecture (overview)

```mermaid
flowchart LR
  U[User (Browser)] -->|React UI| FE[Frontend (Vite + React)]
  FE -->|Axios + Cookies| BE[Backend (Express API)]
  BE -->|Mongoose| DB[(MongoDB)]
  BE -->|HTTP| OM[Open‑Meteo APIs]

  subgraph Open‑Meteo
    OM --> GEO[Geocoding API]
    OM --> FC[Forecast API]
  end
```

---

## 2) Guest dashboard flow (NYC default)

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant FE as Frontend
  participant BE as Backend
  participant OM as Open‑Meteo

  U->>FE: Open /
  FE->>BE: GET /api/weather/public/default
  BE->>OM: Forecast (coords for NYC)
  OM-->>BE: Forecast payload
  BE-->>FE: Normalized weather payload
  FE-->>U: Render summary + charts + map
```

---

## 3) Search redirect flow (guest → login → return)

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant FE as Frontend
  participant BE as Backend

  U->>FE: Enter city + click Search (guest)
  FE->>FE: Store pendingCity in localStorage
  FE-->>U: Navigate to /login

  U->>FE: Submit login
  FE->>BE: POST /api/auth/login
  BE-->>FE: Set httpOnly cookie + JSON user
  FE->>BE: GET /api/auth/me (session restore)
  BE-->>FE: JSON user

  FE->>FE: Read pendingCity
  FE->>BE: GET /api/weather/city?query=pendingCity
  BE-->>FE: Weather payload
  FE-->>U: Dashboard renders searched city
```

---

## 4) Auth flow (register / login / logout / me)

```mermaid
flowchart TD
  A[Register] -->|POST /api/auth/register| B{Gmail address?}
  B -- No --> E[400 Only gmail.com accounts]
  B -- Yes --> C[Hash password + create user]
  C --> D[Set JWT in httpOnly cookie]
  D --> OK[Return user JSON]

  L[Login] -->|POST /api/auth/login| V{Valid credentials?}
  V -- No --> X[401 Invalid credentials]
  V -- Yes --> D

  M[Me] -->|GET /api/auth/me| K{Valid cookie JWT?}
  K -- No --> U401[401 Not authenticated]
  K -- Yes --> U200[200 user JSON]

  O[Logout] -->|POST /api/auth/logout| CLR[Clear cookie]
```

---

## 5) City forecast flow (authenticated)

```mermaid
sequenceDiagram
  autonumber
  participant FE as Frontend
  participant BE as Backend
  participant OM as Open‑Meteo

  FE->>BE: GET /api/weather/city?query=London (cookie included)
  BE->>BE: requireAuth (verify JWT)
  BE->>OM: Geocode city name
  OM-->>BE: Candidate locations
  BE->>OM: Forecast by coordinates
  OM-->>BE: Forecast payload
  BE-->>FE: Normalized payload (current + hourly + daily + units)
```

---

## 6) Region flow (nearby cities in same country)

The backend:

- Finds the “base” city from the user query
- Uses a large city dataset (`all-the-cities`)
- Picks nearby cities by radius (fallback radius if needed)
- Fetches current weather for those cities with a concurrency limit

```mermaid
flowchart TD
  Q[Query city name] --> B[Base forecast lookup]
  B --> C[Base location: lat/lon + country code]
  C --> R[Select candidate cities within radius]
  R --> P[Sort by population + de-duplicate]
  P --> F[Fetch current weather for each city (concurrency limited)]
  F --> OUT[Return list + map markers]
```

---

## 7) Country flow (top cities by population)

```mermaid
flowchart TD
  Q[Query city name] --> B[Base forecast lookup]
  B --> CC[Extract country code]
  CC --> TOP[Pick top N cities in that country (population)]
  TOP --> F[Fetch current weather for each city (concurrency limited)]
  F --> OUT[Return list + map markers]
```

---

## 8) Monthly flow (daily snapshots → aggregation)

Monthly is built on a snapshot strategy:

- One snapshot per day per user + coordinates + date
- Upsert prevents duplicates
- Monthly endpoint reads the snapshots and aggregates

```mermaid
sequenceDiagram
  autonumber
  participant FE as Frontend
  participant BE as Backend
  participant DB as MongoDB
  participant OM as Open‑Meteo

  FE->>BE: GET /api/history/monthly?query=London&months=1
  BE->>BE: requireAuth (verify JWT)
  BE->>OM: Geocode + forecast to determine coords
  OM-->>BE: Forecast payload

  BE->>BE: For each day: compute summary fields
  BE->>DB: Upsert WeatherSnapshot (unique by user+coords+date)
  DB-->>BE: Write OK

  BE->>DB: Query snapshots for time range
  DB-->>BE: Snapshot docs
  BE-->>FE: Aggregated monthly response
```
