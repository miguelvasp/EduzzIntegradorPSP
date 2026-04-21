#!/usr/bin/env bash
set -euo pipefail

echo "[mock-down] Derrubando ambiente local com mock server..."
docker compose down

echo "[mock-down] Ambiente encerrado."