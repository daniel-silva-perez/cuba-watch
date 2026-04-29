from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

KEYWORD_GROUPS: dict[str, list[str]] = {
    "protest": ["protest", "protesta", "manifestación", "manifestacion", "demonstration", "unrest", "march", "marcha"],
    "energy": ["apagón", "apagon", "blackout", "power outage", "electricidad", "termoeléctrica", "termoelectrica", "grid"],
    "repression": ["detenido", "detenidos", "arrest", "arrestado", "policía", "policia", "represión", "repression"],
    "migration": ["balsero", "balseros", "migrant", "migrants", "coast guard", "uscg", "rafters"],
    "food": ["escasez", "shortage", "alimentos", "food", "rationing", "racionamiento"],
    "internet": ["etecsa", "internet", "apagón digital", "apagon digital", "connectivity", "conectividad"],
    "security": ["military", "militar", "base", "troops", "naval", "air force", "guardia costera"],
}

LEVELS = [(75, "CRITICAL", "red"), (50, "ELEVATED", "red"), (25, "WATCH", "yellow"), (0, "NORMAL", "green")]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def tag_text(text: str) -> list[str]:
    lowered = (text or "").lower()
    return [tag for tag, kws in KEYWORD_GROUPS.items() if any(k in lowered for k in kws)]


def score_level(score: int) -> dict[str, Any]:
    score = max(0, min(100, int(score)))
    for threshold, label, color in LEVELS:
        if score >= threshold:
            return {"score": score, "level": label, "color": color}
    return {"score": score, "level": "UNKNOWN", "color": "grey"}


def compute_risk_score(*, flights: list[dict], ships: list[dict], news: list[dict], energy: dict | None, ioda: dict | None, seismic: list[dict], movements: list[dict], sources: list[dict]) -> dict[str, Any]:
    score = 0
    drivers: list[dict[str, Any]] = []
    energy_data = (energy or {}).get("data") if energy else None
    if energy_data:
        level = energy_data.get("level")
        reports = int(energy_data.get("outage_reports") or 0)
        if level == "red":
            score += 30; drivers.append({"label": "Energy proxy red", "impact": 30, "detail": f"{reports} outage-related reports"})
        elif level == "yellow":
            score += 18; drivers.append({"label": "Energy proxy elevated", "impact": 18, "detail": f"{reports} outage-related reports"})
        elif reports >= 3:
            score += 8; drivers.append({"label": "Energy mentions present", "impact": 8, "detail": f"{reports} reports"})

    ioda_data = (ioda or {}).get("data") if ioda else None
    if ioda_data:
        if ioda_data.get("level") == "red":
            score += 30; drivers.append({"label": "Connectivity anomaly", "impact": 30, "detail": ioda_data.get("notes", "IODA status abnormal")})
        elif ioda_data.get("level") == "yellow":
            score += 15; drivers.append({"label": "Connectivity watch", "impact": 15, "detail": ioda_data.get("notes", "IODA status watch")})

    if movements:
        impact = min(25, 8 + len(movements) * 4)
        score += impact; drivers.append({"label": "Movement indicators", "impact": impact, "detail": f"{len(movements)} derived alerts"})

    tag_counts: dict[str, int] = {}
    tagged_articles = []
    for article in news[:50]:
        tags = tag_text(f"{article.get('title', '')} {article.get('summary', '')}")
        if tags:
            tagged_articles.append({"title": article.get("title"), "tags": tags, "source": article.get("source"), "url": article.get("url")})
        for tag in tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    news_impact = min(20, sum(min(6, count * 3) for count in tag_counts.values()))
    if news_impact:
        score += news_impact; drivers.append({"label": "Sensitive news keywords", "impact": news_impact, "detail": ", ".join(f"{k}:{v}" for k, v in sorted(tag_counts.items()))})

    max_mag = max([float(e.get("magnitude") or 0) for e in seismic] or [0])
    if max_mag >= 5:
        score += 15; drivers.append({"label": "Significant seismic activity", "impact": 15, "detail": f"M{max_mag:.1f} event"})
    elif max_mag >= 3.5:
        score += 7; drivers.append({"label": "Moderate seismic activity", "impact": 7, "detail": f"M{max_mag:.1f} event"})

    failed_sources = [s for s in sources if s.get("status") == "error"]
    if failed_sources:
        impact = min(10, len(failed_sources) * 3)
        score += impact; drivers.append({"label": "Source degradation", "impact": impact, "detail": f"{len(failed_sources)} source(s) reporting errors"})

    result = score_level(score)
    result.update({"drivers": drivers, "tag_counts": tag_counts, "tagged_articles": tagged_articles[:12], "generated_at": utc_now()})
    return result


