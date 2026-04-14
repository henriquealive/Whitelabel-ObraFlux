#!/usr/bin/env bash
# Run Prisma migrations — safe to run multiple times (idempotent)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$ROOT_DIR"

echo "▶  Running database migrations..."
pnpm --filter @obraflux/database exec prisma migrate deploy

echo "✓  Migrations applied successfully."
