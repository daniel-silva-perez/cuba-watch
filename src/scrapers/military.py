import logging
from datetime import datetime, timezone
from src import database as db

logger = logging.getLogger(__name__)

# USAF Air Mobility Command callsign prefixes (C-17, C-130, KC-135, etc.)
MILITARY_CALLSIGN_PREFIXES = [
    "RCH", "REACH", "JAKE", "SLAM", "SENTRY", "HAVOC", "TOPAZ",
    "DUKE", "FURY", "KNIFE", "CODY", "ANVIL", "BOXER", "CHALK",
    "ATLAS", "IRON", "STEEL", "EAGLE", "HAWK", "VIPER", "GHOST",
    "USCG", "USAF", "ARMY", "NAVY", "USMC",
]

# Aircraft types associated with military transport / ISR / tanker operations
MILITARY_AIRCRAFT_TYPES = [
    "C17", "C-17", "C130", "C-130", "KC135", "KC-135", "KC46", "KC-46",
    "E3", "E-3", "P8", "P-8", "EP3", "EP-3", "RC135", "RC-135",
    "B52", "B-52", "B1", "B-1", "B2", "B-2",
    "E8", "E-8", "E6", "E-6",
]

# Coast Guard vessel name indicators
USCG_VESSEL_INDICATORS = ["USCG", "COAST GUARD", "CGC ", "DEPENDABLE", "FORWARD", "DECISIVE", "STRATTON", "BERTHOLF"]

# Cuba-adjacent bounding box for military relevance filter
LAT_MIN, LAT_MAX = 17.0, 27.0
LON_MIN, LON_MAX = -90.0, -70.0


def _is_military_flight(f: dict) -> bool:
    callsign = (f.get("callsign") or "").upper().strip()
    aircraft_type = (f.get("aircraft_type") or "").upper().strip()

    for prefix in MILITARY_CALLSIGN_PREFIXES:
        if callsign.startswith(prefix):
            return True

    for t in MILITARY_AIRCRAFT_TYPES:
        if t.upper() in aircraft_type:
            return True

    return False


def _is_uscg_vessel(s: dict) -> bool:
    name = (s.get("name") or "").upper()
    flag = (s.get("flag") or "").upper()
    ship_type = (s.get("ship_type") or "").upper()

    for indicator in USCG_VESSEL_INDICATORS:
        if indicator in name:
            return True

    # US-flagged law enforcement / patrol vessels
    if flag in ("US", "USA", "UNITED STATES") and "PATROL" in ship_type:
        return True

    return False


def _in_bounds(lat, lon) -> bool:
    if lat is None or lon is None:
        return False
    return LAT_MIN <= lat <= LAT_MAX and LON_MIN <= lon <= LON_MAX


def detect_movements() -> list:
    """Derive troop movement indicators from existing flight and ship DB snapshots."""
    movements = []
    now = datetime.now(timezone.utc).isoformat()

    # --- Military aircraft ---
    flights = db.get_flights()
    for f in flights:
        if not _is_military_flight(f):
            continue
        if not _in_bounds(f.get("lat"), f.get("lon")):
            continue

        callsign = f.get("callsign") or f.get("icao", "UNKNOWN")
        aircraft_type = f.get("aircraft_type") or "unknown type"
        alt = f.get("altitude")
        speed = f.get("speed")

        detail_parts = [f"Aircraft: {aircraft_type}"]
        if alt:
            detail_parts.append(f"{alt} ft")
        if speed:
            detail_parts.append(f"{speed} kt")

        movements.append({
            "type": "military_aircraft",
            "description": f"{callsign} — {', '.join(detail_parts)}",
            "lat": f.get("lat"),
            "lon": f.get("lon"),
            "source_url": "https://adsb.lol",
            "timestamp": now,
            "confidence": "high",
        })

    # --- USCG / US Navy vessels ---
    ships = db.get_ships()
    for s in ships:
        if not _is_uscg_vessel(s):
            continue
        if not _in_bounds(s.get("lat"), s.get("lon")):
            continue

        name = s.get("name") or s.get("mmsi", "Unknown vessel")
        ship_type = s.get("ship_type") or "vessel"
        flag = s.get("flag") or ""

        movements.append({
            "type": "uscg_vessel",
            "description": f"{name} — {ship_type} [{flag}] in Florida Straits area",
            "lat": s.get("lat"),
            "lon": s.get("lon"),
            "source_url": "https://www.vesselfinder.com",
            "timestamp": now,
            "confidence": "medium",
        })

    logger.info(f"Detected {len(movements)} troop movement indicators")
    return movements
