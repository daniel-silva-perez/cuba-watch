from src import demo_data


def test_demo_data_has_core_feeds():
    assert demo_data.flights()
    assert demo_data.ships()
    assert demo_data.news()
    assert demo_data.energy()["level"] in {"green", "yellow", "red"}
