#!/bin/bash

# Parallel Backend Linting - Alternative approach
# This version runs all lints (ESLint + validators) for each service in parallel

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Backend Services Linting (Parallel v2)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Discover all backend services
BACKEND_SERVICES=()
for dir in "$ROOT_DIR"/apps/backend-*; do
  if [[ -d "$dir" ]]; then
    BACKEND_SERVICES+=("$(basename "$dir")")
  fi
done

if [[ ${#BACKEND_SERVICES[@]} -eq 0 ]]; then
  echo -e "${RED}No backend services found${NC}"
  exit 1
fi

echo -e "${YELLOW}Found ${#BACKEND_SERVICES[@]} backend services: ${BACKEND_SERVICES[*]}${NC}"
echo ""

# Function to lint a single service (ESLint + validators)
lint_service() {
  local service="$1"
  local service_dir="apps/$service"

  # ESLint
  if ! (cd "$service_dir" && bun run lint); then
    return 1
  fi

  # Structure validation
  if ! "$SCRIPT_DIR/backend/validate-structure.sh" "$service"; then
    return 1
  fi

  # Route-action validation
  if ! "$SCRIPT_DIR/backend/validate-route-actions.sh" "$service"; then
    return 1
  fi

  return 0
}

export -f lint_service
export SCRIPT_DIR

# Build concurrently commands
LINT_COMMANDS=()
CONCURRENTLY_NAMES=""
CONCURRENTLY_COLORS="cyan,blue,yellow,green,magenta,red"

for service in "${BACKEND_SERVICES[@]}"; do
  LINT_COMMANDS+=("bash -c 'cd apps/$service && bun run lint && $SCRIPT_DIR/backend/validate-structure.sh $service && $SCRIPT_DIR/backend/validate-route-actions.sh $service'")

  if [[ -z "$CONCURRENTLY_NAMES" ]]; then
    CONCURRENTLY_NAMES="$service"
  else
    CONCURRENTLY_NAMES="$CONCURRENTLY_NAMES,$service"
  fi
done

echo -e "${YELLOW}Running all lints in parallel...${NC}"
echo ""

# Run all lints in parallel
if npx concurrently \
  --names "$CONCURRENTLY_NAMES" \
  --prefix-colors "$CONCURRENTLY_COLORS" \
  --kill-others-on-fail \
  "${LINT_COMMANDS[@]}"; then
  echo ""
  echo -e "${GREEN}✓ All backend linting checks passed!${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}✗ One or more linting checks failed${NC}"
  exit 1
fi
