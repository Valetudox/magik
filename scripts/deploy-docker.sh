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

echo "Deploying Magik Docker images to registry: $DOCKER_REGISTRY"
echo ""

# Check if local registry is running
if ! curl -s "http://$DOCKER_REGISTRY/v2/" > /dev/null 2>&1; then
    echo "⚠ Warning: Local Docker registry at $DOCKER_REGISTRY does not appear to be running."
    echo ""
    echo "To start a local registry, run:"
    echo "  docker run -d -p 5000:5000 --name registry --restart=always registry:2"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Push images to registry
echo "→ Pushing images to registry..."
docker push "$DOCKER_REGISTRY/magik-backend-socket:latest"
docker push "$DOCKER_REGISTRY/magik-backend-decision:latest"
docker push "$DOCKER_REGISTRY/magik-backend-audio:latest"
docker push "$DOCKER_REGISTRY/magik-ui-decision:latest"
docker push "$DOCKER_REGISTRY/magik-ui-audio:latest"
docker push "$DOCKER_REGISTRY/magik-gateway:latest"

echo ""
echo "✓ Images deployed successfully!"
echo ""
echo "Deployed images:"
echo "  - $DOCKER_REGISTRY/magik-backend-socket:latest"
echo "  - $DOCKER_REGISTRY/magik-backend-decision:latest"
echo "  - $DOCKER_REGISTRY/magik-backend-audio:latest"
echo "  - $DOCKER_REGISTRY/magik-ui-decision:latest"
echo "  - $DOCKER_REGISTRY/magik-ui-audio:latest"
echo "  - $DOCKER_REGISTRY/magik-gateway:latest"
echo ""
echo "Next steps:"
echo "  1. Start services: bun run docker:start"
echo "  2. Or install systemd service: bun run systemd:install"