def build_events(*, flights: list[dict], ships: list[dict], news: list[dict], energy: dict | None, ioda: dict | None, seismic: list[dict], movements: list[dict]) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    now = utc_now()
    energy_data = (energy or {}).get("data") if energy else None
    if energy_data:
        level = energy_data.get("level", "grey")
        events.append({"category": "energy", "title": f"Energy proxy: {energy_data.get('status', 'UNKNOWN')}", "description": energy_data.get("notes") or f"{energy_data.get('outage_reports', 0)} outage-related reports detected.", "severity": "high" if level == "red" else "medium" if level == "yellow" else "low", "source": energy_data.get("source", "RSS News Analysis"), "source_url": None, "observed_at": energy.get("fetched_at") or now, "lat": 21.5218, "lon": -77.7812})
    ioda_data = (ioda or {}).get("data") if ioda else None
    if ioda_data:
        level = ioda_data.get("level", "grey")
        events.append({"category": "connectivity", "title": f"Connectivity: {ioda_data.get('status', 'UNKNOWN')}", "description": ioda_data.get("notes") or "IODA signal snapshot for ETECSA ASN 27725.", "severity": "high" if level == "red" else "medium" if level == "yellow" else "low", "source": ioda_data.get("source", "IODA"), "source_url": "https://ioda.inetintel.cc.gatech.edu/", "observed_at": ioda.get("fetched_at") or now, "lat": 21.5218, "lon": -77.7812})
    for mv in movements[:25]:
        events.append({"category": "movement", "title": mv.get("type") or "Movement indicator", "description": mv.get("description") or "Derived movement indicator.", "severity": "medium" if mv.get("confidence") in {"medium", "high"} else "low", "source": "local rules", "source_url": mv.get("source_url"), "observed_at": mv.get("timestamp") or now, "lat": mv.get("lat"), "lon": mv.get("lon")})
    for ev in seismic[:10]:
        mag = float(ev.get("magnitude") or 0)
        events.append({"category": "seismic", "title": ev.get("title") or f"M{mag:.1f} earthquake", "description": ev.get("place") or "USGS event near Cuba.", "severity": "high" if mag >= 5 else "medium" if mag >= 3.5 else "low", "source": ev.get("source", "USGS"), "source_url": ev.get("url"), "observed_at": ev.get("event_time") or ev.get("fetched_at") or now, "lat": ev.get("lat"), "lon": ev.get("lon")})
    for article in news[:30]:
        tags = tag_text(f"{article.get('title', '')} {article.get('summary', '')}")
        if tags:
            severity = "medium" if any(t in {"protest", "repression", "energy", "internet"} for t in tags) else "low"
            events.append({"category": "news", "title": article.get("title") or "Cuba news signal", "description": "Tags: " + ", ".join(tags), "severity": severity, "source": article.get("source", "RSS"), "source_url": article.get("url"), "observed_at": article.get("published") or article.get("fetched_at") or now, "lat": None, "lon": None})
    rank = {"high": 0, "medium": 1, "low": 2}
    return sorted(events, key=lambda e: (rank.get(e.get("severity"), 3), e.get("observed_at") or ""), reverse=False)[:100]


