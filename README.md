# Cuba Watch

Cuba Watch is a showcase-grade **open-source intelligence (OSINT) dashboard** for Cuba. It fuses public aviation, maritime, news, weather, connectivity, energy, seismic, strategic-infrastructure, and derived movement signals into a real-time situational-awareness interface.

The goal is not prediction. The goal is visibility: make scattered public signals easier to monitor, correlate, explain, and export.

## Demo Highlights

- Real-time Leaflet map with ADS-B aircraft, AIS vessels, USGS seismic events, known installations, strategic assets, Esri satellite basemap, and optional NASA GIBS overlays.
- Rule-based **Intel Briefing** that summarizes the current situation from all feeds.
- **Risk Score Engine** with NORMAL / WATCH / ELEVATED / CRITICAL levels.
- Unified **Event Timeline** normalizing news, energy, connectivity, seismic, and movement indicators.
- **Source Health** panel with status, active source, last success, stale/cached/fallback visibility.
- **Export Brief** button that produces a Markdown situation brief.
- Deterministic **demo mode** for portfolio reviews when public APIs are unavailable.
- Docker, portable Makefile, tests, linting, cleaned runtime artifacts, and satellite-provider transparency.

## Why This Project Is Interesting

Cuba Watch demonstrates full-stack product thinking around public data: ingestion, caching, source reliability, confidence scoring, map visualization, rule-based analysis, explainability, and demo readiness.

It intentionally avoids fake classified language. Everything is framed as public-source OSINT and should be verified before operational use.

## Features

- **Aviation:** aircraft around Cuba from ADS-B-compatible feeds.
- **Maritime:** vessel positions near Cuban waters with fallback transparency.
- **News:** Cuba-related RSS aggregation with keyword tagging for energy, protest, repression, migration, food, internet, and security signals.
- **Weather:** current Havana weather from Open-Meteo.
- **Energy:** outage-mention proxy from public news feeds.
- **Connectivity:** IODA/CAIDA signal snapshots for Cuba's ETECSA ASN 27725.
- **Seismic:** USGS 24h Cuba-adjacent earthquake feed.
- **Military / strategic context:** known installations, Gitmo, Caribbean/Florida context, strategic assets, and derived movement indicators.
- **Source health:** last success, active source, row counts, and failure visibility.
- **Briefing export:** Markdown report at `/api/export/brief.md`.


## Satellite / Imagery Layers

The default satellite basemap is **Esri World Imagery**. Treat it as high-quality visual context, not live satellite collection.

The dashboard now also includes optional **NASA GIBS / EOSDIS** overlays that can be toggled from the map layer panel:

| Layer | Purpose | Key required |
|---|---|---:|
| VIIRS True Color | Near-real-time visual satellite context | No |
| MODIS Terra True Color | Cloud/smoke/land-water context | No |
| VIIRS Thermal Anomalies | Fire/thermal anomaly context | No |
| IMERG Precipitation Rate | Storm/rainfall context | No |
| Blue Marble | Static global relief/bathymetry context | No |

Notes:

- GIBS layers are public and may be delayed by hours or a day depending on product availability.
- Some layers may not render for every selected date or zoom level.
- Advanced providers such as Sentinel Hub, Mapbox Satellite, and Google Earth Engine are documented as future optional integrations because they require credentials/API setup.

