import aiohttp
import feedparser
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

CUBA_KEYWORDS = ["cuba", "havana", "habana", "castro", "díaz-canel", "diaz-canel", "cuban"]

RSS_FEEDS = [
    ("BBC", "http://feeds.bbci.co.uk/news/world/latin_america/rss.xml"),
    ("Reuters", "https://feeds.reuters.com/reuters/latamNews"),
    ("AP", "https://rsshub.app/apnews/topics/cuba"),
    ("AP World", "https://rsshub.app/apnews/world-news"),
    ("Miami Herald", "https://www.miamiherald.com/news/nation-world/world/americas/cuba/?widgetName=rssfeed&widgetContentId=712015&getXmlFeed=true"),
    ("14yMedio", "https://www.14ymedio.com/rss.xml"),
    ("EcuRed News", "https://oncubanews.com/feed/"),
]


async def fetch_news() -> list:
    articles = []
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as session:
        for source, url in RSS_FEEDS:
            try:
                async with session.get(url, headers={"User-Agent": "CubaMonitor/1.0"}) as resp:
                    if resp.status != 200:
                        logger.warning(f"{source} RSS returned {resp.status}")
                        continue
                    text = await resp.text()
                    feed = feedparser.parse(text)
                    for entry in feed.entries[:20]:
                        title = entry.get("title", "")
                        summary = entry.get("summary", entry.get("description", ""))
                        if _is_cuba_related(title, summary):
                            articles.append({
                                "title": title,
                                "url": entry.get("link", ""),
                                "source": source,
                                "published": _parse_date(entry),
                                "summary": summary[:500] if summary else None,
                            })
            except Exception as e:
                logger.error(f"News fetch failed for {source}: {e}")
    # Deduplicate by URL
    seen = set()
    unique = []
    for a in articles:
        if a["url"] not in seen:
            seen.add(a["url"])
            unique.append(a)
    return unique


def _is_cuba_related(title: str, summary: str) -> bool:
    text = f"{title} {summary}".lower()
    return any(kw in text for kw in CUBA_KEYWORDS)


def _parse_date(entry) -> str:
    for field in ("published", "updated", "created"):
        val = entry.get(field)
        if val:
            return val
    return datetime.utcnow().isoformat()
