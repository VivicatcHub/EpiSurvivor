#!/bin/bash
docker compose run --rm api python -m app.seed --reset
docker-compose up --build
docker compose down -v --rmi all --remove-orphans
