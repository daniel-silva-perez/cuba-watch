import aiohttp
import logging

logger = logging.getLogger(__name__)

ADSB_URL = "https://api.adsb.lol/v2/lat/21.5/lon/-80.0/dist/400"
OPENSKY_URL = (
    "https://opensky-network.org/api/states/all"
    "?lamin=17.0&lamax=28.0&lomin=-88.0&lomax=-68.0"
)

_adsb_failures = 0
LAST_SOURCE = "adsb.lol"


async def fetch_flights() -> list:
    global _adsb_failures, LAST_SOURCE
    LAST_SOURCE = "adsb.lol"
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as session:
            async with session.get(ADSB_URL, headers={"User-Agent": "CubaMonitor/1.0"}) as resp:
                if resp.status != 200:
                    logger.warning(f"ADS-B returned {resp.status}")
                    _adsb_failures += 1
                    return await _fetch_opensky(session) if _adsb_failures >= 2 else []
                data = await resp.json()
                parsed = _parse_adsb(data)
                if parsed:
                    _adsb_failures = 0
                    LAST_SOURCE = "adsb.lol"
                    return parsed
                _adsb_failures += 1
                return await _fetch_opensky(session) if _adsb_failures >= 2 else []
    except Exception as e:
        logger.error(f"Flight fetch failed: {e}")
        _adsb_failures += 1
        if _adsb_failures >= 2:
            return await _fetch_opensky()
        return []


async def _fetch_opensky(session: aiohttp.ClientSession | None = None) -> list:
    global LAST_SOURCE
    owns_session = session is None
    try:
        if owns_session:
            session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15))
        async with session.get(OPENSKY_URL, headers={"User-Agent": "CubaMonitor/1.0"}) as resp:
            if resp.status != 200:
                logger.warning(f"OpenSky returned {resp.status}")
                return []
            data = await resp.json()
            parsed = _parse_opensky(data)
            if parsed:
                LAST_SOURCE = "OpenSky"
                logger.info(f"OpenSky failover returned {len(parsed)} flights")
            return parsed
    except Exception as e:
        logger.error(f"OpenSky failover failed: {e}")
        return []
    finally:
        if owns_session and session is not None:
            await session.close()


def _parse_adsb(data: dict) -> list:
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
            "source": "adsb.lol",
        })
    return flights


def _parse_opensky(data: dict) -> list:
    flights = []
    for state in data.get("states") or []:
        try:
            icao = state[0]
            callsign = (state[1] or "").strip() or None
            lon = state[5]
            lat = state[6]
            if lat is None or lon is None:
                continue
            altitude_m = state[7] if state[7] is not None else state[13]
            velocity_ms = state[9]
            heading = state[10]
            flights.append({
                "icao": icao or "unknown",
                "callsign": callsign,
                "lat": float(lat),
                "lon": float(lon),
                "altitude": int(altitude_m * 3.28084) if altitude_m is not None else None,
                "speed": int(velocity_ms * 1.94384) if velocity_ms is not None else None,
                "heading": int(heading) if heading is not None else None,
                "aircraft_type": None,
                "origin": state[2],
                "destination": None,
                "source": "OpenSky",
            })
        except Exception:
            continue
    return flights
