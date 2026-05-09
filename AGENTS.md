# AGENTS.md — Development Guide

This document governs development practices for the Cuba Watch repository. All contributors and automated agents should follow the conventions below.

## Project Intent

- Maintain a lightweight Cuba OSINT monitor built exclusively on free and open data sources.
- Preserve the current architecture: FastAPI backend, SQLite persistence, static frontend.
- Favor small, reversible edits over broad refactors.

## Repository Map

| Path | Purpose |
|---|---|
| `main.py` | FastAPI app entrypoint and API routes |
| `src/scheduler.py` | Refresh orchestration and polling cadence |
| `src/database.py` | SQLite schema and persistence helpers |
| `src/models.py` | Shared Pydantic data models |
| `src/intelligence.py` | Briefing generation, event detection, signal radar, anomaly analysis |
| `src/scrapers/` | Source-specific collectors for flights, ships, news, weather, energy, seismic, connectivity, and military indicators |
| `public/` | Static frontend assets served by FastAPI |
| `cuba_monitor.db` | Local SQLite database file (created at runtime) |

## Working Rules

- **Dependencies:** Keep dependencies unchanged unless explicitly required by a feature or security fix.
- **Patterns:** Prefer reusing existing scraper, database, and API patterns before introducing new abstractions.
- **Graceful Degradation:** If an upstream source fails or rate-limits, prefer cached or partial data over hard failure. Never crash the application due to a single source outage.
- **Signal Certainty:** Treat the energy signal as a proxy metric; do not overstate certainty in code or documentation.
- **Timestamps:** Keep all timestamps in UTC.
- **Generated Files:** Do not commit generated caches or Python bytecode changes unless explicitly requested.

## Run And Verify

### Local Development

```bash
pip install -r requirements.txt
python main.py
```

Default app URL: `http://localhost:8080`

### Verification After Changes

After code changes, run the most relevant verification available for the touched area. Prefer, when applicable:

```bash
python -m py_compile main.py src/*.py src/scrapers/*.py
```

Or targeted runtime checks against affected endpoints or scraper functions.

### Testing

```bash
pytest -q
```

### Linting

```bash
ruff check .
ruff format .
```

## Editing Guidance

- **API Compatibility:** Keep API response shapes backward compatible unless the task explicitly requires a contract change.
- **Frontend:** Preserve the current single-page static approach unless a larger migration is explicitly requested.
- **Scrapers:** Document assumptions inline only when the upstream source behavior is non-obvious.
- **Logging:** Avoid logging noise; keep logs operationally useful.
- **Scope:** Prefer minimal, focused changes over broad refactors.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CUBA_WATCH_DEMO_MODE` | `false` | When `true`, seeds deterministic sample data and disables live scraping |

## Final Reporting

When completing work, summarize:

1. **Changed files** — what was modified and why.
2. **Simplifications** — any reductions in complexity.
3. **Remaining risks** — especially upstream source fragility or unverified scraper behavior.

## Communication

- Open an issue for bugs, feature requests, or architectural discussions.
- Keep pull requests focused and reference related issues where applicable.
