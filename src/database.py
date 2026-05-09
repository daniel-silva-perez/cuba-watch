import os
import sqlite3
import json
from pathlib import Path
from datetime import datetime

_default_db = "/tmp/cuba_monitor.db" if os.getenv("VERCEL", "").lower() in {"1", "true", "yes"} else str(Path(__file__).parent.parent / "cuba_monitor.db")
DB_PATH = Path(os.getenv("CUBA_WATCH_DB_PATH", _default_db))


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS flights (
            icao TEXT PRIMARY KEY,
            callsign TEXT,
            lat REAL,
            lon REAL,
            altitude INTEGER,
            speed INTEGER,
            heading INTEGER,
            origin TEXT,
            destination TEXT,
            aircraft_type TEXT,
            source TEXT,
            fetched_at TEXT
        );

        CREATE TABLE IF NOT EXISTS ships (
            mmsi TEXT PRIMARY KEY,
            name TEXT,
            lat REAL,
            lon REAL,
            speed REAL,
            heading INTEGER,
            ship_type TEXT,
            flag TEXT,
            source TEXT,
            fetched_at TEXT
        );

        CREATE TABLE IF NOT EXISTS news (
            url TEXT PRIMARY KEY,
            title TEXT,
            source TEXT,
            published TEXT,
            summary TEXT,
            fetched_at TEXT
        );

        CREATE TABLE IF NOT EXISTS weather (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT,
            fetched_at TEXT
        );

        CREATE TABLE IF NOT EXISTS energy (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT,
            fetched_at TEXT
        );

        CREATE TABLE IF NOT EXISTS seismic_events (
            event_id TEXT PRIMARY KEY,
            title TEXT,
            lat REAL,
            lon REAL,
            magnitude REAL,
            depth_km REAL,
            place TEXT,
            event_time TEXT,
            url TEXT,
            source TEXT,
            fetched_at TEXT
        );

        CREATE TABLE IF NOT EXISTS ioda_connectivity (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT,
            fetched_at TEXT
        );

        CREATE TABLE IF NOT EXISTS source_health (
            key TEXT PRIMARY KEY,
            label TEXT,
            status TEXT,
            active_source TEXT,
            last_attempt TEXT,
            last_success TEXT,
            last_error TEXT,
            last_count INTEGER
        );

        CREATE TABLE IF NOT EXISTS military_bases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            lat REAL,
            lon REAL,
            country TEXT,
            type TEXT,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS troop_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            description TEXT,
            lat REAL,
            lon REAL,
            source_url TEXT,
            timestamp TEXT,
            confidence TEXT
        );

        CREATE TABLE IF NOT EXISTS strategic_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            lat REAL,
            lon REAL,
            type TEXT,
            description TEXT,
            importance TEXT
        );

        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            title TEXT,
            description TEXT,
            severity TEXT,
            lat REAL,
            lon REAL,
            source TEXT,
            source_url TEXT,
            observed_at TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS refresh_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TEXT,
            finished_at TEXT,
            duration_ms INTEGER,
            status TEXT,
            error TEXT
        );

        CREATE TABLE IF NOT EXISTS analyst_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER,
            body TEXT NOT NULL,
            created_at TEXT
        );
    """)
    _ensure_column(c, "flights", "source", "TEXT")
    _ensure_column(c, "ships", "source", "TEXT")
    _ensure_column(c, "seismic_events", "source", "TEXT")
    conn.commit()
    conn.close()
    _seed_static_data()


def _ensure_column(cursor, table: str, column: str, definition: str):
    existing = {row[1] for row in cursor.execute(f"PRAGMA table_info({table})").fetchall()}
    if column not in existing:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


# ── Flights ──────────────────────────────────────────────────────────────────

def upsert_flights(flights: list):
    conn = get_conn()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    c.execute("DELETE FROM flights")
    for f in flights:
        c.execute("""
            INSERT OR REPLACE INTO flights
            (icao, callsign, lat, lon, altitude, speed, heading, origin, destination, aircraft_type, source, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (f.get("icao"), f.get("callsign"), f.get("lat"), f.get("lon"),
              f.get("altitude"), f.get("speed"), f.get("heading"),
              f.get("origin"), f.get("destination"), f.get("aircraft_type"),
              f.get("source"), now))
    conn.commit()
    conn.close()


