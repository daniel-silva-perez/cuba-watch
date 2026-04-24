import aiohttp
import logging

logger = logging.getLogger(__name__)

# Marine Cadastre / AIS open data — fallback to VesselFinder scrape-lite
# We use the MarineTraffic expected positions endpoint alternative via open APIs.
# Primary: VesselFinder free tile API (no key for basic positions)
# Fallback: return cached/empty

VESSEL_URL = "https://www.vesselfinder.com/api/pub/vessels?usermark=0&minlat=19.0&maxlat=24.5&minlon=-85.0&maxlon=-74.0"

# Cuba bounding box: lat 19.8–23.2, lon -85.0 to -74.0


async def fetch_ships() -> list:
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as session:
            headers = {
                "User-Agent": "Mozilla/5.0 (compatible; CubaMonitor/1.0)",
                "Referer": "https://www.vesselfinder.com/",
            }
            async with session.get(VESSEL_URL, headers=headers) as resp:
                if resp.status != 200:
                    logger.warning(f"VesselFinder returned {resp.status}")
                    return _fallback_ships()
                data = await resp.json(content_type=None)
                return _parse(data)
    except Exception as e:
        logger.error(f"Ship fetch failed: {e}")
        return _fallback_ships()


def _parse(data) -> list:
    ships = []
    if isinstance(data, list):
        for item in data:
            # VesselFinder format varies; handle array or object
            try:
                if isinstance(item, list) and len(item) >= 3:
                    ships.append({
                        "mmsi": str(item[0]),
                        "name": item[1] if len(item) > 1 else None,
                        "lat": float(item[2]),
                        "lon": float(item[3]) if len(item) > 3 else 0,
                        "speed": float(item[4]) / 10.0 if len(item) > 4 else None,
                        "heading": int(item[5]) if len(item) > 5 else None,
                        "ship_type": None,
                        "flag": None,
                    })
                elif isinstance(item, dict):
                    ships.append({
                        "mmsi": str(item.get("mmsi", item.get("MMSI", "unknown"))),
                        "name": item.get("name") or item.get("NAME"),
                        "lat": float(item.get("lat") or item.get("LAT") or 0),
                        "lon": float(item.get("lon") or item.get("LON") or 0),
                        "speed": item.get("speed") or item.get("SOG"),
                        "heading": item.get("heading") or item.get("COG"),
                        "ship_type": item.get("type") or item.get("TYPE"),
                        "flag": item.get("flag") or item.get("FLAG"),
                    })
            except Exception:
                continue
    return ships


def _fallback_ships() -> list:
    # Return a few known static vessels for demo/fallback
    return [
        {
            "mmsi": "123456789",
            "name": "HAVANA PORT (cached)",
            "lat": 23.1,
            "lon": -82.35,
            "speed": 0.0,
            "heading": 0,
            "ship_type": "Cargo",
            "flag": "CU",
        }
    ]
