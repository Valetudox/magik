#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🔄 Refreshing Magik Decision Management System..."
echo ""

# Step 1: Build images
echo "Step 1/3: Building Docker images..."
./scripts/build-docker.sh

echo ""

# Step 2: Deploy to registry
echo "Step 2/3: Deploying to registry..."
./scripts/deploy-docker.sh

echo ""

# Step 3: Restart services with latest images
echo "Step 3/3: Restarting services..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Set default registry if not specified
DOCKER_REGISTRY="${DOCKER_REGISTRY:-localhost:5000}"

# Pull latest images
echo "→ Pulling latest images from registry: $DOCKER_REGISTRY"
docker pull "$DOCKER_REGISTRY/magik-backend-socket:latest"
docker pull "$DOCKER_REGISTRY/magik-backend-decision:latest"
docker pull "$DOCKER_REGISTRY/magik-ui-decision:latest"

# Force recreate all containers with latest images
echo "→ Recreating containers..."
docker compose -f docker-compose.prod.yml up -d --force-recreate

echo ""
echo "✓ Refresh complete!"
echo ""
echo "Service URLs:"
echo "  UI:                http://localhost"
echo "  Backend API:       http://localhost:3000"
echo "  WebSocket Server:  http://localhost:3001"
echo ""
echo "View logs:"
echo "  bun run docker:logs"
echo ""
echo "Check status:"
echo "  bun run docker:ps"