def get_flights():
    conn = get_conn()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM flights").fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Ships ─────────────────────────────────────────────────────────────────────

def upsert_ships(ships: list):
    conn = get_conn()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    c.execute("DELETE FROM ships")
    for s in ships:
        c.execute("""
            INSERT OR REPLACE INTO ships
            (mmsi, name, lat, lon, speed, heading, ship_type, flag, source, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (s.get("mmsi"), s.get("name"), s.get("lat"), s.get("lon"),
              s.get("speed"), s.get("heading"), s.get("ship_type"),
              s.get("flag"), s.get("source"), now))
    conn.commit()
    conn.close()


def get_ships():
    conn = get_conn()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM ships").fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── News ──────────────────────────────────────────────────────────────────────

def upsert_news(articles: list):
    conn = get_conn()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    for a in articles:
        c.execute("""
            INSERT OR REPLACE INTO news (url, title, source, published, summary, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (a.get("url"), a.get("title"), a.get("source"),
              a.get("published"), a.get("summary"), now))
    c.execute("DELETE FROM news WHERE url NOT IN (SELECT url FROM news ORDER BY fetched_at DESC LIMIT 100)")
    conn.commit()
    conn.close()


def get_news(limit=50):
    conn = get_conn()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM news ORDER BY published DESC, fetched_at DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Weather ───────────────────────────────────────────────────────────────────

def upsert_weather(data: dict):
    conn = get_conn()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    c.execute("DELETE FROM weather")
    c.execute("INSERT INTO weather (data, fetched_at) VALUES (?, ?)", (json.dumps(data), now))
    conn.commit()
    conn.close()


def get_weather():
    conn = get_conn()
    c = conn.cursor()
    row = c.execute("SELECT * FROM weather ORDER BY fetched_at DESC LIMIT 1").fetchone()
    conn.close()
    if row:
        return {"data": json.loads(row["data"]), "fetched_at": row["fetched_at"]}
    return None


# ── Energy ────────────────────────────────────────────────────────────────────

def upsert_energy(data: dict):
    conn = get_conn()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    c.execute("DELETE FROM energy")
    c.execute("INSERT INTO energy (data, fetched_at) VALUES (?, ?)", (json.dumps(data), now))
    conn.commit()
    conn.close()


def get_energy():
    conn = get_conn()
    c = conn.cursor()
    row = c.execute("SELECT * FROM energy ORDER BY fetched_at DESC LIMIT 1").fetchone()
    conn.close()
    if row:
        return {"data": json.loads(row["data"]), "fetched_at": row["fetched_at"]}
    return None


# ── Seismic Events ────────────────────────────────────────────────────────────

def replace_seismic_events(events: list):
    conn = get_conn()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    c.execute("DELETE FROM seismic_events")
    for e in events:
        c.execute("""
            INSERT OR REPLACE INTO seismic_events
            (event_id, title, lat, lon, magnitude, depth_km, place, event_time, url, source, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            e.get("event_id"),
            e.get("title"),
            e.get("lat"),
            e.get("lon"),
            e.get("magnitude"),
            e.get("depth_km"),
            e.get("place"),
            e.get("event_time"),
            e.get("url"),
            e.get("source"),
            now,
        ))
    conn.commit()
    conn.close()


def get_seismic_events(limit=50):
    conn = get_conn()
    c = conn.cursor()
    rows = c.execute(
        "SELECT * FROM seismic_events ORDER BY event_time DESC, fetched_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Connectivity / Source Health ──────────────────────────────────────────────

def upsert_ioda_connectivity(data: dict):
    conn = get_conn()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    c.execute(
        "INSERT OR REPLACE INTO ioda_connectivity (id, data, fetched_at) VALUES (1, ?, ?)",
        (json.dumps(data), now),
    )
    conn.commit()
    conn.close()


def get_ioda_connectivity():
    conn = get_conn()
    c = conn.cursor()
    row = c.execute("SELECT * FROM ioda_connectivity WHERE id = 1").fetchone()
    conn.close()
    if row:
        return {"data": json.loads(row["data"]), "fetched_at": row["fetched_at"]}
    return None


def record_source_health(
    key: str,
    label: str,
    status: str,
    *,
    active_source: str | None = None,
    count: int | None = None,
    error: str | None = None,
):
    conn = get_conn()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    last_success = now if status == "ok" else None
    c.execute("""
        INSERT INTO source_health
        (key, label, status, active_source, last_attempt, last_success, last_error, last_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
            label = excluded.label,
            status = excluded.status,
            active_source = COALESCE(excluded.active_source, source_health.active_source),
            last_attempt = excluded.last_attempt,
            last_success = COALESCE(excluded.last_success, source_health.last_success),
            last_error = excluded.last_error,
            last_count = COALESCE(excluded.last_count, source_health.last_count)
    """, (key, label, status, active_source, now, last_success, error, count))
    conn.commit()
    conn.close()


def get_source_health():
    conn = get_conn()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM source_health ORDER BY key").fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Military Bases ────────────────────────────────────────────────────────────

def get_military_bases():
    conn = get_conn()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM military_bases").fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Troop Movements ───────────────────────────────────────────────────────────

def replace_troop_movements(movements: list):
    conn = get_conn()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    c.execute("DELETE FROM troop_movements")
    for m in movements:
        c.execute("""
            INSERT INTO troop_movements (type, description, lat, lon, source_url, timestamp, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            m.get("type"),
            m.get("description"),
            m.get("lat"),
            m.get("lon"),
            m.get("source_url"),
            m.get("timestamp") or now,
            m.get("confidence", "low"),
        ))
    conn.commit()
    conn.close()


def get_troop_movements(limit=50):
    conn = get_conn()
    c = conn.cursor()
    rows = c.execute(
        "SELECT * FROM troop_movements ORDER BY timestamp DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Strategic Assets ──────────────────────────────────────────────────────────

def get_strategic_assets():
    conn = get_conn()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM strategic_assets").fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Seed Data ─────────────────────────────────────────────────────────────────

_MILITARY_BASES = [
    {
        "name": "San Antonio de los Baños Air Base",
        "lat": 22.8731, "lon": -82.5089, "country": "CU", "type": "airbase",
        "description": "Primary Cuban Air Force base — hosts MiG-29 fighters and transport aircraft",
    },
    {
        "name": "Mariel Naval Base",
        "lat": 22.9953, "lon": -82.7564, "country": "CU", "type": "naval",
        "description": "Key Cuban Navy installation adjacent to Mariel port — submarine support capable",
    },
    {
        "name": "Guantanamo Bay Naval Station (GITMO)",
        "lat": 19.9045, "lon": -75.1146, "country": "US", "type": "naval",
        "description": "US Naval Station — leased territory, forward staging base for Caribbean operations",
    },
    {
        "name": "Camagüey Military Airfield",
        "lat": 21.4203, "lon": -77.8475, "country": "CU", "type": "airbase",
        "description": "Ignacio Agramonte Airport — dual-use military/civil airfield, central Cuba",
    },
    {
        "name": "Havana Harbor Defense",
        "lat": 23.1432, "lon": -82.3519, "country": "CU", "type": "coastal_defense",
        "description": "Coastal defense installations guarding Havana harbor entrance",
    },
    {
        "name": "Ciudad Libertad Air Base",
        "lat": 23.1028, "lon": -82.4628, "country": "CU", "type": "airbase",
        "description": "Former Camp Columbia — military airfield and revolutionary armed forces academy",
    },
    {
        "name": "Santiago de Cuba Air Base",
        "lat": 19.9698, "lon": -75.8454, "country": "CU", "type": "airbase",
        "description": "Antonio Maceo Airport — dual-use military/civil installation, eastern Cuba",
    },
    # Puerto Rico
    {
        "name": "Roosevelt Roads Naval Station",
        "lat": 18.2370, "lon": -65.6238, "country": "US", "type": "naval",
        "description": "Former US Navy base — still hosts Coast Guard, Customs, and reserve units",
    },
    {
        "name": "Muñiz Air National Guard Base",
        "lat": 18.4394, "lon": -66.0026, "country": "US", "type": "airbase",
        "description": "Puerto Rico Air National Guard — 156th Airlift Wing (C-130 Hercules)",
    },
    {
        "name": "Ramey Air Force Base (Coast Guard)",
        "lat": 18.4948, "lon": -67.1311, "country": "US", "type": "airbase",
        "description": "US Coast Guard Air Station Borinquen — HC-130J and MH-60T operations",
    },
    {
        "name": "Fort Buchanan",
        "lat": 18.4057, "lon": -66.1547, "country": "US", "type": "army",
        "description": "US Army installation near San Juan — logistical hub for Caribbean operations",
    },
    # Florida / Southeast US
    {
        "name": "Naval Air Station Key West",
        "lat": 24.5757, "lon": -81.6886, "country": "US", "type": "naval",
        "description": "Premier training facility for tactical aviation — 90 miles from Cuba",
    },
    {
        "name": "Homestead Air Reserve Base",
        "lat": 25.4882, "lon": -80.3836, "country": "US", "type": "airbase",
        "description": "USAF Reserve base — 30 miles from Miami, rapid response to Caribbean",
    },
    {
        "name": "MacDill Air Force Base",
        "lat": 27.8494, "lon": -82.5007, "country": "US", "type": "airbase",
        "description": "USCENTCOM & USSOCOM headquarters — strategic command for Middle East/Caribbean",
    },
    {
        "name": "Naval Station Mayport",
        "lat": 30.3920, "lon": -81.4170, "country": "US", "type": "naval",
        "description": "Major US Navy surface fleet base — carrier-capable port",
    },
    {
        "name": "Naval Air Station Jacksonville",
        "lat": 30.2358, "lon": -81.6803, "country": "US", "type": "naval",
        "description": "US Navy maritime patrol base — P-8A Poseidon anti-submarine warfare",
    },
    {
        "name": "Patrick Space Force Base",
        "lat": 28.2344, "lon": -80.6108, "country": "US", "type": "space",
        "description": "USSF base — Eastern Range launch support, space domain awareness",
    },
    # Other Caribbean
    {
        "name": "HMAS Caguas (Jamaica Defence Force)",
        "lat": 17.9712, "lon": -76.7926, "country": "JM", "type": "naval",
        "description": "Jamaica Coast Guard base — western Caribbean maritime security",
    },
    {
        "name": "Grand Bahama Shipyard (Freeport)",
        "lat": 26.5333, "lon": -78.7000, "country": "BS", "type": "naval",
        "description": "Strategic drydock facility — can accommodate large naval vessels",
    },
]

_STRATEGIC_ASSETS = [
    {
        "name": "Moa Bay Nickel Mine",
        "lat": 20.6575, "lon": -74.9410, "type": "mining",
        "description": "Largest nickel-cobalt mining complex in Cuba — critical strategic export resource",
        "importance": "critical",
    },
    {
        "name": "Cienfuegos Oil Refinery",
        "lat": 22.0976, "lon": -80.4486, "type": "refinery",
        "description": "Camilo Cienfuegos refinery — primary Cuban petroleum processing facility",
        "importance": "critical",
    },
    {
        "name": "Mariel Deep-Water Port",
        "lat": 22.9988, "lon": -82.7481, "type": "port",
        "description": "Strategic deep-water port and free trade zone — Chinese-built, supports large vessels",
        "importance": "high",
    },
    {
        "name": "CTE Tallapiedra Power Plant",
        "lat": 23.1236, "lon": -82.3617, "type": "power_plant",
        "description": "Havana thermoelectric plant — critical urban power supply for the capital",
        "importance": "critical",
    },
    {
        "name": "CTE Felton Power Plant",
        "lat": 20.7167, "lon": -75.6833, "type": "power_plant",
        "description": "Holguín province thermoelectric plant — major eastern Cuba power node",
        "importance": "high",
    },
    {
        "name": "CTE Antonio Maceo Power Plant",
        "lat": 20.0451, "lon": -75.8570, "type": "power_plant",
        "description": "Santiago de Cuba thermoelectric plant — eastern regional power supply",
        "importance": "high",
    },
    {
        "name": "Boca de Jaruco Offshore Oil Field",
        "lat": 23.1500, "lon": -82.1167, "type": "oil_field",
        "description": "Offshore oil extraction zone north of Havana — Cuban upstream petroleum production",
        "importance": "medium",
    },
    {
        "name": "Lourdes SIGINT Facility (former)",
        "lat": 22.9167, "lon": -82.2333, "type": "sigint",
        "description": "Former Russian signals intelligence facility — now reported Cuban military use",
        "importance": "medium",
    },
]


def _seed_static_data():
    conn = get_conn()
    c = conn.cursor()

    # Insert new bases, ignore duplicates
    for b in _MILITARY_BASES:
        c.execute(
            "INSERT OR IGNORE INTO military_bases (name, lat, lon, country, type, description) VALUES (?, ?, ?, ?, ?, ?)",
            (b["name"], b["lat"], b["lon"], b["country"], b["type"], b["description"]),
        )

    # Insert new assets, ignore duplicates
    for a in _STRATEGIC_ASSETS:
        c.execute(
            "INSERT OR IGNORE INTO strategic_assets (name, lat, lon, type, description, importance) VALUES (?, ?, ?, ?, ?, ?)",
            (a["name"], a["lat"], a["lon"], a["type"], a["description"], a["importance"]),
        )

    conn.commit()
    conn.close()

# ── Unified Events / Notes / Metrics ─────────────────────────────────────────

def replace_events(events: list):
    conn = get_conn()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    c.execute("DELETE FROM events")
    for e in events:
        c.execute("""
            INSERT INTO events (category, title, description, severity, lat, lon, source, source_url, observed_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            e.get("category"), e.get("title"), e.get("description"), e.get("severity"),
            e.get("lat"), e.get("lon"), e.get("source"), e.get("source_url"), e.get("observed_at"), now,
        ))
    conn.commit()
    conn.close()


def get_events(limit=100):
    conn = get_conn()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM events ORDER BY observed_at DESC, created_at DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_analyst_note(body: str, event_id: int | None = None):
    conn = get_conn()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()
    c.execute("INSERT INTO analyst_notes (event_id, body, created_at) VALUES (?, ?, ?)", (event_id, body, now))
    conn.commit()
    note_id = c.lastrowid
    conn.close()
    return {"id": note_id, "event_id": event_id, "body": body, "created_at": now}


def get_analyst_notes(limit=50):
    conn = get_conn()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM analyst_notes ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def start_refresh_run():
    conn = get_conn()
    c = conn.cursor()
    started_at = datetime.utcnow().isoformat()
    c.execute("INSERT INTO refresh_runs (started_at, status) VALUES (?, ?)", (started_at, "running"))
    conn.commit()
    run_id = c.lastrowid
    conn.close()
    return run_id, started_at


def finish_refresh_run(run_id: int, status: str = "ok", error: str | None = None):
    conn = get_conn()
    c = conn.cursor()
    finished_at = datetime.utcnow().isoformat()
    row = c.execute("SELECT started_at FROM refresh_runs WHERE id = ?", (run_id,)).fetchone()
    duration_ms = None
    if row:
        try:
            start = datetime.fromisoformat(row["started_at"])
            end = datetime.fromisoformat(finished_at)
            duration_ms = int((end - start).total_seconds() * 1000)
        except Exception:
            duration_ms = None
    c.execute("UPDATE refresh_runs SET finished_at = ?, duration_ms = ?, status = ?, error = ? WHERE id = ?", (finished_at, duration_ms, status, error, run_id))
    conn.commit()
    conn.close()


def get_refresh_metrics():
    conn = get_conn()
    c = conn.cursor()
    total = c.execute("SELECT COUNT(*) AS n FROM refresh_runs").fetchone()["n"]
    failures = c.execute("SELECT COUNT(*) AS n FROM refresh_runs WHERE status != 'ok'").fetchone()["n"]
    avg_row = c.execute("SELECT AVG(duration_ms) AS avg_ms FROM refresh_runs WHERE duration_ms IS NOT NULL").fetchone()
    last = c.execute("SELECT * FROM refresh_runs ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    return {
        "refreshes_total": total,
        "refresh_failures": failures,
        "avg_refresh_duration_ms": round(avg_row["avg_ms"] or 0, 2),
        "last_refresh": dict(last) if last else None,
    }
