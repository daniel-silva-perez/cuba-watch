import aiohttp
import feedparser
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

OUTAGE_KEYWORDS = ["blackout", "apagón", "apagon", "power outage", "electricity", "energy crisis",
                   "power cut", "power failure", "without electricity", "sin electricidad"]

ENERGY_FEEDS = [
    ("14yMedio", "https://www.14ymedio.com/rss.xml"),
    ("OnCuba", "https://oncubanews.com/feed/"),
]


async def fetch_energy() -> dict:
    outage_reports = 0
    notes = []

    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as session:
            for source, url in ENERGY_FEEDS:
                try:
                    async with session.get(url, headers={"User-Agent": "CubaMonitor/1.0"}) as resp:
                        if resp.status != 200:
                            continue
                        text = await resp.text()
                        feed = feedparser.parse(text)
                        for entry in feed.entries[:30]:
                            title = (entry.get("title") or "").lower()
                            summary = (entry.get("summary") or "").lower()
                            combined = f"{title} {summary}"
                            if any(kw in combined for kw in OUTAGE_KEYWORDS):
                                outage_reports += 1
                                notes.append(entry.get("title", "")[:100])
                except Exception as e:
                    logger.error(f"Energy feed {source} failed: {e}")
    except Exception as e:
        logger.error(f"Energy fetch session failed: {e}")

    if outage_reports >= 3:
        status, level = "CRITICAL", "red"
    elif outage_reports >= 1:
        status, level = "DEGRADED", "yellow"
    else:
        status, level = "STABLE", "green"

    return {
        "status": status,
        "level": level,
        "outage_reports": outage_reports,
        "source": "RSS News Analysis",
        "notes": "; ".join(notes[:3]) if notes else "No recent outage reports",
        "fetched_at": datetime.utcnow().isoformat(),
    }
