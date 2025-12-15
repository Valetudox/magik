#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Set default registry if not specified
DOCKER_REGISTRY="${DOCKER_REGISTRY:-localhost:5000}"

echo "Building Docker images for Magik Decision Management System..."
echo "Registry: $DOCKER_REGISTRY"

# Build packages that workspace dependencies need
echo "→ Building workspace packages..."
# Build agents package if it has a build script
if [ -d "packages/agents" ] && [ -f "packages/agents/package.json" ]; then
    if jq -e '.scripts.build' packages/agents/package.json > /dev/null 2>&1; then
        cd packages/agents && bun run build && cd ../..
    else
        echo "  Skipping packages/agents (no build script)"
    fi
fi
# decisions and ui-shared don't need build steps

# Discover backend services from config.json
if [ ! -f "$PROJECT_ROOT/config/config.json" ]; then
    echo "❌ Error: config/config.json not found"
    echo "Backend services must be defined in config/config.json"
    exit 1
fi

BACKEND_SERVICES=()
while IFS= read -r service_key; do
    service_name=$(echo "$service_key" | sed 's/BACKEND_/backend-/' | tr '[:upper:]' '[:lower:]')
    BACKEND_SERVICES+=("$service_name")
done < <(jq -r '.services | keys[]' "$PROJECT_ROOT/config/config.json" | grep '^BACKEND_')

# Hardcoded UI and gateway services
UI_SERVICES=("ui-decision" "ui-audio")
GATEWAY_SERVICES=("gateway")

# Generate docker-compose dynamically to /tmp
echo "→ Generating docker-compose.prod.yml..."
COMPOSE_FILE=$(./scripts/generate-docker-compose.ts)
echo "   Using: $COMPOSE_FILE"

# Build Docker images
echo "→ Building Docker images..."
docker compose -f "$COMPOSE_FILE" build --no-cache

# Cleanup temp file
rm -f "$COMPOSE_FILE"

echo "✓ Docker images built successfully!"
echo ""
echo "Images tagged as:"
for service in "${BACKEND_SERVICES[@]}"; do
    echo "  - $DOCKER_REGISTRY/magik-$service:latest"
done
for service in "${UI_SERVICES[@]}"; do
    echo "  - $DOCKER_REGISTRY/magik-$service:latest"
done
for service in "${GATEWAY_SERVICES[@]}"; do
    echo "  - $DOCKER_REGISTRY/magik-$service:latest"
done
echo ""
echo "Next steps:"
echo "  1. Deploy to registry: bun run docker:deploy"
echo "  2. Start services: bun run docker:start"
