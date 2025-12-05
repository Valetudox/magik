#!/bin/bash

# Wrapper script to upload transcript to Gemini File Search
# Usage: ./uploadTranscript.sh <transcript_markdown_path> <meeting_name>

if [ $# -ne 2 ]; then
    echo "Usage: $0 <transcript_markdown_path> <meeting_name>"
    exit 1
fi

TRANSCRIPT_PATH="$1"
MEETING_NAME="$2"

# Check if transcript file exists
if [ ! -f "$TRANSCRIPT_PATH" ]; then
    echo "Error: Transcript file not found: $TRANSCRIPT_PATH"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Call Python script using uv (must run from the script directory for uv to find the venv)
cd "$SCRIPT_DIR"
uv run upload_transcript.py --file "$TRANSCRIPT_PATH" --name "$MEETING_NAME"
