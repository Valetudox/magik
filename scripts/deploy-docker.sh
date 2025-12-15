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

# Discover backend services from config.json
if [ ! -f "$PROJECT_ROOT/config/config.json" ]; then
    echo "❌ Error: config/config.json not found"
    echo "Backend services must be defined in config/config.json"
    exit 1
fi

BACKEND_SERVICES=()
# Extract service names from config.json, convert BACKEND_* to backend-*
while IFS= read -r service_key; do
    # Convert BACKEND_AUDIO to backend-audio
    service_name=$(echo "$service_key" | sed 's/BACKEND_/backend-/' | tr '[:upper:]' '[:lower:]')
    BACKEND_SERVICES+=("$service_name")
done < <(jq -r '.services | keys[]' "$PROJECT_ROOT/config/config.json" | grep '^BACKEND_')

# Hardcoded UI and gateway services
UI_SERVICES=("ui-decision" "ui-audio")
GATEWAY_SERVICES=("gateway")

# Push images to registry
echo "→ Pushing backend images to registry..."
for service in "${BACKEND_SERVICES[@]}"; do
    echo "  Pushing magik-$service:latest..."
    docker push "$DOCKER_REGISTRY/magik-$service:latest"
done

echo ""
echo "→ Pushing UI images to registry..."
for service in "${UI_SERVICES[@]}"; do
    echo "  Pushing magik-$service:latest..."
    docker push "$DOCKER_REGISTRY/magik-$service:latest"
done

echo ""
echo "→ Pushing gateway image to registry..."
for service in "${GATEWAY_SERVICES[@]}"; do
    echo "  Pushing magik-$service:latest..."
    docker push "$DOCKER_REGISTRY/magik-$service:latest"
done

echo ""
echo "✓ Images deployed successfully!"
echo ""
echo "Deployed images:"
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
echo "  1. Start services: bun run docker:start"
echo "  2. Or install systemd service: bun run systemd:install"
