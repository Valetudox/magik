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
echo -e "${BLUE}  Frontend Services Linting${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Track overall status
eslint_failed=0

# Run ESLint on all UI services
echo -e "${YELLOW}Running ESLint on frontend services...${NC}"
echo ""

for dir in "$ROOT_DIR"/apps/ui-*; do
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

# Final summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}========================================${NC}"

if [[ $eslint_failed -eq 0 ]]; then
  echo -e "${GREEN}✓ All frontend linting checks passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ ESLint checks failed${NC}"
  exit 1
fi
