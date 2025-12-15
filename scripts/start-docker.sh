#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Starting Magik Decision Management System..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Set default registry if not specified
DOCKER_REGISTRY="${DOCKER_REGISTRY:-localhost:5000}"

# Check if local registry is running, start it if not
if ! curl -s "http://$DOCKER_REGISTRY/v2/" > /dev/null 2>&1; then
    echo "→ Starting local Docker registry..."
    if docker ps -a --format '{{.Names}}' | grep -q '^registry$'; then
        docker start registry
    else
        docker run -d -p 5000:5000 --name registry --restart=always registry:2
    fi
    sleep 2
fi

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

# Pull latest images from registry
echo "→ Pulling latest images from registry: $DOCKER_REGISTRY"
for service in "${BACKEND_SERVICES[@]}"; do
    docker pull "$DOCKER_REGISTRY/magik-$service:latest" || echo "⚠ Failed to pull $service, will use local image"
done
for service in "${UI_SERVICES[@]}"; do
    docker pull "$DOCKER_REGISTRY/magik-$service:latest" || echo "⚠ Failed to pull $service, will use local image"
done
for service in "${GATEWAY_SERVICES[@]}"; do
    docker pull "$DOCKER_REGISTRY/magik-$service:latest" || echo "⚠ Failed to pull $service, will use local image"
done

# Generate docker-compose dynamically to /tmp
echo "→ Generating docker-compose.prod.yml..."
COMPOSE_FILE=$(./scripts/generate-docker-compose.ts)
echo "   Using: $COMPOSE_FILE"

# Start services
echo "→ Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

echo ""
echo "✓ Services started!"
echo ""
echo "Service URLs (via gateway):"
echo "  Gateway:           http://localhost"
echo "  Decision UI:       http://localhost/decisions"
echo "  Audio UI:          http://localhost/audio"
echo "  Decision API:      http://localhost/api/decisions"
echo "  Audio API:         http://localhost/api/recordings"
echo "  Gateway Health:    http://localhost/health"
echo ""
echo "View logs:"
echo "  bun run docker:logs"
echo ""
echo "Check status:"
echo "  bun run docker:ps"
