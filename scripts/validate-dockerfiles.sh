#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Validating Dockerfiles..."

VALIDATION_ERRORS=0

# Function to validate UI Dockerfile
validate_ui_dockerfile() {
    local dockerfile=$1
    local ui_name=$(basename $(dirname "$dockerfile"))
    local ui_key=$(echo "$ui_name" | sed 's/ui-/UI_/' | tr '[:lower:]' '[:upper:]')

    echo -n "Validating $dockerfile... "

    # Check if file exists
    if [ ! -f "$dockerfile" ]; then
        echo -e "${RED}MISSING${NC}"
        ((VALIDATION_ERRORS++))
        return
    fi

    # Read UI config
    local config_port=$(jq -r ".uis.${ui_key}.port // 80" "$PROJECT_ROOT/config/config.json")

    # Validation 1: Two-stage pattern (builder + runtime)
    if ! grep -q "FROM oven/bun.*AS builder" "$dockerfile"; then
        echo -e "${RED}FAIL${NC}: Missing builder stage (FROM oven/bun AS builder)"
        ((VALIDATION_ERRORS++))
        return
    fi

    if ! grep -q "FROM nginx:alpine" "$dockerfile"; then
        echo -e "${RED}FAIL${NC}: Missing runtime stage (FROM nginx:alpine)"
        ((VALIDATION_ERRORS++))
        return
    fi

    # Validation 2: Health check presence
    if ! grep -q "HEALTHCHECK" "$dockerfile"; then
        echo -e "${RED}FAIL${NC}: Missing HEALTHCHECK instruction"
        ((VALIDATION_ERRORS++))
        return
    fi

    # Validation 3: Port consistency
    local exposed_port=$(grep "^EXPOSE" "$dockerfile" | awk '{print $2}')
    if [ "$exposed_port" != "$config_port" ]; then
        echo -e "${RED}FAIL${NC}: Port mismatch (Dockerfile: $exposed_port, Config: $config_port)"
        ((VALIDATION_ERRORS++))
        return
    fi

    # Validation 4: Nginx configuration copy
    if ! grep -q "COPY.*nginx.conf" "$dockerfile"; then
        echo -e "${YELLOW}WARN${NC}: No nginx.conf copy found"
    fi

    # Validation 5: Vite build with base path
    if ! grep -q "VITE_BASE_PATH=" "$dockerfile"; then
        echo -e "${YELLOW}WARN${NC}: No VITE_BASE_PATH set during build"
    fi

    echo -e "${GREEN}PASS${NC}"
}

# Function to validate backend Dockerfile
validate_backend_dockerfile() {
    local dockerfile=$1
    local backend_name=$(basename $(dirname "$dockerfile"))
    local backend_key=$(echo "$backend_name" | sed 's/backend-/BACKEND_/' | tr '[:lower:]' '[:upper:]')

    echo -n "Validating $dockerfile... "

    # Check if file exists
    if [ ! -f "$dockerfile" ]; then
        echo -e "${RED}MISSING${NC}"
        ((VALIDATION_ERRORS++))
        return
    fi

    # Read backend config
    local config_port=$(jq -r ".services.${backend_key}.prod" "$PROJECT_ROOT/config/config.json")

    # Validation 1: Two-stage pattern (builder + runtime)
    if ! grep -q "FROM oven/bun.*AS builder" "$dockerfile"; then
        echo -e "${RED}FAIL${NC}: Missing builder stage"
        ((VALIDATION_ERRORS++))
        return
    fi

    if ! grep "FROM oven/bun" "$dockerfile" | tail -1 | grep -q "FROM oven/bun"; then
        echo -e "${YELLOW}WARN${NC}: Runtime stage might not use oven/bun"
    fi

    # Validation 2: Health check presence
    if ! grep -q "HEALTHCHECK" "$dockerfile"; then
        echo -e "${RED}FAIL${NC}: Missing HEALTHCHECK instruction"
        ((VALIDATION_ERRORS++))
        return
    fi

    # Validation 3: Port consistency
    local exposed_port=$(grep "^EXPOSE" "$dockerfile" | awk '{print $2}')
    if [ "$exposed_port" != "$config_port" ]; then
        echo -e "${RED}FAIL${NC}: Port mismatch (Dockerfile: $exposed_port, Config: $config_port)"
        ((VALIDATION_ERRORS++))
        return
    fi

    # Validation 4: curl installed (for health checks)
    if ! grep -q "apt-get install.*curl" "$dockerfile"; then
        echo -e "${YELLOW}WARN${NC}: curl not explicitly installed for health checks"
    fi

    echo -e "${GREEN}PASS${NC}"
}

# Validate all UI Dockerfiles
echo ""
echo "=== Validating UI Dockerfiles ==="
for dockerfile in apps/ui-*/Dockerfile; do
    if [ -f "$dockerfile" ]; then
        validate_ui_dockerfile "$dockerfile"
    fi
done

# Validate all backend Dockerfiles
echo ""
echo "=== Validating Backend Dockerfiles ==="
for dockerfile in apps/backend-*/Dockerfile; do
    if [ -f "$dockerfile" ]; then
        validate_backend_dockerfile "$dockerfile"
    fi
done

echo ""
if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All Dockerfiles passed validation${NC}"
    exit 0
else
    echo -e "${RED}✗ $VALIDATION_ERRORS validation error(s) found${NC}"
    exit 1
fi
