import logging
from datetime import datetime, timezone

import aiohttp

logger = logging.getLogger(__name__)

# USGS real-time GeoJSON feed, updated continuously and requiring no API key.
# The 24h window is intentionally used instead of the past-hour feed because
# Cuba-adjacent seismic activity is intermittent; the dashboard still remains
# near-real-time while avoiding an almost-always-empty map layer.
USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"

# Cuba + nearby Cayman/Jamaica/Hispaniola fault context.
LAT_MIN, LAT_MAX = 18.5, 23.8
LON_MIN, LON_MAX = -86.0, -73.0


async def fetch_seismic_events() -> list:
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as session:
            async with session.get(USGS_URL, headers={"User-Agent": "CubaMonitor/1.0"}) as resp:
                if resp.status != 200:
                    logger.warning("USGS seismic feed returned %s", resp.status)
                    return []
                data = await resp.json()
                return _parse(data)
    except Exception as e:
        logger.error("USGS seismic fetch failed: %s", e)
        return []


def _parse(data: dict) -> list:
    events = []
    for feature in data.get("features", []):
        geometry = feature.get("geometry") or {}
        coords = geometry.get("coordinates") or []
        if len(coords) < 2:
            continue

        lon, lat = coords[0], coords[1]
        if lat is None or lon is None or not _in_bounds(float(lat), float(lon)):
            continue

        props = feature.get("properties") or {}
        event_ms = props.get("time")
        event_time = None
        if event_ms:
            event_time = datetime.fromtimestamp(event_ms / 1000, tz=timezone.utc).isoformat()

        events.append({
            "event_id": feature.get("id") or props.get("code") or props.get("ids") or "unknown",
            "title": props.get("title") or "Seismic event",
            "lat": float(lat),
            "lon": float(lon),
            "magnitude": props.get("mag"),
            "depth_km": float(coords[2]) if len(coords) > 2 and coords[2] is not None else None,
            "place": props.get("place"),
            "event_time": event_time,
            "url": props.get("url"),
            "source": "USGS all-day GeoJSON",
        })
    return events


def _in_bounds(lat: float, lon: float) -> bool:
    return LAT_MIN <= lat <= LAT_MAX and LON_MIN <= lon <= LON_MAX