def generate_briefing(*, flights: list[dict], ships: list[dict], news: list[dict], energy: dict | None, ioda: dict | None, seismic: list[dict], movements: list[dict], sources: list[dict]) -> dict[str, Any]:
    risk = compute_risk_score(flights=flights, ships=ships, news=news, energy=energy, ioda=ioda, seismic=seismic, movements=movements, sources=sources)
    events = build_events(flights=flights, ships=ships, news=news, energy=energy, ioda=ioda, seismic=seismic, movements=movements)
    healthy = len([s for s in sources if s.get("status") == "ok"])
    failed = len([s for s in sources if s.get("status") == "error"])
    energy_status = ((energy or {}).get("data") or {}).get("status", "UNKNOWN")
    ioda_status = ((ioda or {}).get("data") or {}).get("status", "UNKNOWN")
    max_mag = max([float(e.get("magnitude") or 0) for e in seismic] or [0])
    summary = []
    if risk["level"] in {"ELEVATED", "CRITICAL"}:
        summary.append(f"Situation is {risk['level'].lower()} based on correlated public-source signals.")
    elif risk["level"] == "WATCH":
        summary.append("Situation is in watch status; at least one monitored signal deserves review.")
    else:
        summary.append("Situation appears operationally stable across monitored public feeds.")
    summary.append(f"{len(flights)} aircraft and {len(ships)} maritime contacts are visible in the monitored region.")
    summary.append(f"Connectivity is {ioda_status}; energy proxy is {energy_status}.")
    summary.append(f"Source health: {healthy} OK, {failed} degraded.")
    confidence = "High" if healthy >= 5 and failed == 0 else "Medium" if healthy >= 3 else "Low"
    if any("fallback" in (s.get("active_source") or "").lower() for s in sources) and confidence == "High":
        confidence = "Medium"
    return {"generated_at": utc_now(), "summary": " ".join(summary), "confidence": confidence, "risk": risk, "counts": {"flights": len(flights), "ships": len(ships), "news": len(news), "events": len(events), "movements": len(movements), "seismic": len(seismic), "sources_ok": healthy, "sources_failed": failed, "max_seismic_magnitude": max_mag}, "key_events": events[:8], "source_health": sources}


def briefing_to_markdown(briefing: dict[str, Any]) -> str:
    risk = briefing.get("risk", {})
    lines = ["# Cuba Watch Situation Brief", "", f"Generated: {briefing.get('generated_at', utc_now())}", f"Risk: {risk.get('level', 'UNKNOWN')} ({risk.get('score', 0)}/100)", f"Confidence: {briefing.get('confidence', 'Unknown')}", "", "## Summary", briefing.get("summary", "No summary available."), "", "## Key Drivers"]
    drivers = risk.get("drivers") or []
    lines.extend([f"- +{d.get('impact', 0)} {d.get('label', 'Signal')}: {d.get('detail', '')}" for d in drivers] or ["- No elevated drivers detected."])
    lines += ["", "## Notable Events"]
    lines.extend([f"- [{e.get('severity', 'low').upper()}] {e.get('category', 'event')}: {e.get('title', '')} — {e.get('description', '')}" for e in briefing.get("key_events", [])])
    lines += ["", "## Source Health"]
    lines.extend([f"- {s.get('label', s.get('key'))}: {s.get('status')} via {s.get('active_source') or 'unknown'}; last success {s.get('last_success') or 'never'}" for s in briefing.get("source_health", [])])
    return "\n".join(lines) + "\n"


# ── Sherlock-inspired product modules ─────────────────────────────────────────

def _signal_counts(news: list[dict]) -> dict[str, int]:
    counts = {k: 0 for k in KEYWORD_GROUPS}
    for article in news:
        tags = tag_text(f"{article.get('title','')} {article.get('summary','')}")
        for tag in tags:
            counts[tag] = counts.get(tag, 0) + 1
    return counts


