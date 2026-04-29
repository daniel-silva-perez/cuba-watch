# AGENTS.md

This file governs the entire repository.

## Project Intent

- Maintain a lightweight Cuba OSINT monitor built on free/open data sources.
- Preserve the current architecture: FastAPI backend, SQLite persistence, static frontend.
- Favor small, reversible edits over broad refactors.

## Repository Map

- `main.py`: FastAPI app entrypoint and API routes.
- `src/scheduler.py`: refresh orchestration and polling cadence.
- `src/database.py`: SQLite schema and persistence helpers.
- `src/models.py`: shared data models.
- `src/scrapers/`: source-specific collectors for flights, ships, news, weather, energy, and military indicators.
- `public/`: static frontend assets served by FastAPI.
- `cuba_monitor.db`: local SQLite database file.

## Working Rules

- Keep dependencies unchanged unless explicitly required.
- Prefer reusing the existing scraper, database, and API patterns before adding abstractions.
- Preserve graceful degradation: if an upstream source fails or rate-limits, prefer cached or partial data over hard failure.
- Treat the energy signal as a proxy metric; do not overstate certainty in code or docs.
- Keep timestamps in UTC.
- Do not commit generated caches or Python bytecode changes unless the user explicitly asks.

## Run And Verify

- Install dependencies with `pip install -r requirements.txt`.
- Run locally with `python main.py`.
- Default app URL is `http://localhost:8080`.
- After code changes, run the most relevant verification available for the touched area. Prefer, when applicable:
  - `python -m py_compile main.py src/*.py src/scrapers/*.py`
  - targeted runtime checks against affected endpoints or scraper functions

## Editing Guidance

- Keep API response shapes backward compatible unless the task explicitly requires a contract change.
- For frontend work, preserve the current single-page static approach unless a larger migration is explicitly requested.
- For scraper changes, document assumptions inline only when the upstream source behavior is non-obvious.
- Avoid logging noise; keep logs operationally useful.

## Final Reporting

- Summarize changed files.
- Note simplifications made.
- Call out remaining risks, especially upstream source fragility or unverified scraper behavior.
