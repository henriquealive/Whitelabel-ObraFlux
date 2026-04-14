#!/usr/bin/env bash
# Seed the database with initial data. Only runs if SEED_DB=true.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$ROOT_DIR"

if [[ "${SEED_DB:-false}" != "true" ]]; then
  echo "ℹ  Skipping seed — set SEED_DB=true to enable."
  exit 0
fi

echo "▶  Seeding database..."
pnpm --filter @obraflux/database exec ts-node --project tsconfig.json -e "require('./src/seed').main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); })"

echo "✓  Seed complete."
