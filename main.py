import asyncio
import logging
import os
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from contextlib import asynccontextmanager

from src import database as db
from src.demo_data import seed as seed_demo_data
from src.intelligence import briefing_to_markdown, build_events, generate_briefing, generate_signal_radar, generate_watch_mode, generate_discoveries, generate_provider_settings, generate_audit_trail, sitrep_to_markdown
from src.scheduler import start_scheduler, refresh_all

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

PUBLIC_DIR = Path(__file__).parent / "public"
IS_VERCEL = os.getenv("VERCEL", "").lower() in {"1", "true", "yes"}
DEMO_MODE = os.getenv("CUBA_WATCH_DEMO_MODE", "true" if IS_VERCEL else "").lower() in {"1", "true", "yes", "demo"}


class AnalystNoteIn(BaseModel):
    body: str
    event_id: int | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    logger.info("DB initialized")
    if DEMO_MODE:
        seed_demo_data(db)
        logger.info("Demo mode enabled — seeded local sample data")
    elif not IS_VERCEL:
        asyncio.create_task(refresh_all())
        start_scheduler()
    else:
        logger.info("Vercel serverless mode — background scheduler disabled")
    yield
    if not DEMO_MODE and not IS_VERCEL:
        from src.scheduler import scheduler
        scheduler.shutdown(wait=False)


app = FastAPI(title="Cuba Watch OSINT Dashboard", lifespan=lifespan)


def _snapshot():
    return {
        "flights": db.get_flights(),
        "ships": db.get_ships(),
        "news": db.get_news(100),
        "weather": db.get_weather(),
        "energy": db.get_energy(),
        "seismic": db.get_seismic_events(50),
        "ioda": db.get_ioda_connectivity(),
        "movements": db.get_troop_movements(50),
        "sources": db.get_source_health(),
    }



def _events_snapshot():
    snap = _snapshot()
    briefing = generate_briefing(flights=snap["flights"], ships=snap["ships"], news=snap["news"], energy=snap["energy"], ioda=snap["ioda"], seismic=snap["seismic"], movements=snap["movements"], sources=snap["sources"])
    events = build_events(**{k: snap[k] for k in ["flights", "ships", "news", "energy", "ioda", "seismic", "movements"]})
    radar = generate_signal_radar(news=snap["news"], energy=snap["energy"], ioda=snap["ioda"], movements=snap["movements"], seismic=snap["seismic"], ships=snap["ships"], flights=snap["flights"])
    watch = generate_watch_mode(briefing=briefing, energy=snap["energy"], ioda=snap["ioda"], movements=snap["movements"], sources=snap["sources"])
    discoveries = generate_discoveries(briefing=briefing, radar=radar, events=events, sources=snap["sources"])
    return snap, briefing, events, radar, watch, discoveries

def _briefing():
    snap = _snapshot()
    briefing = generate_briefing(flights=snap["flights"], ships=snap["ships"], news=snap["news"], energy=snap["energy"], ioda=snap["ioda"], seismic=snap["seismic"], movements=snap["movements"], sources=snap["sources"])
    events = build_events(**{k: snap[k] for k in ["flights", "ships", "news", "energy", "ioda", "seismic", "movements"]})
    db.replace_events(events)
    return briefing



@app.get("/api/radar")
async def get_signal_radar():
    snap = _snapshot()
    return generate_signal_radar(news=snap["news"], energy=snap["energy"], ioda=snap["ioda"], movements=snap["movements"], seismic=snap["seismic"], ships=snap["ships"], flights=snap["flights"])


@app.get("/api/watch-mode")
async def get_watch_mode():
    snap, briefing, events, radar, watch, discoveries = _events_snapshot()
    return watch


@app.get("/api/discoveries")
async def get_discoveries():
    snap, briefing, events, radar, watch, discoveries = _events_snapshot()
    return discoveries


@app.get("/api/provider-settings")
async def get_provider_settings():
    return generate_provider_settings(db.get_source_health())


@app.get("/api/audit")
async def get_audit_trail():
    snap, briefing, events, radar, watch, discoveries = _events_snapshot()
    return generate_audit_trail(briefing=briefing, sources=snap["sources"], events=events)


@app.get("/api/sitrep.md")
async def export_sitrep():
    snap, briefing, events, radar, watch, discoveries = _events_snapshot()
    return PlainTextResponse(sitrep_to_markdown(briefing=briefing, radar=radar, watch=watch, discoveries=discoveries), media_type="text/markdown")

