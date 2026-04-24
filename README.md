# Cuba Situation Monitor

OSINT dashboard for real-time situational awareness on Cuba: flights, ships, news, weather, and energy status — all from free/open sources.

## Features

- **Live flight tracker** around Cuba (ADS-B Exchange)
- **Ship positions** in Cuban waters (VesselFinder public feed)
- **News aggregation** filtered for Cuba (BBC, Reuters, AP, Miami Herald, 14yMedio, OnCuba)
- **Havana weather** (Open-Meteo)
- **Energy indicator** — outage-mention proxy from news feeds
- **Military / OSINT layer**:
  - Known Cuban military installations (San Antonio de los Baños, Mariel, Camagüey, Havana Harbor, Ciudad Libertad, Santiago de Cuba)
  - Gitmo (US Naval Station) marked distinctly (blue shield vs. red)
  - US troop movement indicators derived from ADS-B military callsigns (C-17/C-130/KC-135, RCH/REACH, etc.) and USCG vessel names in the Florida Straits
  - Strategic assets: Moa Bay nickel mine, Cienfuegos refinery, Mariel deep-water port, thermoelectric plants, offshore oil, SIGINT sites
  - Toggleable map layers + troop-movement alerts sidebar
- Dark-theme responsive Leaflet map
- SQLite cache + 5-minute background refresh (APScheduler)
- Graceful fallbacks + stale-data warnings

## Data Sources

| Source | URL | Key required |
|---|---|---|
| Flights (ADS-B) | `https://api.adsb.lol/v2/lat/21.5/lon/-80.0/dist/400` | No |
| Ships (VesselFinder) | `https://www.vesselfinder.com/api/pub/vessels?...` | No |
| Weather | `https://api.open-meteo.com/v1/forecast?latitude=23.1136&longitude=-82.3666...` | No |
| News BBC | `http://feeds.bbci.co.uk/news/world/latin_america/rss.xml` | No |
| News Reuters | `https://feeds.reuters.com/reuters/latamNews` | No |
| News AP | `https://rsshub.app/apnews/topics/cuba` | No |
| Miami Herald | `https://www.miamiherald.com/...` | No |
| 14yMedio | `https://www.14ymedio.com/rss.xml` | No |
| OnCuba | `https://oncubanews.com/feed/` | No |

## Quick Start

```bash
cd ~/.openclaw/workspace/projects/cuba-monitor
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

Open: <http://localhost:8080>

Or via uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8080
```

## API Endpoints

| Endpoint | Returns |
|---|---|
| `GET /` | Dashboard HTML |
| `GET /api/flights` | Live flights near Cuba |
| `GET /api/ships` | Ships in Cuban waters |
| `GET /api/news` | Latest Cuba-related articles |
| `GET /api/weather` | Current Havana weather |
| `GET /api/energy` | Energy status (derived proxy) |
| `GET /api/status` | Summary of all subsystems |
| `GET /api/military/bases` | Known military installations (Cuban + Gitmo) |
| `GET /api/military/movements` | Derived US troop movement indicators (flights + ships) |
| `GET /api/strategic/assets` | Strategic resources: mines, refineries, power plants, ports |
| `GET /api/refresh` | Trigger manual refresh |

All responses include a `stale` boolean when applicable.

## Architecture

```
main.py                 FastAPI app + routes
src/database.py         SQLite schema + CRUD
src/scheduler.py        APScheduler — refresh every 5 min
src/models.py           Pydantic response models
src/scrapers/
  adsb.py               Flights
  ais.py                Ships
  news.py               RSS aggregation
  weather.py            Open-Meteo
  energy.py             Outage proxy
public/
  index.html            Dashboard
  app.js                Frontend logic, polling
  style.css             Dark theme
cuba_monitor.db         SQLite cache (auto-created)
```

## Caching & Refresh

- Background scheduler refreshes every **5 minutes**.
- Frontend re-polls **every 60 seconds**.
- SQLite persists last known state so restarts don't lose data.
- Stale-data banners appear when data is older than threshold (10–30 min).

## Expose via Tailscale / OpenClaw

```bash
# Tailscale
tailscale serve --bg --https=8443 localhost:8080

# OpenClaw gateway (example)
openclaw gateway expose --port 8080 --name cuba-monitor
```

## Constraints

- Only free/open APIs — no paid keys required.
- Aggressive caching to avoid rate limits.
- Handles API failures gracefully with cached data + stale warnings.
- Dark theme, mobile responsive.

## Notes

- The energy indicator is a **proxy** derived from keyword-frequency in Cuban news RSS feeds (`apagón`, `blackout`, `power outage`). For proper VIIRS night-lights analysis you'd need NASA FIRMS / Earthdata credentials, which is intentionally out of scope for the free-tier version.
- VesselFinder's public endpoint may rate-limit or change structure; a static fallback is provided.
- All timestamps are UTC.
