#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
python3 -m venv scripts/.venv-rembg
./scripts/.venv-rembg/bin/pip install -r scripts/requirements-rembg.txt
echo "rembg prêt : scripts/.venv-rembg"
