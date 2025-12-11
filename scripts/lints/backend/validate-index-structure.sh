#!/bin/bash

# This script validates that endpoint-only backend services follow the standard index.ts structure
# It reads the backendMode from config.json and enforces structure for endpoint-only services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

declare -A errors_by_service
error_count=0

add_error() {
  local service="$1"
  local error_msg="$2"

  if [[ -z "${errors_by_service[$service]}" ]]; then
    errors_by_service[$service]=""
  fi

  errors_by_service[$service]+="$error_msg"$'\n'
  ((error_count++))
}

# Extract service name from containerName (e.g., backend-audio -> Audio)
get_service_display_name() {
  local container_name="$1"
  # Remove "backend-" prefix and capitalize first letter
  local name="${container_name#backend-}"
  # Capitalize first letter of each word (handle hyphenated names)
  name=$(echo "$name" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
  echo "$name"
}

# Check if service is endpoint-only mode
is_endpoint_only() {
  local service_key="$1"
  local config_file="$2"

  # Extract backendMode for this service from config.json
  local backend_mode=$(node -e "
    const config = require('$config_file');
    const mode = config.services['$service_key']?.backendMode || 'custom';
    console.log(mode);
  " 2>/dev/null)

  [[ "$backend_mode" == "endpoint-only" ]]
}

# Get container name for service
get_container_name() {
  local service_key="$1"
  local config_file="$2"

  node -e "
    const config = require('$config_file');
    const containerName = config.services['$service_key']?.containerName || '';
    console.log(containerName);
  " 2>/dev/null
}

validate_endpoint_only_structure() {
  local index_file="$1"
  local service_name="$2"
  local container_name="$3"

  # Read the file content
  local content=$(cat "$index_file")

  # Remove all comments (single-line and multi-line)
  local content_no_comments=$(echo "$content" | sed 's|//.*||g' | sed ':a;N;$!ba;s|/\*.*\*/||g')

  # Expected imports (order doesn't matter, but these must be present)
  local required_imports=(
    "import cors from '@fastify/cors'"
    "import Fastify from 'fastify'"
    "import { PORT } from './config'"
    "import { registerRoutes } from './routes'"
  )

  # Check for required imports
  for import_line in "${required_imports[@]}"; do
    if ! echo "$content" | grep -qF "$import_line"; then
      add_error "$service_name" "  - Missing required import: $import_line"
    fi
  done

  # Check for extra imports (not in the required list)
  local import_lines=$(echo "$content" | grep "^import " | grep -v "^import cors from '@fastify/cors'" | grep -v "^import Fastify from 'fastify'" | grep -v "^import { PORT } from './config'" | grep -v "^import { registerRoutes } from './routes'")
  if [[ -n "$import_lines" ]]; then
    while IFS= read -r line; do
      [[ -z "$line" ]] && continue
      add_error "$service_name" "  - Extra import found: $line"
    done <<< "$import_lines"
  fi

  # Check for async function start()
  if ! echo "$content_no_comments" | grep -q "async function start()"; then
    add_error "$service_name" "  - Missing 'async function start()' declaration"
  fi

  # Check for void start()
  if ! echo "$content_no_comments" | grep -q "void start()"; then
    add_error "$service_name" "  - Missing 'void start()' invocation"
  fi

  # Check for required structure elements
  if ! echo "$content_no_comments" | grep -q "const fastify = Fastify"; then
    add_error "$service_name" "  - Missing 'const fastify = Fastify' initialization"
  fi

  if ! echo "$content_no_comments" | grep -q "logger: true"; then
    add_error "$service_name" "  - Missing 'logger: true' in Fastify config"
  fi

  if ! echo "$content_no_comments" | grep -q "await fastify.register(cors"; then
    add_error "$service_name" "  - Missing CORS registration: 'await fastify.register(cors'"
  fi

  if ! echo "$content_no_comments" | grep -q "registerRoutes(fastify)"; then
    add_error "$service_name" "  - Missing 'registerRoutes(fastify)' call"
  fi

  if ! echo "$content_no_comments" | grep -q "await fastify.listen({ port: PORT, host: '0.0.0.0' })"; then
    add_error "$service_name" "  - Missing standard listen call: 'await fastify.listen({ port: PORT, host: '0.0.0.0' })'"
  fi

  # Check log message format
  local service_display_name=$(get_service_display_name "$container_name")
  local expected_log="Backend $service_display_name API running at http://localhost:\${PORT}"

  if ! echo "$content" | grep -qF "fastify.log.info(\`Backend $service_display_name API running at http://localhost:\${PORT}\`)"; then
    add_error "$service_name" "  - Log message incorrect"
    add_error "$service_name" "    Expected: fastify.log.info(\`$expected_log\`)"

    # Try to find what log message is actually there
    local actual_log=$(echo "$content" | grep "fastify.log.info" | head -n 1 | sed 's/^[[:space:]]*//')
    if [[ -n "$actual_log" ]]; then
      add_error "$service_name" "    Got: $actual_log"
    fi
  fi

  # Check for error handling
  if ! echo "$content_no_comments" | grep -q "fastify.log.error(err)"; then
    add_error "$service_name" "  - Missing error logging: 'fastify.log.error(err)'"
  fi

  if ! echo "$content_no_comments" | grep -q "process.exit(1)"; then
    add_error "$service_name" "  - Missing 'process.exit(1)' in error handler"
  fi

  # Check for forbidden patterns (things that shouldn't be in endpoint-only mode)
  if echo "$content" | grep -q "setupFileWatcher\|Socket\.IO\|setupWatcher"; then
    add_error "$service_name" "  - Contains custom initialization code (file watcher, Socket.IO, etc.)"
    add_error "$service_name" "    Either remove custom code or change backendMode to 'custom' in config.json"
  fi

  # Check for dynamic port resolution (shouldn't use getPort in index.ts)
  if echo "$content" | grep -q "getPort("; then
    add_error "$service_name" "  - Uses dynamic port resolution (getPort) - should import PORT from ./config"
  fi
}

main() {
  # Check if service name argument is provided
  if [[ $# -eq 0 ]]; then
    echo -e "${RED}Error: Backend service name argument is required${NC}"
    echo "Usage: $0 <service-name>"
    echo "Example: $0 backend-audio"
    exit 1
  fi

  local service_name="$1"

  # Get the root directory (3 levels up from scripts/lints/backend)
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

  # Paths
  local config_file="$ROOT_DIR/config/config.json"
  local service_path="$ROOT_DIR/apps/$service_name"
  local index_file="$service_path/src/index.ts"

  # Validate paths exist
  if [[ ! -f "$config_file" ]]; then
    echo -e "${RED}Error: config.json not found at $config_file${NC}"
    exit 1
  fi

  if [[ ! -d "$service_path" ]]; then
    echo -e "${RED}Error: Service directory not found: $service_path${NC}"
    exit 1
  fi

  if [[ ! -f "$index_file" ]]; then
    echo -e "${RED}Error: index.ts not found at $index_file${NC}"
    exit 1
  fi

  # Convert service name to config key (backend-audio -> BACKEND_AUDIO)
  local service_key=$(echo "$service_name" | tr '[:lower:]' '[:upper:]' | tr '-' '_')

  # Check if this service is endpoint-only mode
  if ! is_endpoint_only "$service_key" "$config_file"; then
    # Service is in custom mode, skip validation
    echo -e "${GREEN}✓${NC} Service $service_name is in 'custom' mode (skipping index.ts structure validation)"
    exit 0
  fi

  # Get container name for display purposes
  local container_name=$(get_container_name "$service_key" "$config_file")

  # Validate the structure
  validate_endpoint_only_structure "$index_file" "$service_name" "$container_name"

  # Report results
  if [[ $error_count -eq 0 ]]; then
    echo -e "${GREEN}✓${NC} Service $service_name follows the endpoint-only structure"
    exit 0
  else
    echo -e "${RED}✗${NC} Service $service_name violates endpoint-only structure requirements"
    echo ""

    # Print errors
    while IFS= read -r error_msg; do
      [[ -z "$error_msg" ]] && continue
      echo "$error_msg"
    done <<< "${errors_by_service[$service_name]}"
    echo ""
    echo -e "${YELLOW}This service is configured as 'endpoint-only' and must follow the standard structure.${NC}"
    echo -e "${YELLOW}Either fix the index.ts to match the standard, or change backendMode to 'custom' in config.json.${NC}"
    echo ""

    exit 1
  fi
}

main "$@"
