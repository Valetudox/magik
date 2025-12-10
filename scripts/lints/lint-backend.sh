#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Backend Services Linting${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Collect all backend services
backend_services=()
for dir in "$ROOT_DIR"/apps/backend-*; do
  if [[ -d "$dir" ]]; then
    backend_services+=("$(basename "$dir")")
  fi
done

total_backends=${#backend_services[@]}
if [[ $total_backends -eq 0 ]]; then
  echo -e "${YELLOW}No backend services found${NC}"
  exit 0
fi

echo -e "${CYAN}Found $total_backends backend service(s): ${backend_services[*]}${NC}"
echo ""

# Track results per backend
declare -A backend_results
declare -A linter_failures

# Process each backend
current=0
for service in "${backend_services[@]}"; do
  ((current++))
  service_dir="$ROOT_DIR/apps/$service"

  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Backend $current/$total_backends: $service${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""

  backend_failed=0

  # Step 1: ESLint
  echo -e "${YELLOW}  [1/4] Running ESLint...${NC}"
  cd "$service_dir" || exit 1

  if bun run lint 2>&1; then
    echo -e "${GREEN}  ✓ ESLint passed${NC}"
  else
    echo -e "${RED}  ✗ ESLint failed${NC}"
    backend_failed=1
    linter_failures["$service-eslint"]=1
  fi
  echo ""

  cd "$ROOT_DIR" || exit 1

  # Step 2: Structure validation
  echo -e "${YELLOW}  [2/4] Running structure validation...${NC}"
  if "$SCRIPT_DIR/backend/validate-structure.sh" "apps/$service" 2>&1; then
    echo -e "${GREEN}  ✓ Structure validation passed${NC}"
  else
    echo -e "${RED}  ✗ Structure validation failed${NC}"
    backend_failed=1
    linter_failures["$service-structure"]=1
  fi
  echo ""

  # Step 3: Config extends validation
  echo -e "${YELLOW}  [3/4] Running config extends validation...${NC}"
  if "$SCRIPT_DIR/backend/validate-config-extends-strict.ts" "$service" 2>&1; then
    echo -e "${GREEN}  ✓ Config extends validation passed${NC}"
  else
    echo -e "${RED}  ✗ Config extends validation failed${NC}"
    backend_failed=1
    linter_failures["$service-config"]=1
  fi
  echo ""

  # Step 4: Route-action alignment validation
  echo -e "${YELLOW}  [4/4] Running route-action alignment validation...${NC}"
  if "$SCRIPT_DIR/backend/validate-route-actions.sh" "$service" 2>&1; then
    echo -e "${GREEN}  ✓ Route-action alignment passed${NC}"
  else
    echo -e "${RED}  ✗ Route-action alignment failed${NC}"
    backend_failed=1
    linter_failures["$service-routes"]=1
  fi
  echo ""

  # Store result for this backend
  if [[ $backend_failed -eq 0 ]]; then
    backend_results["$service"]="passed"
    echo -e "${GREEN}✓ $service: All checks passed${NC}"
  else
    backend_results["$service"]="failed"
    echo -e "${RED}✗ $service: Some checks failed${NC}"
  fi
  echo ""
done

# Final summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Final Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

passed_count=0
failed_count=0
failed_backends=()

for service in "${backend_services[@]}"; do
  if [[ "${backend_results[$service]}" == "passed" ]]; then
    echo -e "${GREEN}✓ $service${NC}"
    ((passed_count++))
  else
    echo -e "${RED}✗ $service${NC}"
    ((failed_count++))
    failed_backends+=("$service")

    # Show which linters failed
    if [[ -n "${linter_failures[$service-eslint]}" ]]; then
      echo -e "    - ESLint failed"
    fi
    if [[ -n "${linter_failures[$service-structure]}" ]]; then
      echo -e "    - Structure validation failed"
    fi
    if [[ -n "${linter_failures[$service-config]}" ]]; then
      echo -e "    - Config extends validation failed"
    fi
    if [[ -n "${linter_failures[$service-routes]}" ]]; then
      echo -e "    - Route-action alignment failed"
    fi
  fi
done

echo ""
echo -e "${CYAN}Results: $passed_count passed, $failed_count failed out of $total_backends backend(s)${NC}"

if [[ $failed_count -eq 0 ]]; then
  echo ""
  echo -e "${GREEN}✓ All backend linting checks passed!${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}✗ Some backend linting checks failed${NC}"
  exit 1
fi
