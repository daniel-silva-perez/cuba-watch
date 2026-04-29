from __future__ import annotations
from datetime import datetime, timedelta, timezone

def _now(offset_minutes: int = 0) -> str:
    return (datetime.now(timezone.utc) + timedelta(minutes=offset_minutes)).replace(microsecond=0).isoformat().replace('+00:00','Z')

def flights() -> list[dict]:
    return [
        {'icao':'a8f1c2','callsign':'RCH421','lat':24.55,'lon':-81.72,'altitude':28000,'speed':410,'heading':185,'aircraft_type':'C-17A','source':'demo ADS-B'},
        {'icao':'ac1301','callsign':'CG1023','lat':23.68,'lon':-82.31,'altitude':5200,'speed':210,'heading':130,'aircraft_type':'HC-144','source':'demo ADS-B'},
        {'icao':'c0ffee','callsign':'CUA455','lat':22.98,'lon':-82.40,'altitude':11000,'speed':250,'heading':92,'aircraft_type':'A320','source':'demo ADS-B'},
        {'icao':'bada55','callsign':'N742QS','lat':21.45,'lon':-79.80,'altitude':34000,'speed':460,'heading':250,'aircraft_type':'CL35','source':'demo ADS-B'},
    ]

def ships() -> list[dict]:
    return [
        {'mmsi':'368926000','name':'USCGC RESOLUTE','lat':24.13,'lon':-81.12,'speed':12.4,'heading':205,'ship_type':'LAW ENFORCEMENT','flag':'US','source':'demo AIS'},
        {'mmsi':'775991000','name':'CARIBE FUEL','lat':22.95,'lon':-83.04,'speed':8.2,'heading':86,'ship_type':'OIL TANKER','flag':'VE','source':'demo AIS'},
        {'mmsi':'323456789','name':'MARIEL TRADER','lat':23.00,'lon':-82.76,'speed':3.1,'heading':15,'ship_type':'CARGO','flag':'PA','source':'demo AIS'},
    ]

def news() -> list[dict]:
    return [
        {'url':'https://example.invalid/cuba-energy-demo','title':'Cuba reports new apagones after thermoelectric plant outage','source':'Demo RSS','published':_now(-18),'summary':'Energy shortages and blackout reports increased across western provinces.'},
        {'url':'https://example.invalid/cuba-migration-demo','title':'USCG intercepts migrants near Florida Straits','source':'Demo RSS','published':_now(-44),'summary':'Coast Guard crews reported a migration-related rescue operation.'},
        {'url':'https://example.invalid/cuba-internet-demo','title':'ETECSA users report intermittent internet connectivity','source':'Demo RSS','published':_now(-65),'summary':'Public complaints described intermittent connectivity in Havana.'},
        {'url':'https://example.invalid/cuba-food-demo','title':'Food shortage concerns remain in eastern Cuba','source':'Demo RSS','published':_now(-90),'summary':'Residents described rationing pressure and supply constraints.'},
    ]

def weather() -> dict:
    return {'temperature':29.4,'apparent_temperature':34.1,'humidity':78,'wind_speed':18.2,'wind_direction':82,'precipitation':0.0,'weather_code':2,'description':'Partly cloudy','source':'demo Open-Meteo'}

def energy() -> dict:
    return {'status':'ELEVATED','level':'yellow','outage_reports':4,'source':'Demo RSS Analysis','notes':'Demo mode: outage-related Spanish/English keywords detected in recent articles.'}

def ioda() -> dict:
    return {'asn':'27725','entity':'ETECSA','status':'NORMAL','level':'green','source':'Demo IODA','notes':'Demo mode: no large connectivity drop detected.','signals':[{'datasource':'bgp','label':'BGP visibility','current':91,'drop_percent':0,'values':[88,89,90,90,91,91,92,91,91]},{'datasource':'ping-slash24','label':'Ping /24','current':63,'drop_percent':2,'values':[60,61,62,63,63,62,63]}]}

def seismic() -> list[dict]:
    return [{'event_id':'demo-quake-1','title':'M 3.7 - 23 km S of Santiago de Cuba','lat':19.74,'lon':-75.82,'magnitude':3.7,'depth_km':14.2,'place':'23 km S of Santiago de Cuba','event_time':_now(-120),'url':'https://earthquake.usgs.gov/','source':'demo USGS'}]

def movements() -> list[dict]:
    return [
        {'type':'USCG_ACTIVITY','description':'Demo: USCG vessel and aircraft activity in Florida Straits.','lat':24.13,'lon':-81.12,'timestamp':_now(-15),'confidence':'medium'},
        {'type':'MIL_AIRLIFT','description':'Demo: military-pattern callsign RCH421 detected near Key West corridor.','lat':24.55,'lon':-81.72,'timestamp':_now(-8),'confidence':'medium'},
    ]

def seed(db):
    db.upsert_flights(flights())
    db.upsert_ships(ships())
    db.upsert_news(news())
    db.upsert_weather(weather())
    db.upsert_energy(energy())
    db.replace_seismic_events(seismic())
    db.upsert_ioda_connectivity(ioda())
    db.replace_troop_movements(movements())
    health = [
        ('flights','ADS-B flights','ok','demo ADS-B',4),('ships','Maritime AIS','ok','demo AIS',3),
        ('news','News RSS','ok','demo RSS feeds',4),('weather','Havana weather','ok','demo Open-Meteo',1),
        ('energy','Energy proxy','ok','demo RSS Analysis',4),('ioda','Connectivity','ok','demo IODA',2),
        ('seismic','USGS seismic','ok','demo USGS',1),('military','Derived movement alerts','ok','local rules',2),
    ]
    for key,label,status,src,count in health:
        db.record_source_health(key,label,status,active_source=src,count=count)
