#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run the TypeScript linter
"$SCRIPT_DIR/frontend/lint-frontend.ts" "$@"
