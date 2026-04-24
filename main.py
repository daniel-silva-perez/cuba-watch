import asyncio
import logging
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager

from src import database as db
from src.scheduler import start_scheduler, refresh_all

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

PUBLIC_DIR = Path(__file__).parent / "public"


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    logger.info("DB initialized")
    # Initial data fetch
    asyncio.create_task(refresh_all())
    start_scheduler()
    yield
    from src.scheduler import scheduler
    scheduler.shutdown(wait=False)


app = FastAPI(title="Cuba Monitor", lifespan=lifespan)


@app.get("/api/flights")
async def get_flights():
    rows = db.get_flights()
    stale = _is_stale(rows, "fetched_at", minutes=10)
    return {"data": rows, "count": len(rows), "stale": stale}


@app.get("/api/ships")
async def get_ships():
    rows = db.get_ships()
    stale = _is_stale(rows, "fetched_at", minutes=10)
    return {"data": rows, "count": len(rows), "stale": stale}


@app.get("/api/news")
async def get_news():
    rows = db.get_news(50)
    stale = _is_stale(rows, "fetched_at", minutes=30)
    return {"data": rows, "count": len(rows), "stale": stale}


@app.get("/api/weather")
async def get_weather():
    row = db.get_weather()
    if not row:
        return JSONResponse({"data": None, "stale": True}, status_code=200)
    stale = _is_stale_ts(row.get("fetched_at"), minutes=15)
    return {"data": row.get("data"), "fetched_at": row.get("fetched_at"), "stale": stale}


@app.get("/api/energy")
async def get_energy():
    row = db.get_energy()
    if not row:
        return JSONResponse({"data": None, "stale": True}, status_code=200)
    stale = _is_stale_ts(row.get("fetched_at"), minutes=15)
    return {"data": row.get("data"), "fetched_at": row.get("fetched_at"), "stale": stale}


@app.get("/api/status")
async def get_status():
    flights = db.get_flights()
    ships = db.get_ships()
    news_rows = db.get_news(1)
    weather_row = db.get_weather()
    energy_row = db.get_energy()

    return {
        "flights": {"count": len(flights), "last_update": flights[0]["fetched_at"] if flights else None},
        "ships": {"count": len(ships), "last_update": ships[0]["fetched_at"] if ships else None},
        "news": {"count": len(db.get_news(100)), "last_update": news_rows[0]["fetched_at"] if news_rows else None},
        "weather": {"available": weather_row is not None, "last_update": weather_row["fetched_at"] if weather_row else None},
        "energy": {"status": energy_row["data"]["status"] if energy_row else "UNKNOWN", "last_update": energy_row["fetched_at"] if energy_row else None},
        "server_time": datetime.utcnow().isoformat() + "Z",
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
    asyncio.create_task(refresh_all())
    return {"message": "Refresh triggered"}


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
        dt = datetime.fromisoformat(ts)
        now = datetime.utcnow()
        diff = (now - dt).total_seconds() / 60
        return diff > minutes
    except Exception:
        return True


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=False)
