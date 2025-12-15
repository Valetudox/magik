#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check if config.json exists
if [ ! -f "$PROJECT_ROOT/config/config.json" ]; then
    echo "❌ Error: config/config.json not found"
    exit 1
fi

# Discover all backend services from config.json
BACKEND_SERVICES=()
SERVICE_NAMES=()
SERVICE_COLORS=("blue" "cyan" "magenta" "yellow" "green" "red" "white" "gray")

while IFS= read -r service_key; do
    service_name=$(echo "$service_key" | sed 's/BACKEND_/backend-/' | tr '[:upper:]' '[:lower:]')
    BACKEND_SERVICES+=("$service_name")
    # Extract display name (e.g., "decision" from "backend-decision")
    display_name="be-$(echo "$service_name" | sed 's/backend-//')"
    SERVICE_NAMES+=("$display_name")
done < <(jq -r '.services | keys[]' "$PROJECT_ROOT/config/config.json" | grep '^BACKEND_')

# Discover all UI services from config.json
UI_SERVICES=()

while IFS= read -r ui_key; do
    ui_name=$(echo "$ui_key" | sed 's/UI_/ui-/' | tr '[:upper:]' '[:lower:]')
    UI_SERVICES+=("$ui_name")
    # Extract display name (e.g., "decision" from "ui-decision")
    display_name="fe-$(echo "$ui_name" | sed 's/ui-//')"
    SERVICE_NAMES+=("$display_name")
done < <(jq -r '.uis | keys[]' "$PROJECT_ROOT/config/config.json" | grep '^UI_')

# Combine all services
ALL_SERVICES=("${BACKEND_SERVICES[@]}" "${UI_SERVICES[@]}")

# Build concurrently command
CONCURRENTLY_CMD="bunx concurrently"

# Add service names
NAMES_ARG="-n $(IFS=,; echo "${SERVICE_NAMES[*]}")"
CONCURRENTLY_CMD="$CONCURRENTLY_CMD $NAMES_ARG"

# Add colors (cycle through available colors)
COLORS_ARG="-c "
for i in "${!ALL_SERVICES[@]}"; do
    color_index=$((i % ${#SERVICE_COLORS[@]}))
    if [ $i -eq 0 ]; then
        COLORS_ARG="${COLORS_ARG}${SERVICE_COLORS[$color_index]}"
    else
        COLORS_ARG="${COLORS_ARG},${SERVICE_COLORS[$color_index]}"
    fi
done
CONCURRENTLY_CMD="$CONCURRENTLY_CMD $COLORS_ARG"

# Add commands for each service
for service in "${ALL_SERVICES[@]}"; do
    CONCURRENTLY_CMD="$CONCURRENTLY_CMD \"bun run --cwd apps/$service dev\""
done

echo "Starting ${#BACKEND_SERVICES[@]} backend services and ${#UI_SERVICES[@]} frontend services..."
echo "Backends: $(IFS=,; echo "${BACKEND_SERVICES[@]}" | sed 's/backend-//g')"
echo "Frontends: $(IFS=,; echo "${UI_SERVICES[@]}" | sed 's/ui-//g')"
echo ""

eval $CONCURRENTLY_CMD
