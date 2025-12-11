#!/bin/bash

# Thin wrapper for backwards compatibility
# Delegates to TypeScript implementation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Execute TypeScript implementation
exec bun run "$SCRIPT_DIR/backend/lint-backend.ts" "$@"
