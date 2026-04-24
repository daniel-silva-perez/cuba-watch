import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.scrapers import adsb, ais, news, weather, energy, military
from src import database as db

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def refresh_flights():
    logger.info("Refreshing flights...")
    data = await adsb.fetch_flights()
    if data:
        db.upsert_flights(data)
        logger.info(f"Stored {len(data)} flights")


async def refresh_ships():
    logger.info("Refreshing ships...")
    data = await ais.fetch_ships()
    if data:
        db.upsert_ships(data)
        logger.info(f"Stored {len(data)} ships")


async def refresh_news():
    logger.info("Refreshing news...")
    data = await news.fetch_news()
    if data:
        db.upsert_news(data)
        logger.info(f"Stored {len(data)} articles")


async def refresh_weather():
    logger.info("Refreshing weather...")
    data = await weather.fetch_weather()
    if data:
        db.upsert_weather(data)
        logger.info("Weather stored")


async def refresh_energy():
    logger.info("Refreshing energy...")
    data = await energy.fetch_energy()
    if data:
        db.upsert_energy(data)
        logger.info(f"Energy status: {data.get('status')}")


async def refresh_military():
    logger.info("Refreshing military movement indicators...")
    movements = military.detect_movements()
    db.replace_troop_movements(movements)


async def refresh_all():
    await asyncio.gather(
        refresh_flights(),
        refresh_ships(),
        refresh_news(),
        refresh_weather(),
        refresh_energy(),
        return_exceptions=True,
    )
    # Derive military indicators from freshly-fetched flight+ship data
    await refresh_military()


def start_scheduler():
    scheduler.add_job(refresh_all, "interval", minutes=5, id="refresh_all", replace_existing=True)
    scheduler.start()
    logger.info("Scheduler started — refreshing every 5 minutes")