def generate_signal_radar(*, news: list[dict], energy: dict | None, ioda: dict | None, movements: list[dict], seismic: list[dict], ships: list[dict], flights: list[dict]) -> dict[str, Any]:
    """Trend Radar adapted from Sherlock: rank Cuba signals by public-source momentum."""
    counts = _signal_counts(news)
    energy_data = (energy or {}).get("data") if energy else {}
    ioda_data = (ioda or {}).get("data") if ioda else {}
    max_mag = max([float(e.get("magnitude") or 0) for e in seismic] or [0])
    radar = [
        {"key":"energy", "label":"Energy Stress", "score": min(100, counts.get("energy",0)*18 + int(energy_data.get("outage_reports") or 0)*8 + (18 if energy_data.get("level")=="yellow" else 35 if energy_data.get("level")=="red" else 0)), "direction":"rising" if counts.get("energy",0) >= 2 else "stable", "detail": f"{counts.get('energy',0)} tagged articles; {energy_data.get('outage_reports',0)} outage reports"},
        {"key":"migration", "label":"Migration Pressure", "score": min(100, counts.get("migration",0)*22 + len([s for s in ships if 'USCG' in str(s.get('name','')).upper()])*12), "direction":"rising" if counts.get("migration",0) else "stable", "detail": f"{counts.get('migration',0)} migration news signals"},
        {"key":"internet", "label":"Internet / Connectivity", "score": min(100, counts.get("internet",0)*18 + (35 if ioda_data.get("level")=="red" else 18 if ioda_data.get("level")=="yellow" else 0)), "direction":"rising" if ioda_data.get("level") in {"yellow","red"} else "stable", "detail": f"IODA: {ioda_data.get('status','UNKNOWN')}"},
        {"key":"civil", "label":"Civil Unrest / Repression", "score": min(100, counts.get("protest",0)*25 + counts.get("repression",0)*20), "direction":"rising" if counts.get("protest",0)+counts.get("repression",0) else "stable", "detail": f"{counts.get('protest',0)} protest; {counts.get('repression',0)} repression signals"},
        {"key":"food", "label":"Food / Supply Pressure", "score": min(100, counts.get("food",0)*22), "direction":"rising" if counts.get("food",0) else "stable", "detail": f"{counts.get('food',0)} food/supply signals"},
        {"key":"movement", "label":"Movement Indicators", "score": min(100, len(movements)*20 + len(flights)//2 + len(ships)*2), "direction":"rising" if movements else "stable", "detail": f"{len(movements)} derived alerts; {len(flights)} aircraft; {len(ships)} vessels"},
        {"key":"seismic", "label":"Seismic / Disaster", "score": min(100, int(max_mag*12)), "direction":"rising" if max_mag >= 3.5 else "stable", "detail": f"Max magnitude M{max_mag:.1f}"},
    ]
    radar.sort(key=lambda r: r["score"], reverse=True)
    return {"generated_at": utc_now(), "signals": radar, "topic_counts": counts}


def generate_watch_mode(*, briefing: dict[str, Any], energy: dict | None, ioda: dict | None, movements: list[dict], sources: list[dict]) -> dict[str, Any]:
    risk = briefing.get("risk", {})
    energy_data = (energy or {}).get("data") if energy else {}
    ioda_data = (ioda or {}).get("data") if ioda else {}
    failed = [s for s in sources if s.get("status") == "error"]
    conditions = [
        {"key":"risk-threshold", "label":"Situation risk above WATCH", "active": int(risk.get("score") or 0) >= 25, "severity": risk.get("level", "NORMAL"), "detail": f"Risk score {risk.get('score', 0)}/100"},
        {"key":"internet-disruption", "label":"Internet disruption detected", "active": ioda_data.get("level") in {"yellow", "red"}, "severity": ioda_data.get("status", "NORMAL"), "detail": ioda_data.get("notes", "No IODA anomaly detected")},
        {"key":"energy-spike", "label":"Energy outage spike detected", "active": energy_data.get("level") in {"yellow", "red"} or int(energy_data.get("outage_reports") or 0) >= 3, "severity": energy_data.get("status", "NORMAL"), "detail": energy_data.get("notes", "No energy spike detected")},
        {"key":"movement-alert", "label":"Military/coast guard movement indicator", "active": len(movements) > 0, "severity": "WATCH" if movements else "NORMAL", "detail": f"{len(movements)} derived movement alerts"},
        {"key":"source-degradation", "label":"Source degradation", "active": bool(failed), "severity": "WATCH" if failed else "NORMAL", "detail": f"{len(failed)} provider(s) reporting errors"},
    ]
    active = [c for c in conditions if c["active"]]
    return {"generated_at": utc_now(), "status": "ACTIVE", "scan_interval_minutes": 15, "minimum_alert_level": "WATCH", "active_count": len(active), "conditions": conditions}


def generate_discoveries(*, briefing: dict[str, Any], radar: dict[str, Any], events: list[dict], sources: list[dict]) -> dict[str, Any]:
    discoveries: list[dict[str, Any]] = []
    for signal in radar.get("signals", [])[:4]:
        if signal.get("score", 0) >= 35:
            discoveries.append({"severity":"high" if signal["score"] >= 60 else "medium", "title": f"{signal['label']} deserves review", "description": signal.get("detail", ""), "type":"signal-radar"})
    for ev in events[:6]:
        if ev.get("severity") in {"high", "medium"}:
            discoveries.append({"severity": ev.get("severity"), "title": ev.get("title", "Event signal"), "description": ev.get("description", ""), "type": ev.get("category", "event")})
    for src in sources:
        if src.get("status") == "error":
            discoveries.append({"severity":"medium", "title": f"Provider degraded: {src.get('label') or src.get('key')}", "description": src.get("last_error") or "Provider health reported error", "type":"provider"})
    if not discoveries:
        discoveries.append({"severity":"low", "title":"No major new discoveries", "description":"Monitored public signals are stable in the current snapshot.", "type":"baseline"})
    return {"generated_at": utc_now(), "discoveries": discoveries[:12]}


def generate_provider_settings(sources: list[dict]) -> dict[str, Any]:
    defaults = {
        "flights": ("ADS-B", 5, True), "ships": ("AIS / maritime", 10, True), "news": ("RSS News", 15, True),
        "weather": ("Open-Meteo", 15, False), "energy": ("RSS Energy Proxy", 15, True),
        "ioda": ("CAIDA IODA", 30, False), "seismic": ("USGS", 60, False), "military": ("Local derived rules", 5, False),
    }
    by_key = {s.get("key"): s for s in sources}
    providers = []
    for key, (label, refresh, fallback) in defaults.items():
        s = by_key.get(key, {})
        providers.append({"key": key, "label": s.get("label") or label, "enabled": True, "status": s.get("status", "unknown"), "active_source": s.get("active_source") or label, "refresh_interval_minutes": refresh, "fallback_allowed": fallback, "last_success": s.get("last_success"), "last_error": s.get("last_error")})
    return {"generated_at": utc_now(), "providers": providers}


def generate_audit_trail(*, briefing: dict[str, Any], sources: list[dict], events: list[dict]) -> dict[str, Any]:
    rows = [{"time": briefing.get("generated_at", utc_now()), "actor":"system", "action":"Risk score recalculated", "detail": f"{briefing.get('risk',{}).get('level','UNKNOWN')} {briefing.get('risk',{}).get('score',0)}/100"}]
    for src in sources[:8]:
        rows.append({"time": src.get("last_attempt") or utc_now(), "actor":"provider", "action": f"{src.get('label') or src.get('key')} health check", "detail": f"{src.get('status','unknown')} via {src.get('active_source') or 'unknown'}"})
    for ev in events[:5]:
        rows.append({"time": ev.get("observed_at") or utc_now(), "actor":"event-engine", "action": f"Normalized {ev.get('category','event')} event", "detail": ev.get("title", "Untitled")})
    return {"generated_at": utc_now(), "entries": rows[:20]}


def sitrep_to_markdown(*, briefing: dict[str, Any], radar: dict[str, Any], watch: dict[str, Any], discoveries: dict[str, Any]) -> str:
    risk = briefing.get("risk", {})
    lines = ["# Cuba Watch SITREP", "", f"Generated: {utc_now()}", f"Situation Level: {risk.get('level','UNKNOWN')} ({risk.get('score',0)}/100)", f"Confidence: {briefing.get('confidence','Unknown')}", "", "## Executive Summary", briefing.get("summary", "No summary available."), "", "## Signal Radar"]
    for s in radar.get("signals", [])[:8]:
        lines.append(f"- {s.get('label')}: {s.get('score')}/100 ({s.get('direction')}) — {s.get('detail')}")
    lines += ["", "## Watch Conditions"]
    for c in watch.get("conditions", []):
        marker = "TRIGGERED" if c.get("active") else "clear"
        lines.append(f"- {marker}: {c.get('label')} — {c.get('detail')}")
    lines += ["", "## Discovery Queue"]
    for d in discoveries.get("discoveries", []):
        lines.append(f"- [{d.get('severity','low').upper()}] {d.get('title')} — {d.get('description')}")
    lines += ["", "## Source Health"]
    for src in briefing.get("source_health", []):
        lines.append(f"- {src.get('label', src.get('key'))}: {src.get('status')} via {src.get('active_source') or 'unknown'}")
    return "\n".join(lines) + "\n"
