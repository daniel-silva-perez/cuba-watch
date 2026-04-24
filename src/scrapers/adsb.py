import aiohttp
import logging

logger = logging.getLogger(__name__)

ADSB_URL = "https://api.adsb.lol/v2/lat/21.5/lon/-80.0/dist/400"


async def fetch_flights() -> list:
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as session:
            async with session.get(ADSB_URL, headers={"User-Agent": "CubaMonitor/1.0"}) as resp:
                if resp.status != 200:
                    logger.warning(f"ADS-B returned {resp.status}")
                    return []
                data = await resp.json()
                return _parse(data)
    except Exception as e:
        logger.error(f"Flight fetch failed: {e}")
        return []


def _parse(data: dict) -> list:
    flights = []
    for ac in data.get("ac", []):
        lat = ac.get("lat")
        lon = ac.get("lon")
        if lat is None or lon is None:
            continue
        flights.append({
            "icao": ac.get("hex", "unknown"),
            "callsign": (ac.get("flight") or "").strip() or None,
            "lat": float(lat),
            "lon": float(lon),
            "altitude": ac.get("alt_baro") if isinstance(ac.get("alt_baro"), int) else None,
            "speed": int(ac.get("gs", 0)) if ac.get("gs") else None,
            "heading": int(ac.get("track", 0)) if ac.get("track") else None,
            "aircraft_type": ac.get("t") or ac.get("type"),
            "origin": None,
            "destination": None,
        })
    return flights
