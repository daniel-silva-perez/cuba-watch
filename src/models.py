from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class Flight(BaseModel):
    icao: str
    callsign: Optional[str] = None
    lat: float
    lon: float
    altitude: Optional[int] = None
    speed: Optional[int] = None
    heading: Optional[int] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    aircraft_type: Optional[str] = None
    source: Optional[str] = None
    fetched_at: Optional[str] = None


class Ship(BaseModel):
    mmsi: str
    name: Optional[str] = None
    lat: float
    lon: float
    speed: Optional[float] = None
    heading: Optional[int] = None
    ship_type: Optional[str] = None
    flag: Optional[str] = None
    source: Optional[str] = None
    fetched_at: Optional[str] = None


class NewsArticle(BaseModel):
    title: str
    url: str
    source: str
    published: Optional[str] = None
    summary: Optional[str] = None
    fetched_at: Optional[str] = None


class Weather(BaseModel):
    temperature: Optional[float] = None
    apparent_temperature: Optional[float] = None
    humidity: Optional[int] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[int] = None
    precipitation: Optional[float] = None
    weather_code: Optional[int] = None
    description: Optional[str] = None
    fetched_at: Optional[str] = None


class EnergyStatus(BaseModel):
    status: str
    level: str
    outage_reports: int
    source: str
    notes: Optional[str] = None
    fetched_at: Optional[str] = None


class SeismicEvent(BaseModel):
    event_id: str
    title: str
    lat: float
    lon: float
    magnitude: Optional[float] = None
    depth_km: Optional[float] = None
    place: Optional[str] = None
    event_time: Optional[str] = None
    url: Optional[str] = None
    source: Optional[str] = None
    fetched_at: Optional[str] = None


class IodaConnectivity(BaseModel):
    asn: str
    entity: str
    status: str
    level: str
    source: str
    notes: Optional[str] = None
    signals: List[dict] = Field(default_factory=list)
    fetched_at: Optional[str] = None


class SystemStatus(BaseModel):
    flights: dict
    ships: dict
    news: dict
    weather: dict
    energy: dict
    seismic: dict
    ioda: dict
    sources: List[dict] = Field(default_factory=list)
