#!/bin/bash

# Script to record audio with real-time transcription using Python
# Usage: ./recordLive.sh <meeting_name> <language> <jsonl_path> <markdown_path>

if [ $# -ne 4 ]; then
    echo "Usage: $0 <meeting_name> <language> <jsonl_path> <markdown_path>"
    exit 1
fi

MEETING_NAME="$1"
LANGUAGE="$2"
JSONL_PATH="$3"
MARKDOWN_PATH="$4"

# Validate required environment variable
if [ -z "$SPEECHMATICS_API_KEY" ]; then
    echo "Error: SPEECHMATICS_API_KEY environment variable is not set"
    exit 1
fi

echo "Recording audio with real-time transcription..."
echo "Meeting: $MEETING_NAME"
echo "Language: $LANGUAGE"
echo "JSONL: $JSONL_PATH"
echo "Markdown: $MARKDOWN_PATH"
echo ""

# Run Python script for recording and transcription
SCRIPT_DIR="$(dirname "$0")"
PYTHON_SCRIPT="$SCRIPT_DIR/recordLive.py"

echo "Starting live recording and transcription..."
echo ""

uv run python "$PYTHON_SCRIPT" "$MEETING_NAME" "$LANGUAGE" "$JSONL_PATH" "$MARKDOWN_PATH"

echo ""
echo "Recording stopped."
echo "JSONL: $JSONL_PATH"
echo "Markdown: $MARKDOWN_PATH"
