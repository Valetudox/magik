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
echo -e "${BLUE}  Backend Services Linting${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Track overall status
eslint_failed=0
validation_failed=0

# Step 1: Run ESLint on all backend services
echo -e "${YELLOW}Step 1: Running ESLint on backend services...${NC}"
echo ""

for dir in "$ROOT_DIR"/apps/backend-*; do
  if [[ -d "$dir" ]]; then
    service_name=$(basename "$dir")
    echo -e "${BLUE}=== Linting $service_name ===${NC}"

    cd "$dir" || exit 1

    if bun run lint; then
      echo -e "${GREEN}✓ $service_name passed ESLint${NC}"
    else
      echo -e "${RED}✗ $service_name failed ESLint${NC}"
      eslint_failed=1
    fi

    echo ""
    cd "$ROOT_DIR" || exit 1
  fi
done

# Step 2: Run structure validation
echo -e "${YELLOW}Step 2: Running structure validation...${NC}"
echo ""

if "$SCRIPT_DIR/backend/validate-structure.sh"; then
  echo ""
  echo -e "${GREEN}✓ Structure validation passed${NC}"
else
  echo ""
  echo -e "${RED}✗ Structure validation failed${NC}"
  validation_failed=1
fi

# Step 3: Run route-action alignment validation
echo -e "${YELLOW}Step 3: Running route-action alignment validation...${NC}"
echo ""

if "$SCRIPT_DIR/backend/validate-route-actions.sh"; then
  echo ""
  echo -e "${GREEN}✓ Route-action alignment passed${NC}"
else
  echo ""
  echo -e "${RED}✗ Route-action alignment failed${NC}"
  validation_failed=1
fi

# Final summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}========================================${NC}"

if [[ $eslint_failed -eq 0 ]] && [[ $validation_failed -eq 0 ]]; then
  echo -e "${GREEN}✓ All backend linting checks passed!${NC}"
  exit 0
else
  if [[ $eslint_failed -ne 0 ]]; then
    echo -e "${RED}✗ ESLint checks failed${NC}"
  fi
  if [[ $validation_failed -ne 0 ]]; then
    echo -e "${RED}✗ Validation checks failed${NC}"
  fi
  exit 1
fi
