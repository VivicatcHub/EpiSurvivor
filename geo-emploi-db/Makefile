VENV := .venv
PY   := $(VENV)/bin/python
PIP  := $(VENV)/bin/pip
ALEMBIC := $(VENV)/bin/alembic

.PHONY: install up down psql migrate downgrade current history reset

install: $(VENV)

$(VENV): requirements.txt
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	touch $(VENV)

up:
	docker compose up -d --wait

down:
	docker compose down

psql:
	docker compose exec db psql -U $${POSTGRES_USER:-geo_emploi} -d $${POSTGRES_DB:-geo_emploi}

migrate: install
	$(ALEMBIC) upgrade head

downgrade: install
	$(ALEMBIC) downgrade -1

current: install
	$(ALEMBIC) current

history: install
	$(ALEMBIC) history --verbose

# Repart d'une base vide (supprime le volume).
reset:
	docker compose down -v
	$(MAKE) up
	$(MAKE) migrate
