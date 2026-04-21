#!/usr/bin/env bash
set -euo pipefail

echo "[mock-up] Subindo ambiente local com mock server..."
docker compose up -d db mock-server app

echo "[mock-up] Ambiente iniciado."
echo "[mock-up] App:        http://localhost:3000"
echo "[mock-up] Mock server: http://localhost:3334"