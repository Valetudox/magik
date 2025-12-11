#!/bin/bash

# Thin wrapper for backwards compatibility
# Delegates to TypeScript implementation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check if mode is provided
MODE=""
for arg in "$@"; do
  if [[ "$arg" == --mode=* ]]; then
    MODE="$arg"
    break
  fi
done

# Mode is required
if [ -z "$MODE" ]; then
  echo "Error: --mode argument is required"
  echo "Usage: $0 --mode=<ci|cli>"
  exit 1
fi

# Execute TypeScript implementation with mode
exec bun run "$SCRIPT_DIR/backend/lint-backend.ts" "$MODE" "$@"
