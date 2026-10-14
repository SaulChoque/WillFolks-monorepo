#!/usr/bin/env bash
# Borra el volumen y recrea la base desde sql/ (esquema + vistas + semilla).
set -euo pipefail
cd "$(dirname "$0")/.."

docker compose down --volumes
docker compose up --detach --wait
echo "Base recreada. Tablas:"
docker compose exec -T postgres psql -U "${WF_DB_USER:-willfolks}" -d "${WF_DB_NAME:-willfolks}" -c '\dt'
