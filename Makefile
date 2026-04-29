.PHONY: install dev demo test lint format clean docker setup run

PYTHON ?= python3
PIP ?= pip3
PORT ?= 8080

setup install:
	$(PYTHON) -m venv .venv
	. .venv/bin/activate && pip install -r requirements.txt

dev:
	. .venv/bin/activate 2>/dev/null && uvicorn main:app --reload --host 0.0.0.0 --port $(PORT) || uvicorn main:app --reload --host 0.0.0.0 --port $(PORT)

run:
	CUBA_WATCH_DEMO_MODE=true $(PYTHON) main.py

demo:
	CUBA_WATCH_DEMO_MODE=true $(PYTHON) main.py

test:
	pytest -q

lint:
	ruff check .

format:
	ruff format .

clean:
	rm -rf __pycache__ src/__pycache__ src/scrapers/__pycache__ .pytest_cache .ruff_cache cuba_monitor.db

docker:
	docker compose up --build