@app.get("/api/flights")
async def get_flights():
    rows = db.get_flights()
    stale = _is_stale(rows, "fetched_at", minutes=10)
    return {"data": rows, "count": len(rows), "stale": stale, "source": "ADS-B / cache"}


@app.get("/api/ships")
async def get_ships():
    rows = db.get_ships()
    stale = _is_stale(rows, "fetched_at", minutes=10)
    return {"data": rows, "count": len(rows), "stale": stale, "source": "AIS / cache"}


@app.get("/api/news")
async def get_news():
    rows = db.get_news(50)
    stale = _is_stale(rows, "fetched_at", minutes=30)
    return {"data": rows, "count": len(rows), "stale": stale, "source": "RSS / cache"}


@app.get("/api/weather")
async def get_weather():
    row = db.get_weather()
    if not row:
        return JSONResponse({"data": None, "stale": True}, status_code=200)
    stale = _is_stale_ts(row.get("fetched_at"), minutes=15)
    return {"data": row.get("data"), "fetched_at": row.get("fetched_at"), "stale": stale, "source": "Open-Meteo"}


@app.get("/api/energy")
async def get_energy():
    row = db.get_energy()
    if not row:
        return JSONResponse({"data": None, "stale": True}, status_code=200)
    stale = _is_stale_ts(row.get("fetched_at"), minutes=15)
    return {"data": row.get("data"), "fetched_at": row.get("fetched_at"), "stale": stale, "source": row.get("data", {}).get("source")}


@app.get("/api/seismic")
async def get_seismic():
    rows = db.get_seismic_events(50)
    stale = _is_stale(rows, "fetched_at", minutes=90)
    return {"data": rows, "count": len(rows), "stale": stale, "source": "USGS"}


@app.get("/api/ioda")
async def get_ioda():
    row = db.get_ioda_connectivity()
    if not row:
        return JSONResponse({"data": None, "stale": True}, status_code=200)
    stale = _is_stale_ts(row.get("fetched_at"), minutes=30)
    return {"data": row.get("data"), "fetched_at": row.get("fetched_at"), "stale": stale, "source": row.get("data", {}).get("source")}


@app.get("/api/sources")
async def get_sources():
    rows = db.get_source_health()
    return {"data": rows, "count": len(rows)}


@app.get("/api/briefing")
async def get_briefing():
    return _briefing()


@app.get("/api/events")
async def get_events():
    _briefing()
    rows = db.get_events(100)
    return {"data": rows, "count": len(rows)}


@app.get("/api/health")
async def health():
    sources = db.get_source_health()
    ok = len([s for s in sources if s.get("status") == "ok"])
    failed = len([s for s in sources if s.get("status") == "error"])
    return {"status": "ok" if failed == 0 else "degraded", "database": "ok", "scheduler": "disabled-demo" if DEMO_MODE else "running", "sources_online": ok, "sources_total": len(sources), "server_time": datetime.utcnow().isoformat() + "Z"}


@app.get("/api/metrics")
async def metrics():
    data = db.get_refresh_metrics()
    data.update({"demo_mode": DEMO_MODE})
    return data


@app.get("/api/notes")
async def get_notes():
    rows = db.get_analyst_notes(50)
    return {"data": rows, "count": len(rows)}


@app.post("/api/notes")
async def add_note(payload: AnalystNoteIn):
    if not payload.body.strip():
        return JSONResponse({"error": "body is required"}, status_code=400)
    return db.add_analyst_note(payload.body.strip(), payload.event_id)


@app.get("/api/export/brief.md")
async def export_brief():
    return PlainTextResponse(briefing_to_markdown(_briefing()), media_type="text/markdown")


@app.get("/api/demo/seed")
async def seed_demo():
    seed_demo_data(db)
    _briefing()
    return {"message": "Demo data seeded"}




