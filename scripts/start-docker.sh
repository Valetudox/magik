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

# Pull latest images from registry
echo "→ Pulling latest images from registry: $DOCKER_REGISTRY"
docker pull "$DOCKER_REGISTRY/magik-backend-socket:latest" || echo "⚠ Failed to pull backend-socket, will use local image"
docker pull "$DOCKER_REGISTRY/magik-backend-decision:latest" || echo "⚠ Failed to pull backend-decision, will use local image"
docker pull "$DOCKER_REGISTRY/magik-backend-audio:latest" || echo "⚠ Failed to pull backend-audio, will use local image"
docker pull "$DOCKER_REGISTRY/magik-ui-decision:latest" || echo "⚠ Failed to pull ui-decision, will use local image"
docker pull "$DOCKER_REGISTRY/magik-ui-audio:latest" || echo "⚠ Failed to pull ui-audio, will use local image"
docker pull "$DOCKER_REGISTRY/magik-gateway:latest" || echo "⚠ Failed to pull gateway, will use local image"

# Start services
echo "→ Starting services..."
docker compose -f docker-compose.prod.yml up -d

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
