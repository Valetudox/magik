#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Backend Services Linting (Parallel)${NC}"
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

# Build concurrently command arguments
CONCURRENTLY_ARGS=()
CONCURRENTLY_NAMES=""
CONCURRENTLY_COLORS="cyan,blue,yellow,green,magenta,red"

# Step 1: Run ESLint in parallel for all services
echo -e "${YELLOW}Step 1: Running ESLint on all backend services (parallel)...${NC}"
echo ""

ESLINT_COMMANDS=()
for service in "${BACKEND_SERVICES[@]}"; do
  ESLINT_COMMANDS+=("cd apps/$service && bun run lint")

  if [[ -z "$CONCURRENTLY_NAMES" ]]; then
    CONCURRENTLY_NAMES="$service"
  else
    CONCURRENTLY_NAMES="$CONCURRENTLY_NAMES,$service"
  fi
done

# Run all ESLint commands in parallel using concurrently
if npx concurrently \
  --names "$CONCURRENTLY_NAMES" \
  --prefix-colors "$CONCURRENTLY_COLORS" \
  --kill-others-on-fail \
  "${ESLINT_COMMANDS[@]}"; then
  echo ""
  echo -e "${GREEN}✓ All services passed ESLint${NC}"
  eslint_failed=0
else
  echo ""
  echo -e "${RED}✗ One or more services failed ESLint${NC}"
  eslint_failed=1
fi

echo ""

# Step 2: Run structure validation in parallel per service
echo -e "${YELLOW}Step 2: Running structure validation (parallel)...${NC}"
echo ""

STRUCTURE_COMMANDS=()
CONCURRENTLY_NAMES=""
for service in "${BACKEND_SERVICES[@]}"; do
  STRUCTURE_COMMANDS+=("$SCRIPT_DIR/backend/validate-structure.sh $service")

  if [[ -z "$CONCURRENTLY_NAMES" ]]; then
    CONCURRENTLY_NAMES="$service"
  else
    CONCURRENTLY_NAMES="$CONCURRENTLY_NAMES,$service"
  fi
done

if npx concurrently \
  --names "$CONCURRENTLY_NAMES" \
  --prefix-colors "$CONCURRENTLY_COLORS" \
  --kill-others-on-fail \
  "${STRUCTURE_COMMANDS[@]}"; then
  echo ""
  echo -e "${GREEN}✓ Structure validation passed${NC}"
  structure_failed=0
else
  echo ""
  echo -e "${RED}✗ Structure validation failed${NC}"
  structure_failed=1
fi

echo ""

# Step 3: Run route-action alignment validation in parallel per service
echo -e "${YELLOW}Step 3: Running route-action alignment validation (parallel)...${NC}"
echo ""

ROUTE_ACTION_COMMANDS=()
CONCURRENTLY_NAMES=""
for service in "${BACKEND_SERVICES[@]}"; do
  ROUTE_ACTION_COMMANDS+=("$SCRIPT_DIR/backend/validate-route-actions.sh $service")

  if [[ -z "$CONCURRENTLY_NAMES" ]]; then
    CONCURRENTLY_NAMES="$service"
  else
    CONCURRENTLY_NAMES="$CONCURRENTLY_NAMES,$service"
  fi
done

if npx concurrently \
  --names "$CONCURRENTLY_NAMES" \
  --prefix-colors "$CONCURRENTLY_COLORS" \
  --kill-others-on-fail \
  "${ROUTE_ACTION_COMMANDS[@]}"; then
  echo ""
  echo -e "${GREEN}✓ Route-action alignment passed${NC}"
  route_action_failed=0
else
  echo ""
  echo -e "${RED}✗ Route-action alignment failed${NC}"
  route_action_failed=1
fi

# Final summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}========================================${NC}"

if [[ $eslint_failed -eq 0 ]] && [[ $structure_failed -eq 0 ]] && [[ $route_action_failed -eq 0 ]]; then
  echo -e "${GREEN}✓ All backend linting checks passed!${NC}"
  exit 0
else
  if [[ $eslint_failed -ne 0 ]]; then
    echo -e "${RED}✗ ESLint checks failed${NC}"
  fi
  if [[ $structure_failed -ne 0 ]]; then
    echo -e "${RED}✗ Structure validation failed${NC}"
  fi
  if [[ $route_action_failed -ne 0 ]]; then
    echo -e "${RED}✗ Route-action alignment failed${NC}"
  fi
  exit 1
fi
