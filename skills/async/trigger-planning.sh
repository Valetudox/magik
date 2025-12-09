#!/usr/bin/env bash

# Script to trigger planning via GitHub issue
# Usage: ./trigger-planning.sh --title "Feature/Bug title" --description "Detailed description"

set -euo pipefail

# Parse arguments
TITLE=""
DESCRIPTION=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --title)
      TITLE="$2"
      shift 2
      ;;
    --description)
      DESCRIPTION="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 --title <issue-title> --description <issue-description>" >&2
      exit 1
      ;;
  esac
done

# Validate required arguments
if [[ -z "$TITLE" ]]; then
  echo "Error: --title is required" >&2
  exit 1
fi

if [[ -z "$DESCRIPTION" ]]; then
  echo "Error: --description is required" >&2
  exit 1
fi

# Create issue with planning label and capture URL
ISSUE_URL=$(gh issue create --title "$TITLE" --body "$DESCRIPTION" --label "planning")

# Extract issue number from URL
ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -oP '/issues/\K\d+')

# Output issue number (this is what gets captured by callers)
echo "$ISSUE_NUMBER"

# Log success to stderr so it doesn't interfere with stdout
echo "✅ Planning triggered successfully!" >&2
echo "   Issue #$ISSUE_NUMBER: $ISSUE_URL" >&2
echo "" >&2
echo "Monitor progress with:" >&2
echo "   gh issue view $ISSUE_NUMBER --comments" >&2
