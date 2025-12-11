#!/bin/bash

# Thin wrapper for backwards compatibility
# Delegates to TypeScript implementation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Execute TypeScript implementation with all arguments
exec bun run "$SCRIPT_DIR/backend/lint-backend.ts" "$@"
