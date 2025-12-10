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

  # Check for invalid folders in src/ (only actions, services, utils are allowed)
  local allowed_folders=("actions" "services" "utils")
  for dir in "$src_path"/*; do
    if [[ -d "$dir" ]]; then
      local folder_name="$(basename "$dir")"
      local is_allowed=false

      for allowed in "${allowed_folders[@]}"; do
        if [[ "$folder_name" == "$allowed" ]]; then
          is_allowed=true
          break
        fi
      done

      if [[ "$is_allowed" == false ]]; then
        add_error "$service_name" "invalid_folder" "$folder_name"
      fi
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
  # Check if backend path argument is provided
  if [[ $# -eq 0 ]]; then
    echo -e "${RED}Error: Backend service path argument is required${NC}"
    echo "Usage: $0 <backend-service-path>"
    echo "Example: $0 apps/backend-audio"
    exit 1
  fi

  local service_path="$1"

  # Validate that the path exists
  if [[ ! -d "$service_path" ]]; then
    echo -e "${RED}Error: Backend service path does not exist: $service_path${NC}"
    exit 1
  fi

  # Extract service name from path
  local service_name=$(basename "$service_path")

  # Validate the backend service
  validate_backend_service "$service_path" "$service_name"

  # Report results
  if [[ $error_count -eq 0 ]]; then
    echo -e "${GREEN}✓${NC} Backend service has the required structure"
    echo "  Validated: $service_name"
    exit 0
  else
    echo -e "${RED}✗${NC} Backend service validation failed"
    echo ""

    # Print errors
    echo "  $service_name:"
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
        invalid_folder)
          echo "    - Invalid folder in src/: $item (only 'actions', 'services', 'utils' are allowed)"
          ;;
      esac
    done <<< "${errors_by_service[$service_name]}"
    echo ""

    exit 1
  fi
}

main "$@"
