#!/bin/bash

REQUIRED_FILES=(
  "Dockerfile"
  "eslint.config.js"
  "openapi.yaml"
  "package.json"
  "tsconfig.json"
)

REQUIRED_DIRS=(
  "src"
  "src/actions"
)

REQUIRED_SRC_FILES=(
  "config.ts"
  "index.ts"
  "routes.ts"
  "types.ts"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

declare -A errors_by_service
error_count=0

add_error() {
  local service="$1"
  local error_type="$2"
  local item="$3"

  if [[ -z "${errors_by_service[$service]}" ]]; then
    errors_by_service[$service]=""
  fi

  errors_by_service[$service]+="$error_type|$item"$'\n'
  ((error_count++))
}

validate_src_structure() {
  local src_path="$1"
  local service_name="$2"

  # Check required src files exist
  for file in "${REQUIRED_SRC_FILES[@]}"; do
    if [[ ! -f "$src_path/$file" ]]; then
      add_error "$service_name" "missing_src_file" "$file"
    fi
  done
}


validate_backend_service() {
  local service_path="$1"
  local service_name="$2"

  # Check required files
  for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$service_path/$file" ]]; then
      add_error "$service_name" "missing_file" "$file"
    fi
  done

  # Check required directories
  for dir in "${REQUIRED_DIRS[@]}"; do
    if [[ ! -d "$service_path/$dir" ]]; then
      add_error "$service_name" "missing_dir" "$dir"
    fi
  done

  # Validate src structure if src directory exists
  local src_path="$service_path/src"
  if [[ -d "$src_path" ]]; then
    validate_src_structure "$src_path" "$service_name"
  fi
}

main() {
  local apps_dir="apps"

  if [[ ! -d "$apps_dir" ]]; then
    echo "Error: apps directory not found"
    exit 1
  fi

  # Find all backend-* directories
  local backend_services=()
  for dir in "$apps_dir"/backend-*; do
    if [[ -d "$dir" ]]; then
      backend_services+=("$(basename "$dir")")
    fi
  done

  if [[ ${#backend_services[@]} -eq 0 ]]; then
    echo "No backend services found"
    exit 0
  fi

  # Validate each service
  for service in "${backend_services[@]}"; do
    validate_backend_service "$apps_dir/$service" "$service"
  done

  # Report results
  if [[ $error_count -eq 0 ]]; then
    echo -e "${GREEN}✓${NC} All backend services have the required structure"
    echo "  Validated ${#backend_services[@]} service(s): ${backend_services[*]}"
    exit 0
  else
    echo -e "${RED}✗${NC} Backend service validation failed"
    echo ""

    # Print errors grouped by service
    for service in "${!errors_by_service[@]}"; do
      echo "  $service:"
      while IFS='|' read -r error_type item; do
        [[ -z "$error_type" ]] && continue

        case "$error_type" in
          missing_file)
            echo "    - Missing file: $item"
            ;;
          missing_dir)
            echo "    - Missing directory: $item"
            ;;
          missing_src_file)
            echo "    - Missing required file in src: $item"
            ;;
        esac
      done <<< "${errors_by_service[$service]}"
      echo ""
    done

    exit 1
  fi
}

main
