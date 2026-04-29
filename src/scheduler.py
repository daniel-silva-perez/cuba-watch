import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.scrapers import adsb, ais, news, weather, energy, military, seismic, ioda
from src import database as db
from src.intelligence import build_events

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def _health_ok(key: str, label: str, count: int, active_source: str | None = None):
    db.record_source_health(key, label, "ok", count=count, active_source=active_source)


def _health_error(key: str, label: str, error: str, active_source: str | None = None):
    db.record_source_health(key, label, "error", error=error, active_source=active_source)


async def refresh_flights():
    logger.info("Refreshing flights...")
    try:
        data = await adsb.fetch_flights()
        active_source = getattr(adsb, "LAST_SOURCE", "adsb.lol")
        if data:
            db.upsert_flights(data)
            _health_ok("flights", "ADS-B flights", len(data), active_source)
            logger.info(f"Stored {len(data)} flights")
        else:
            _health_error("flights", "ADS-B flights", "No flight rows returned; retaining cached data", active_source)
    except Exception as e:
        logger.exception("Flight refresh failed")
        _health_error("flights", "ADS-B flights", str(e), getattr(adsb, "LAST_SOURCE", "adsb.lol"))


async def refresh_ships():
    logger.info("Refreshing ships...")
    try:
        data = await ais.fetch_ships()
        active_source = data[0].get("source") if data else "VesselFinder public"
        if data:
            db.upsert_ships(data)
            if active_source == "static fallback":
                _health_error("ships", "Maritime AIS", "VesselFinder unavailable; using static fallback", active_source)
            else:
                _health_ok("ships", "Maritime AIS", len(data), active_source)
            logger.info(f"Stored {len(data)} ships")
        else:
            _health_error("ships", "Maritime AIS", "No ship rows returned", active_source)
    except Exception as e:
        logger.exception("Ship refresh failed")
        _health_error("ships", "Maritime AIS", str(e), "VesselFinder public")


async def refresh_news():
    logger.info("Refreshing news...")
    try:
        data = await news.fetch_news()
        if data:
            db.upsert_news(data)
            _health_ok("news", "News RSS", len(data), "RSS feeds")
            logger.info(f"Stored {len(data)} articles")
        else:
            _health_error("news", "News RSS", "No Cuba-related articles returned", "RSS feeds")
    except Exception as e:
        logger.exception("News refresh failed")
        _health_error("news", "News RSS", str(e), "RSS feeds")


async def refresh_weather():
    logger.info("Refreshing weather...")
    try:
        data = await weather.fetch_weather()
        if data:
            db.upsert_weather(data)
            _health_ok("weather", "Havana weather", 1, "Open-Meteo")
            logger.info("Weather stored")
        else:
            _health_error("weather", "Havana weather", "No weather payload returned", "Open-Meteo")
    except Exception as e:
        logger.exception("Weather refresh failed")
        _health_error("weather", "Havana weather", str(e), "Open-Meteo")


async def refresh_energy():
    logger.info("Refreshing energy...")
    try:
        data = await energy.fetch_energy()
        if data:
            db.upsert_energy(data)
            _health_ok("energy", "Energy proxy", int(data.get("outage_reports", 0)), data.get("source", "RSS News Analysis"))
            logger.info(f"Energy status: {data.get('status')}")
        else:
            _health_error("energy", "Energy proxy", "No energy proxy payload returned", "RSS News Analysis")
    except Exception as e:
        logger.exception("Energy refresh failed")
        _health_error("energy", "Energy proxy", str(e), "RSS News Analysis")


async def refresh_seismic():
    logger.info("Refreshing seismic events...")
    try:
        data = await seismic.fetch_seismic_events()
        db.replace_seismic_events(data)
        _health_ok("seismic", "USGS seismic", len(data), "USGS all-day GeoJSON")
        logger.info(f"Stored {len(data)} seismic events")
    except Exception as e:
        logger.exception("Seismic refresh failed")
        _health_error("seismic", "USGS seismic", str(e), "USGS all-day GeoJSON")


async def refresh_ioda():
    logger.info("Refreshing IODA connectivity...")
    try:
        data = await ioda.fetch_connectivity()
        if data:
            db.upsert_ioda_connectivity(data)
            _health_ok("ioda", "Connectivity", len(data.get("signals", [])), data.get("source", "IODA"))
            logger.info("IODA connectivity status: %s", data.get("status"))
        else:
            _health_error("ioda", "Connectivity", "No IODA connectivity payload returned", "IODA")
    except Exception as e:
        logger.exception("IODA refresh failed")
        _health_error("ioda", "Connectivity", str(e), "IODA")


async def refresh_military():
    logger.info("Refreshing military movement indicators...")
    try:
        movements = military.detect_movements()
        db.replace_troop_movements(movements)
        _health_ok("military", "Derived movement alerts", len(movements), "local rules")
    except Exception as e:
        logger.exception("Military movement refresh failed")
        _health_error("military", "Derived movement alerts", str(e), "local rules")


async def refresh_all():
    run_id, _started = db.start_refresh_run()
    try:
        await asyncio.gather(
        refresh_flights(),
        refresh_ships(),
        refresh_news(),
        refresh_weather(),
        refresh_energy(),
        refresh_seismic(),
        refresh_ioda(),
        return_exceptions=True,
    )
        # Derive military indicators from freshly-fetched flight+ship data
        await refresh_military()
        events = build_events(
            flights=db.get_flights(),
            ships=db.get_ships(),
            news=db.get_news(100),
            energy=db.get_energy(),
            ioda=db.get_ioda_connectivity(),
            seismic=db.get_seismic_events(50),
            movements=db.get_troop_movements(50),
        )
        db.replace_events(events)
        db.finish_refresh_run(run_id, "ok")
    except Exception as e:
        logger.exception("Refresh run failed")
        db.finish_refresh_run(run_id, "error", str(e))
        raise


def start_scheduler():
    scheduler.add_job(refresh_all, "interval", minutes=5, id="refresh_all", replace_existing=True)
    scheduler.start()
    logger.info("Scheduler started — refreshing every 5 minutes")
