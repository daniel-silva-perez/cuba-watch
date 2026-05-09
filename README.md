# Cuba Watch

An open-source OSINT (Open Source Intelligence) monitoring dashboard for aggregating, analyzing, and visualizing publicly available signals related to Cuba. Built with **Python**, **FastAPI**, and a lightweight static frontend.

## Overview

Cuba Watch collects data from free and open sources—including flight tracking, maritime AIS, news feeds, weather, seismic activity, internet connectivity metrics, and energy indicators—and transforms it into structured intelligence. The application features automated data collection, signal analysis, anomaly detection, and an analyst-facing dashboard.

> **Disclaimer:** This project relies exclusively on public data sources. Energy and connectivity signals are treated as proxy metrics; conclusions should not be overstated. All timestamps are stored in UTC.

## Features

- **Multi-Source Aggregation:** Automated collection from ADS-B (flights), AIS (ships), RSS news feeds, weather services, seismic monitors, IODA connectivity data, and energy indicators.
- **Signal Analysis:** Generates intelligence briefings, watch modes, event detection, signal radar, and discovery reports.
- **RESTful API:** Full FastAPI backend with JSON and Markdown export endpoints.
- **Static Dashboard:** A single-page frontend served directly by FastAPI—no separate frontend build step required.
- **Scheduled Refresh:** Background scheduler with configurable polling cadence for each data source.
- **Graceful Degradation:** If upstream sources fail or rate-limit, the system retains and serves cached data rather than failing hard.
- **Demo Mode:** Launch instantly with deterministic sample data for evaluation or portfolio demonstration.
- **Docker Support:** Ready-to-run containerized deployment via Docker Compose.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FastAPI App                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   API Routes │  │ Scheduler   │  │  Intelligence Layer │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  SQLite (cuba_monitor.db)  ───  Static Frontend (public/)   │
└─────────────────────────────────────────────────────────────┘
```

| Component | File | Description |
|---|---|---|
| API Routes | `main.py` | FastAPI entrypoint and all REST endpoints |
| Scheduler | `src/scheduler.py` | Refresh orchestration and polling cadence |
| Database | `src/database.py` | SQLite schema and persistence helpers |
| Models | `src/models.py` | Shared Pydantic data models |
| Scrapers | `src/scrapers/` | Source-specific collectors (flights, ships, news, weather, energy, seismic, connectivity, military) |
| Intelligence | `src/intelligence.py` | Briefing generation, event building, signal radar, anomaly detection |
| Frontend | `public/` | Static HTML/CSS/JS served by FastAPI |

## Quick Start

### Prerequisites

- Python 3.12+
- pip
- (Optional) Docker & Docker Compose

### Local Installation

```bash
# 1. Clone the repository
git clone https://github.com/danielsilvaperez/cuba-watch.git
cd cuba-watch

# 2. Create a virtual environment and install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Run the application
python main.py
```

The dashboard will be available at `http://localhost:8080`.

### Demo Mode

To launch with pre-populated sample data (no external network calls):

```bash
CUBA_WATCH_DEMO_MODE=true python main.py
```

Or using Make:

```bash
make demo
```

### Docker

```bash
docker compose up --build
```

The application will be available at `http://localhost:8080`.

### Vercel (Serverless)

Cuba Watch can be deployed to Vercel as a serverless application. On Vercel, the app runs in demo mode by default (no background scheduler) and serves the static dashboard from `public/` while API routes are handled by a Python serverless function.

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Configure environment variables in the Vercel dashboard if needed:
   - `CUBA_WATCH_DEMO_MODE` — `true` (default on Vercel) uses seeded sample data; `false` initializes an empty ephemeral database.
   - `CUBA_WATCH_DB_PATH` — Path to the SQLite database. Defaults to `/tmp/cuba_monitor.db` on Vercel (ephemeral, cleared on cold starts).

> **Note:** Vercel serverless functions are stateless and ephemeral. Live scraping with the background scheduler is disabled. For persistent data on Vercel, connect a serverless database (e.g., Vercel Postgres, Neon, or Supabase) and update `src/database.py` accordingly.

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Dashboard (static frontend) |
| `/api/health` | GET | Service health check |
| `/api/status` | GET | System status and overview |
| `/api/metrics` | GET | Prometheus-compatible metrics |
| `/api/radar` | GET | Signal radar summary |
| `/api/watch-mode` | GET | Current watch mode assessment |
| `/api/discoveries` | GET | Recent signal discoveries |
| `/api/briefing` | GET | Intelligence briefing (JSON) |
| `/api/sitrep.md` | GET | Situation report (Markdown) |
| `/api/export/brief.md` | GET | Exportable briefing (Markdown) |
| `/api/events` | GET | Detected events timeline |
| `/api/audit` | GET | Audit trail |
| `/api/flights` | GET | Latest flight data |
| `/api/ships` | GET | Latest maritime data |
| `/api/news` | GET | Latest news articles |
| `/api/weather` | GET | Current weather data |
| `/api/energy` | GET | Energy indicator data |
| `/api/seismic` | GET | Seismic activity events |
| `/api/ioda` | GET | Internet connectivity metrics |
| `/api/sources` | GET | Data source health status |
| `/api/notes` | GET / POST | Analyst notes |
| `/api/military/bases` | GET | Military base data |
| `/api/military/movements` | GET | Troop movement indicators |
| `/api/strategic/assets` | GET | Strategic asset overview |
| `/api/provider-settings` | GET | Data provider configuration |
| `/api/refresh` | GET | Trigger manual data refresh |

Interactive API documentation (Swagger UI) is available at `/docs` when the server is running.

## Development

### Setup

```bash
make setup    # Create venv and install dependencies
make dev      # Run with uvicorn hot-reload
```

### Testing

```bash
make test     # Run pytest suite
```

### Linting & Formatting

```bash
make lint     # Check with ruff
make format   # Auto-format with ruff
```

### Clean Build Artifacts

```bash
make clean    # Remove caches and local database
```

## Data Sources

Cuba Watch aggregates publicly available data from the following categories:

- **Aviation:** ADS-B exchange (adsb.lol)
- **Maritime:** VesselFinder public AIS
- **News:** RSS news feeds
- **Weather:** Public weather APIs
- **Energy:** Energy sector indicators
- **Seismic:** Public seismic monitoring
- **Connectivity:** IODA (Internet Outage Detection and Analysis)
- **Military:** Open-source military indicator tracking

Source health is continuously monitored and exposed via `/api/sources`.

## Tech Stack

- **Backend:** Python 3.12, FastAPI, Pydantic, APScheduler
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (static, no build step)
- **Database:** SQLite
- **HTTP Client:** aiohttp
- **Scheduling:** APScheduler (async)
- **Linting:** ruff
- **Testing:** pytest, pytest-asyncio
- **Deployment:** Docker, Docker Compose, Uvicorn

## Contributing

Contributions are welcome. Please refer to [`AGENTS.md`](AGENTS.md) for detailed development guidelines, repository conventions, and editing rules.

When contributing, please:

- Keep dependencies unchanged unless explicitly required.
- Reuse existing scraper, database, and API patterns before introducing new abstractions.
- Preserve backward compatibility for API response shapes unless a contract change is explicitly requested.
- Document non-obvious upstream source behavior inline.
- Avoid logging noise; keep output operationally useful.

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

- Data providers and open-source projects that make public intelligence possible.
- The FastAPI and Pydantic communities for excellent tooling.
