#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Stopping Magik Decision Management System..."

# Generate docker-compose dynamically to /tmp
echo "→ Generating docker-compose.prod.yml..."
COMPOSE_FILE=$(./scripts/generate-docker-compose.ts)
echo "   Using: $COMPOSE_FILE"

docker compose -f "$COMPOSE_FILE" down

# Cleanup temp file
rm -f "$COMPOSE_FILE"

echo "✓ Services stopped!"
