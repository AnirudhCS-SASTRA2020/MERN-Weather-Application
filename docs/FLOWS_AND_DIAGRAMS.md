# Flows and Diagrams (How the app works)

This document provides end-to-end diagrams for the major flows in the MERN Weather Application.

> Tip: Mermaid diagrams render nicely in VS Code Markdown Preview (and many PDF exporters).

---

## 1) System architecture (overview)

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant FE as Frontend
  participant BE as Backend API
  participant DB as MongoDB
  participant OM as Open-Meteo

  U->>FE: Use the web app
  FE->>BE: Call /api endpoints (cookies included)
  BE->>DB: Read/write users and snapshots
  BE->>OM: Fetch weather data (geocode + forecast)
  OM-->>BE: Weather payload
  DB-->>BE: Data result
  BE-->>FE: Normalized JSON response
  FE-->>U: Render UI (charts + maps)
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
sequenceDiagram
  autonumber
  participant U as User
  participant FE as Frontend
  participant BE as Backend
  participant DB as MongoDB

  note over U,BE: Register
  U->>FE: Submit register form
  FE->>BE: POST /api/auth/register
  BE->>BE: Validate gmail address
  alt Not gmail
    BE-->>FE: 400 Only gmail.com accounts
    FE-->>U: Show error
  else Gmail
    BE->>DB: Create user (hash password)
    DB-->>BE: User created
    BE-->>FE: Set httpOnly JWT cookie + user JSON
    FE-->>U: Logged in
  end

  note over U,BE: Login
  U->>FE: Submit login form
  FE->>BE: POST /api/auth/login
  BE->>DB: Validate credentials
  alt Invalid
    BE-->>FE: 401 Invalid credentials
    FE-->>U: Show error
  else Valid
    BE-->>FE: Set httpOnly JWT cookie + user JSON
    FE-->>U: Logged in
  end

  note over U,BE: Session check
  FE->>BE: GET /api/auth/me
  alt No or invalid cookie
    BE-->>FE: 401 Not authenticated
  else Valid cookie
    BE-->>FE: 200 user JSON
  end

  note over U,BE: Logout
  U->>FE: Click logout
  FE->>BE: POST /api/auth/logout
  BE-->>FE: Clear cookie
  FE-->>U: Logged out
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
sequenceDiagram
  autonumber
  participant FE as Frontend
  participant BE as Backend
  participant DS as City dataset
  participant OM as Open-Meteo

  FE->>BE: GET /api/weather/region?query=City
  BE->>BE: requireAuth
  BE->>OM: Geocode query city
  OM-->>BE: Base city (lat, lon, country code)
  BE->>DS: Filter cities in same country
  DS-->>BE: Candidate cities
  BE->>BE: Pick nearby cities within radius
  BE->>BE: Sort by population and dedupe
  loop For each selected city (limited concurrency)
    BE->>OM: Fetch current weather for city coords
    OM-->>BE: Current weather
  end
  BE-->>FE: List of cities + current + units
```

---

## 7) Country flow (top cities by population)

```mermaid
sequenceDiagram
  autonumber
  participant FE as Frontend
  participant BE as Backend
  participant DS as City dataset
  participant OM as Open-Meteo

  FE->>BE: GET /api/weather/country?query=City
  BE->>BE: requireAuth
  BE->>OM: Geocode query city
  OM-->>BE: Base city (country code)
  BE->>DS: Get cities for that country
  DS-->>BE: Candidate cities
  BE->>BE: Pick top N by population
  loop For each selected city (limited concurrency)
    BE->>OM: Fetch current weather for city coords
    OM-->>BE: Current weather
  end
  BE-->>FE: List of cities + current + units
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
