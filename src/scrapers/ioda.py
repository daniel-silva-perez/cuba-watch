import logging
import statistics
import time
from urllib.parse import urlencode

import aiohttp

logger = logging.getLogger(__name__)

ASN = "27725"
ENTITY = "ETECSA / Cuba ASN 27725"
IODA_URL = "https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/asn/27725"
LOOKBACK_SECONDS = 24 * 60 * 60

_SIGNAL_LABELS = {
    "bgp": "BGP visibility",
    "ping-slash24": "Active probing",
    "gtr": "Google traffic",
    "merit-nt": "Network telescope",
}
_STATUS_SOURCES = ("bgp", "ping-slash24")


async def fetch_connectivity() -> dict:
    until = int(time.time())
    params = urlencode({"from": until - LOOKBACK_SECONDS, "until": until})
    url = f"{IODA_URL}?{params}"
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=25)) as session:
            async with session.get(url, headers={"User-Agent": "CubaMonitor/1.0"}) as resp:
                if resp.status != 200:
                    logger.warning("IODA connectivity feed returned %s", resp.status)
                    return {}
                data = await resp.json()
                if data.get("error"):
                    logger.warning("IODA connectivity feed error: %s", data.get("error"))
                    return {}
                return _parse(data)
    except Exception as e:
        logger.error("IODA connectivity fetch failed: %s", e)
        return {}


def _parse(payload: dict) -> dict:
    series = []
    for group in payload.get("data") or []:
        if isinstance(group, list):
            series.extend(group)
        elif isinstance(group, dict):
            series.append(group)

    signals = []
    for item in series:
        if not isinstance(item, dict):
            continue
        datasource = item.get("datasource") or "unknown"
        values = item.get("values") or []
        if not isinstance(values, list):
            continue
        numeric_values = [v for v in values if isinstance(v, (int, float))]
        current = _latest_numeric(values)
        baseline = _baseline(numeric_values)
        drop_percent = _drop_percent(current, baseline)
        signals.append({
            "datasource": datasource,
            "label": _SIGNAL_LABELS.get(datasource, datasource.upper()),
            "current": current,
            "baseline": baseline,
            "drop_percent": drop_percent,
            "from": item.get("from"),
            "until": item.get("until"),
            "step": item.get("step"),
            # Enough points for a compact 24h sparkline without bloating SQLite.
            "values": values[-72:],
        })

    level, status, notes = _classify(signals)
    return {
        "asn": ASN,
        "entity": ENTITY,
        "status": status,
        "level": level,
        "source": "IODA / CAIDA raw signals",
        "notes": notes,
        "signals": sorted(signals, key=lambda s: (s["datasource"] not in _STATUS_SOURCES, s["datasource"])),
    }


def _latest_numeric(values: list):
    for value in reversed(values):
        if isinstance(value, (int, float)):
            return value
    return None


def _baseline(values: list):
    if not values:
        return None
    sample = values[:-3] if len(values) > 6 else values
    sample = [v for v in sample if isinstance(v, (int, float))]
    if not sample:
        return None
    return float(statistics.median(sample))


def _drop_percent(current, baseline):
    if current is None or not baseline or baseline <= 0:
        return None
    return round(max(0, (baseline - current) / baseline * 100), 1)


def _classify(signals: list) -> tuple[str, str, str]:
    watched = [s for s in signals if s["datasource"] in _STATUS_SOURCES and s.get("drop_percent") is not None]
    if not watched:
        watched = [s for s in signals if s.get("drop_percent") is not None]
    if not watched:
        return "grey", "UNKNOWN", "IODA returned no usable numeric signal points."

    worst = max(watched, key=lambda s: s.get("drop_percent") or 0)
    drop = worst.get("drop_percent") or 0
    label = worst.get("label") or worst.get("datasource") or "signal"
    if drop >= 50:
        return "red", "DISRUPTED", f"{label} is down {drop:.0f}% versus its 24h median."
    if drop >= 20:
        return "yellow", "DEGRADED", f"{label} is down {drop:.0f}% versus its 24h median."
    return "green", "STABLE", "No major Cuba ASN connectivity drop detected in IODA BGP/active-probing signals."
