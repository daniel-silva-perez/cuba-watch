import aiohttp
import logging

logger = logging.getLogger(__name__)

WEATHER_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=23.1136&longitude=-82.3666"
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,"
    "wind_speed_10m,wind_direction_10m,precipitation,weather_code"
    "&timezone=America%2FHavana"
)

WMO_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
    95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Thunderstorm w/ heavy hail",
}


async def fetch_weather() -> dict:
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            async with session.get(WEATHER_URL) as resp:
                if resp.status != 200:
                    logger.warning(f"Weather API returned {resp.status}")
                    return {}
                data = await resp.json()
                return _parse(data)
    except Exception as e:
        logger.error(f"Weather fetch failed: {e}")
        return {}


def _parse(data: dict) -> dict:
    current = data.get("current", {})
    code = current.get("weather_code")
    return {
        "temperature": current.get("temperature_2m"),
        "apparent_temperature": current.get("apparent_temperature"),
        "humidity": current.get("relative_humidity_2m"),
        "wind_speed": current.get("wind_speed_10m"),
        "wind_direction": current.get("wind_direction_10m"),
        "precipitation": current.get("precipitation"),
        "weather_code": code,
        "description": WMO_CODES.get(code, "Unknown"),
    }
