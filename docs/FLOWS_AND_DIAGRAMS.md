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
  FE->>BE: Call /api endpoints (Bearer access token; refresh cookie when needed)
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

## 3) Guest city search flow

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant FE as Frontend
  participant BE as Backend

  note over U,BE: Guest (no auth)

  U->>FE: Enter city + click Search (guest)
  FE->>BE: GET /api/weather/public/city?query=City
  BE-->>FE: Weather payload
  FE-->>U: Dashboard renders searched city
```

---

## 4) Auth flow (csrf / register / login / refresh / logout / me)

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant FE as Frontend
  participant BE as Backend
  participant DB as MongoDB

  note over FE,BE: CSRF setup (cookie-based refresh/logout protection)
  FE->>BE: GET /api/auth/csrf
  BE-->>FE: {csrfToken} + sets CSRF cookie

  note over U,BE: Register
  U->>FE: Submit register form
  FE->>BE: POST /api/auth/register (username,email,phone,password)
  BE->>DB: Create user (hash password)
  DB-->>BE: User created
  BE-->>FE: {user, accessToken} + sets refresh cookie
  FE-->>U: Logged in (but may be unverified)

  note over U,BE: Login
  U->>FE: Submit login form
  FE->>BE: POST /api/auth/login
  BE->>DB: Validate credentials
  alt Invalid
    BE-->>FE: 401 Invalid credentials
    FE-->>U: Show error
  else Valid
    BE-->>FE: {user, accessToken} + sets refresh cookie
    FE-->>U: Logged in
  end

  note over FE,BE: Refresh (on page reload)
  FE->>BE: POST /api/auth/refresh (CSRF header + refresh cookie)
  BE-->>FE: {user, accessToken} + rotated refresh cookie

  note over U,BE: Session check
  FE->>BE: GET /api/auth/me (Authorization: Bearer accessToken)
  BE-->>FE: 200 user JSON

  note over U,BE: Logout
  U->>FE: Click logout
  FE->>BE: POST /api/auth/logout (Authorization + CSRF)
  BE-->>FE: Revoke session + clear refresh cookie
  FE-->>U: Logged out

  note over U,BE: Email verification
  FE-->>U: User opens verification link
  FE->>BE: POST /api/auth/verify-email/confirm {token}
  BE->>DB: Mark emailVerified=true
  BE-->>FE: 200 Email verified
```

---

## 5) Google OAuth flow

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant FE as Frontend
  participant BE as Backend
  participant G as Google
  participant DB as MongoDB

  U->>FE: Click "Continue with Google"
  FE->>BE: GET /api/auth/google
  BE-->>FE: Redirect to Google consent
  FE->>G: OAuth authorize
  G-->>FE: Redirect back with code+state
  FE->>BE: GET /api/auth/google/callback?code=...&state=...
  BE->>G: Exchange code for id_token
  BE->>G: Verify id_token
  BE->>DB: Auto-link account by email (create if missing)
  DB-->>BE: User record
  BE-->>FE: Set refresh cookie + redirect to /oauth/callback
  FE->>BE: POST /api/auth/refresh
  BE-->>FE: {user, accessToken}
  FE-->>U: Logged in
```

---

## 6) City forecast flow (authenticated)

```mermaid
sequenceDiagram
  autonumber
  participant FE as Frontend
  participant BE as Backend
  participant OM as Open‑Meteo

  FE->>BE: GET /api/weather/city?query=London (Bearer access token)
  BE->>BE: requireAuth + requireVerified
  BE->>OM: Geocode city name
  OM-->>BE: Candidate locations
  BE->>OM: Forecast by coordinates
  OM-->>BE: Forecast payload
  BE-->>FE: Normalized payload (current + hourly + daily + units)
```

---

## 7) Region flow (nearby cities in same country)

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
  BE->>BE: requireAuth + requireVerified
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

## 8) Country flow (top cities by population)

```mermaid
sequenceDiagram
  autonumber
  participant FE as Frontend
  participant BE as Backend
  participant DS as City dataset
  participant OM as Open-Meteo

  FE->>BE: GET /api/weather/country?query=City
  BE->>BE: requireAuth + requireVerified
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

## 9) Monthly flow (daily snapshots → aggregation)

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
  BE->>BE: requireAuth + requireVerified
  BE->>OM: Geocode + forecast to determine coords
  OM-->>BE: Forecast payload

  BE->>BE: For each day: compute summary fields
  BE->>DB: Upsert WeatherSnapshot (unique by user+coords+date)
  DB-->>BE: Write OK

  BE->>DB: Query snapshots for time range
  DB-->>BE: Snapshot docs
  BE-->>FE: Aggregated monthly response
```
