from src.intelligence import compute_risk_score, generate_briefing, tag_text


def test_tag_text_detects_spanish_energy_terms():
    assert "energy" in tag_text("nuevo apagón por termoeléctrica fuera de servicio")


def test_risk_score_elevates_energy_and_news():
    risk = compute_risk_score(
        flights=[],
        ships=[],
        news=[{"title": "apagón and protest reports in Havana", "summary": "internet connectivity affected"}],
        energy={"data": {"level": "yellow", "outage_reports": 4}},
        ioda={"data": {"level": "green"}},
        seismic=[],
        movements=[],
        sources=[{"status": "ok"}],
    )
    assert risk["score"] >= 25
    assert risk["level"] in {"WATCH", "ELEVATED", "CRITICAL"}


def test_generate_briefing_shape():
    briefing = generate_briefing(
        flights=[{"icao": "abc"}], ships=[], news=[], energy=None, ioda=None, seismic=[], movements=[], sources=[]
    )
    assert "summary" in briefing
    assert "risk" in briefing
    assert briefing["counts"]["flights"] == 1
