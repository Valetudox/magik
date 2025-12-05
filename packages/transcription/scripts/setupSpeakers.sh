#!/bin/bash

# Script to setup speaker names for a meeting transcription
# Usage: ./setupSpeakers.sh <meeting_name> <speaker_mappings_json>
# speaker_mappings_json format: {"S1":"John Doe","S2":"Jane Smith"}

if [ $# -ne 2 ]; then
    echo "Usage: $0 <meeting_name> <speaker_mappings_json>"
    exit 1
fi

MEETING_NAME="$1"
SPEAKER_MAPPINGS="$2"

# Paths
RECORDING_DIR="$HOME/Documents/recordings"
TRANSCRIPT_JSON="$RECORDING_DIR/${MEETING_NAME}_transcript.json"
SPEAKER_MAP_FILE="$RECORDING_DIR/${MEETING_NAME}_speakers.json"

# Check if transcript exists
if [ ! -f "$TRANSCRIPT_JSON" ]; then
    echo "Error: Transcript file '$TRANSCRIPT_JSON' not found"
    exit 1
fi

# Check for jq dependency
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install jq to use this script."
    exit 1
fi

# Save speaker mappings to file
echo "$SPEAKER_MAPPINGS" > "$SPEAKER_MAP_FILE"

echo "Speaker mappings saved to: $SPEAKER_MAP_FILE"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Regenerate the transcript page with speaker names
echo "Regenerating transcript page with speaker names..."
"$SCRIPT_DIR/formatTranscript.sh" "$TRANSCRIPT_JSON" "$MEETING_NAME"

echo "Speaker setup completed successfully!"
