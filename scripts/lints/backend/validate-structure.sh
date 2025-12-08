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
)

ALLOWED_SRC_DIRS=(
  "actions"
  "services"
  "utils"
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

  # Check required src files
  for file in "${REQUIRED_SRC_FILES[@]}"; do
    if [[ ! -f "$src_path/$file" ]]; then
      add_error "$service_name" "missing_src_file" "$file"
    fi
  done

  # Check for unauthorized files/dirs in src root
  for item in "$src_path"/*; do
    [[ ! -e "$item" ]] && continue

    local item_name=$(basename "$item")

    if [[ -d "$item" ]]; then
      # Check if directory is allowed
      local is_allowed=false
      for allowed_dir in "${ALLOWED_SRC_DIRS[@]}"; do
        if [[ "$item_name" == "$allowed_dir" ]]; then
          is_allowed=true
          break
        fi
      done

      if [[ "$is_allowed" == false ]]; then
        add_error "$service_name" "unauthorized_src_dir" "$item_name"
      fi
    else
      # Check if file is allowed (must be in REQUIRED_SRC_FILES or be types.ts)
      local is_allowed=false
      for allowed_file in "${REQUIRED_SRC_FILES[@]}"; do
        if [[ "$item_name" == "$allowed_file" ]]; then
          is_allowed=true
          break
        fi
      done

      # types.ts is optional but allowed
      if [[ "$item_name" == "types.ts" ]]; then
        is_allowed=true
      fi

      if [[ "$is_allowed" == false ]]; then
        add_error "$service_name" "unauthorized_src_file" "$item_name"
      fi
    fi
  done
}

validate_action_files() {
  local actions_path="$1"
  local service_name="$2"
  local service_path="$3"

  # Find all .ts files recursively in actions directory
  while IFS= read -r -d '' file; do
    local filename=$(basename "$file")
    local relative_path="${file#$service_path/}"

    # File must be either index.ts or end with .action.ts
    if [[ "$filename" != "index.ts" && "$filename" != *.action.ts ]]; then
      add_error "$service_name" "invalid_action_file" "$relative_path"
    fi
  done < <(find "$actions_path" -type f -name "*.ts" -print0)
}

validate_service_files() {
  local services_path="$1"
  local service_name="$2"
  local service_path="$3"

  # Find all .ts files recursively in services directory
  while IFS= read -r -d '' file; do
    local filename=$(basename "$file")
    local relative_path="${file#$service_path/}"

    # File must be either index.ts or end with .service.ts
    if [[ "$filename" != "index.ts" && "$filename" != *.service.ts ]]; then
      add_error "$service_name" "invalid_service_file" "$relative_path"
    fi
  done < <(find "$services_path" -type f -name "*.ts" -print0)
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

    # Validate action files if actions directory exists
    local actions_path="$src_path/actions"
    if [[ -d "$actions_path" ]]; then
      validate_action_files "$actions_path" "$service_name" "$service_path"
    fi

    # Validate service files if services directory exists
    local services_path="$src_path/services"
    if [[ -d "$services_path" ]]; then
      validate_service_files "$services_path" "$service_name" "$service_path"
    fi
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
          unauthorized_src_file)
            echo "    - Unauthorized file in src root: $item"
            ;;
          unauthorized_src_dir)
            echo "    - Unauthorized directory in src root: $item (allowed: actions, services, utils)"
            ;;
          invalid_action_file)
            echo "    - Invalid action file (must be index.ts or *.action.ts): $item"
            ;;
          invalid_service_file)
            echo "    - Invalid service file (must be index.ts or *.service.ts): $item"
            ;;
        esac
      done <<< "${errors_by_service[$service]}"
      echo ""
    done

    exit 1
  fi
}

main
