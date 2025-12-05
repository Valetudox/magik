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
# Build agents package (has TypeScript that needs compilation)
if [ -d "packages/agents" ]; then
    cd packages/agents && bun run build && cd ../..
fi
# decisions and ui-shared don't need build steps

# Build Docker images
echo "→ Building Docker images..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "✓ Docker images built successfully!"
echo ""
echo "Images tagged as:"
echo "  - $DOCKER_REGISTRY/magik-backend-socket:latest"
echo "  - $DOCKER_REGISTRY/magik-backend-decision:latest"
echo "  - $DOCKER_REGISTRY/magik-ui-decision:latest"
echo ""
echo "Next steps:"
echo "  1. Deploy to registry: bun run docker:deploy"
echo "  2. Start services: bun run docker:start"
