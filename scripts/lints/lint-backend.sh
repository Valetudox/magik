#!/bin/bash

# Thin wrapper for backwards compatibility
# Delegates to TypeScript implementation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Determine mode based on environment if not provided
MODE=""
for arg in "$@"; do
  if [[ "$arg" == --mode=* ]]; then
    MODE="$arg"
    break
  fi
done

# If no mode specified, detect from environment
if [ -z "$MODE" ]; then
  if [ -n "$CI" ] || [ -n "$CONTINUOUS_INTEGRATION" ] || [ -n "$GITHUB_ACTIONS" ] || \
     [ -n "$JENKINS_URL" ] || [ -n "$GITLAB_CI" ] || [ -n "$CIRCLECI" ] || [ -n "$TRAVIS" ]; then
    MODE="--mode=ci"
  elif [ -t 1 ]; then
    # stdout is a TTY (interactive terminal)
    MODE="--mode=cli"
  else
    # Not a TTY (piped or redirected)
    MODE="--mode=ci"
  fi
fi

# Execute TypeScript implementation with mode
exec bun run "$SCRIPT_DIR/backend/lint-backend.ts" "$MODE" "$@"