@app.get("/api/imagery/providers")
async def imagery_providers():
    """Document basemap and optional imagery overlay providers for the frontend."""
    return {
        "basemaps": [
            {"key": "satellite", "provider": "Esri World Imagery", "type": "visual basemap", "live": False, "key_required": False},
            {"key": "dark", "provider": "CARTO Dark Matter", "type": "basemap", "live": False, "key_required": False},
            {"key": "street", "provider": "OpenStreetMap", "type": "basemap", "live": False, "key_required": False},
            {"key": "terrain", "provider": "OpenTopoMap", "type": "topographic basemap", "live": False, "key_required": False},
        ],
        "overlays": [
            {"key": "gibsTrueColor", "provider": "NASA GIBS / EOSDIS", "layer": "VIIRS_SNPP_CorrectedReflectance_TrueColor", "type": "near-real-time satellite context", "key_required": False},
            {"key": "gibsTerra", "provider": "NASA GIBS / EOSDIS", "layer": "MODIS_Terra_CorrectedReflectance_TrueColor", "type": "near-real-time satellite context", "key_required": False},
            {"key": "gibsFires", "provider": "NASA GIBS / EOSDIS", "layer": "VIIRS_SNPP_Thermal_Anomalies_375m_All", "type": "thermal anomaly / fire context", "key_required": False},
            {"key": "gibsPrecip", "provider": "NASA GIBS / EOSDIS", "layer": "IMERG_Precipitation_Rate", "type": "precipitation-rate context", "key_required": False},
            {"key": "gibsBlueMarble", "provider": "NASA GIBS / EOSDIS", "layer": "BlueMarble_ShadedRelief_Bathymetry", "type": "static earth context", "key_required": False},
        ],
        "advanced_optional": [
            {"provider": "Sentinel Hub", "best_for": "Sentinel-2 analysis, NDVI, custom evalscripts", "key_required": True},
            {"provider": "Mapbox Satellite", "best_for": "polished production satellite basemaps", "key_required": True},
            {"provider": "Google Earth Engine", "best_for": "serious geospatial analysis and historical comparisons", "key_required": True},
        ],
        "disclaimer": "Basemaps are visual context. NASA GIBS layers are near-real-time public overlays and may be delayed or unavailable for a selected date/layer.",
    }


@app.get("/api/status")
async def get_status():
    snap = _snapshot()
    return {
        "flights": {"count": len(snap["flights"]), "last_update": snap["flights"][0]["fetched_at"] if snap["flights"] else None},
        "ships": {"count": len(snap["ships"]), "last_update": snap["ships"][0]["fetched_at"] if snap["ships"] else None},
        "news": {"count": len(snap["news"]), "last_update": snap["news"][0]["fetched_at"] if snap["news"] else None},
        "weather": {"available": snap["weather"] is not None, "last_update": snap["weather"]["fetched_at"] if snap["weather"] else None},
        "energy": {"status": snap["energy"]["data"]["status"] if snap["energy"] else "UNKNOWN", "last_update": snap["energy"]["fetched_at"] if snap["energy"] else None},
        "seismic": {"count": len(snap["seismic"]), "last_update": snap["seismic"][0]["fetched_at"] if snap["seismic"] else None},
        "ioda": {"status": snap["ioda"]["data"]["status"] if snap["ioda"] else "UNKNOWN", "last_update": snap["ioda"]["fetched_at"] if snap["ioda"] else None},
        "sources": snap["sources"],
        "server_time": datetime.utcnow().isoformat() + "Z",
        "demo_mode": DEMO_MODE,
    }


@app.get("/api/military/bases")
async def get_military_bases():
    rows = db.get_military_bases()
    return {"data": rows, "count": len(rows)}


@app.get("/api/military/movements")
async def get_military_movements():
    rows = db.get_troop_movements(50)
    return {"data": rows, "count": len(rows)}


@app.get("/api/strategic/assets")
async def get_strategic_assets():
    rows = db.get_strategic_assets()
    return {"data": rows, "count": len(rows)}


@app.get("/api/refresh")
async def manual_refresh():
    if DEMO_MODE:
        seed_demo_data(db)
        _briefing()
        return {"message": "Demo data reseeded"}
    asyncio.create_task(refresh_all())
    return {"message": "Refresh triggered"}


if not IS_VERCEL:
    @app.get("/")
    async def index():
        return FileResponse(PUBLIC_DIR / "index.html")

    app.mount("/", StaticFiles(directory=PUBLIC_DIR, html=True), name="static")


def _is_stale(rows: list, ts_field: str, minutes: int = 10) -> bool:
    if not rows:
        return True
    return _is_stale_ts(rows[0].get(ts_field), minutes)


def _is_stale_ts(ts: str, minutes: int = 10) -> bool:
    if not ts:
        return True
    try:
        from datetime import timezone
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        return (now - dt).total_seconds() / 60 > minutes
    except Exception:
        return True


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=False)