## Quick Start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 main.py
```

Open: <http://localhost:8080>

## Demo Mode

Use demo mode for a stable portfolio walkthrough without depending on live public APIs:

```bash
CUBA_WATCH_DEMO_MODE=true python3 main.py
```

Or:

```bash
make demo
```

You can also reseed demo data while running:

```bash
curl http://localhost:8080/api/demo/seed
```

## Docker

```bash
docker compose up --build
```

Then open <http://localhost:8080>.

## Make Commands

```bash
make install   # create venv and install deps
make dev       # run uvicorn with reload
make demo      # run deterministic demo mode
make test      # run pytest
make lint      # run ruff
make format    # format with ruff
make clean     # remove local runtime artifacts
```

## API Endpoints

| Endpoint | Returns |
|---|---|
| `GET /` | Dashboard HTML |
| `GET /api/briefing` | Correlated Intel Briefing, risk score, drivers, confidence |
| `GET /api/events` | Unified normalized event timeline |
| `GET /api/export/brief.md` | Markdown situation brief |
| `GET /api/health` | Database/scheduler/source health summary |
| `GET /api/metrics` | Refresh run metrics |
| `GET /api/sources` | Per-source health: active source, last success/error, row count |
| `GET /api/flights` | Flights near Cuba |
| `GET /api/ships` | Ships in Cuban waters |
| `GET /api/news` | Latest Cuba-related articles |
| `GET /api/weather` | Current Havana weather |
| `GET /api/energy` | Energy status proxy |
| `GET /api/ioda` | Cuba ASN connectivity status from IODA |
| `GET /api/seismic` | Cuba-adjacent USGS earthquake events |
| `GET /api/status` | Summary of all subsystems |
| `GET /api/imagery/providers` | Basemap, NASA GIBS overlay, and future premium imagery provider metadata |
| `GET /api/military/bases` | Known military installations |
| `GET /api/military/movements` | Derived movement indicators |
| `GET /api/strategic/assets` | Strategic resources and infrastructure |
| `GET /api/refresh` | Trigger manual refresh or reseed demo data in demo mode |
| `GET /api/notes` / `POST /api/notes` | Local analyst notes |

## Architecture

```txt
main.py                 FastAPI app + routes
src/database.py         SQLite schema + CRUD + metrics + events + notes
src/scheduler.py        APScheduler refresh + refresh audit trail
src/intelligence.py     Risk score, briefing, event normalization, Markdown export
src/demo_data.py        Deterministic portfolio demo data
src/providers.py        Minimal provider interface for future integrations
src/models.py           Pydantic models
src/scrapers/           Public-source fetchers
public/index.html       Dashboard layout
public/app.js           Map, polling, briefing/timeline rendering, imagery provider/overlay control
public/style.css        Dark OSINT terminal UI
```

## Data Sources

| Source | Key required |
|---|---:|
| ADS-B-compatible flight feed | No |
| VesselFinder-style public AIS feed / fallback | No |
| Open-Meteo weather | No |
| IODA/CAIDA connectivity | No |
| USGS all-day earthquake GeoJSON | No |
| Esri World Imagery basemap | No |
| NASA GIBS / EOSDIS WMTS overlays | No |
| RSS feeds: BBC, Reuters, AP/RSSHub, Miami Herald, 14yMedio, OnCuba | No |

## Notes

- The energy indicator is a **proxy** derived from public keyword frequency, not a direct grid telemetry feed.
- The movement layer is **derived** from local rules over public aviation/maritime data.
- AIS and other public feeds may rate-limit or change structure; the app surfaces stale/cached/fallback state instead of hiding it.
- All timestamps are UTC.

## UI update: collapsible panels + globe preview

The map mode/config panel and the Intel Briefing panel are now collapsible. Their open/closed state is saved in localStorage so the dashboard keeps the same layout after refresh.

A new experimental **GLOBE** button has been added to the map mode selector. This opens a Cesium-powered 3D globe preview using Esri World Imagery, with a few Cuba context markers and an approximate ALBA-1 undersea cable context line.

Notes:

- The standard Leaflet map remains the operational view for live tactical overlays, markers, NASA GIBS overlays, and layer toggles.
- Globe mode is a real 3D globe, but currently acts as a visual preview/context mode.
- A full globe-native version would require migrating markers/layers from Leaflet into Cesium entities or rebuilding the map layer stack around Cesium/MapLibre.


## Sherlock Reuse Upgrade

This build ports the strongest product patterns from the Sherlock OSINT workspace into Cuba Watch:

- **Signal Radar**: ranks energy, migration, internet, civil unrest, food/supply, movement, and disaster signals by momentum.
- **Watch Mode**: continuously evaluates watch conditions such as elevated risk, IODA anomalies, energy spikes, movement indicators, and provider degradation.
- **Discovery Queue**: surfaces the newest signals that deserve analyst review.
- **SITREP Studio**: opens or copies a Markdown situation report from `/api/sitrep.md`.
- **Provider Control**: shows source status, refresh cadence, active provider, and fallback policy.
- **Audit Trail**: shows generated risk updates, provider health checks, and normalized event activity.
- **PWA shell**: installable app metadata, SVG icons, and an offline shell service worker.

New endpoints:

```http
GET /api/radar
GET /api/watch-mode
GET /api/discoveries
GET /api/provider-settings
GET /api/audit
GET /api/sitrep.md
```
