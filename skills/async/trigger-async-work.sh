#!/usr/bin/env bash

# Script to trigger asynchronous work via GitHub pull request
# Usage: ./trigger-async-work.sh --name "task-name" --description "Task description for PR body"

set -euo pipefail

# Cleanup function to ensure we return to original branch
cleanup() {
  local exit_code=$?
  if [[ -n "${ORIGINAL_BRANCH:-}" ]]; then
    git checkout "$ORIGINAL_BRANCH" >&2 2>/dev/null || true
  fi
  exit $exit_code
}

# Set trap to run cleanup on exit
trap cleanup EXIT INT TERM

# Parse arguments
NAME=""
DESCRIPTION=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --name)
      NAME="$2"
      shift 2
      ;;
    --description)
      DESCRIPTION="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 --name <task-name> --description <pr-description>" >&2
      exit 1
      ;;
  esac
done

# Validate required arguments
if [[ -z "$NAME" ]]; then
  echo "Error: --name is required" >&2
  exit 1
fi

if [[ -z "$DESCRIPTION" ]]; then
  echo "Error: --description is required" >&2
  exit 1
fi

# Save current branch to return to it later
ORIGINAL_BRANCH=$(git branch --show-current)

# Fetch latest changes from remote
echo "Fetching latest changes from remote..." >&2
git fetch origin >&2

# Switch to main and pull latest changes
echo "Updating main branch..." >&2
git checkout main >&2
git pull origin main >&2

# Push main to ensure remote is up to date
echo "Pushing main to remote..." >&2
git push origin main >&2

# Create branch name with timestamp
TIMESTAMP=$(date +%s)
BRANCH_NAME="async/${NAME}-${TIMESTAMP}"

# Create and push branch from updated main
echo "Creating branch: $BRANCH_NAME" >&2
git checkout -b "$BRANCH_NAME" >&2
git push -u origin "$BRANCH_NAME" >&2

# Create pull request and capture URL
PR_URL=$(gh pr create --title "$NAME" --body "$DESCRIPTION")

# Extract PR number from URL
PR_NUMBER=$(echo "$PR_URL" | grep -oP '/pull/\K\d+')

# Output PR number (this is what gets captured by callers)
echo "$PR_NUMBER"

# Log success to stderr so it doesn't interfere with stdout
echo "✅ Async work triggered successfully!" >&2
echo "   PR #$PR_NUMBER: $PR_URL" >&2
echo "   Branch: $BRANCH_NAME" >&2
echo "" >&2
echo "Monitor progress with:" >&2
echo "   gh pr checks $PR_NUMBER --watch" >&2
