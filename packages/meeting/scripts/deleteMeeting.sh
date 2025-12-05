#!/bin/bash

# Script to delete a meeting and all related files
# Usage: ./deleteMeeting.sh <meeting_name>

if [ $# -ne 1 ]; then
    echo "Usage: $0 <meeting_name>"
    exit 1
fi

MEETING_NAME="$1"

# Paths
RECORDING_DIR="$HOME/Documents/recordings"
MEETINGS_DIR="$HOME/Obsidian/magic/Meetings"
TRANSCRIPTIONS_DIR="$HOME/Obsidian/magic/Transcriptions"

# Files to delete
MP3_FILE="$RECORDING_DIR/${MEETING_NAME}.mp3"
WAV_FILE="$RECORDING_DIR/${MEETING_NAME}.wav"
TRANSCRIPT_JSON="$RECORDING_DIR/${MEETING_NAME}_transcript.json"
SPEAKER_MAP="$RECORDING_DIR/${MEETING_NAME}_speakers.json"
MEETING_NOTE="$MEETINGS_DIR/${MEETING_NAME}.md"
TRANSCRIPT_PAGE="$TRANSCRIPTIONS_DIR/${MEETING_NAME}.md"

# Track deleted files
DELETED_COUNT=0
DELETED_FILES=()

echo "Deleting meeting: $MEETING_NAME"
echo ""

# Delete MP3
if [ -f "$MP3_FILE" ]; then
    rm "$MP3_FILE"
    echo "✓ Deleted MP3: ${MEETING_NAME}.mp3"
    DELETED_FILES+=("${MEETING_NAME}.mp3")
    ((DELETED_COUNT++))
fi

# Delete WAV
if [ -f "$WAV_FILE" ]; then
    rm "$WAV_FILE"
    echo "✓ Deleted WAV: ${MEETING_NAME}.wav"
    DELETED_FILES+=("${MEETING_NAME}.wav")
    ((DELETED_COUNT++))
fi

# Delete transcript JSON
if [ -f "$TRANSCRIPT_JSON" ]; then
    rm "$TRANSCRIPT_JSON"
    echo "✓ Deleted transcript JSON: ${MEETING_NAME}_transcript.json"
    DELETED_FILES+=("${MEETING_NAME}_transcript.json")
    ((DELETED_COUNT++))
fi

# Delete speaker mappings
if [ -f "$SPEAKER_MAP" ]; then
    rm "$SPEAKER_MAP"
    echo "✓ Deleted speaker mappings: ${MEETING_NAME}_speakers.json"
    DELETED_FILES+=("${MEETING_NAME}_speakers.json")
    ((DELETED_COUNT++))
fi

# Delete Obsidian meeting note
if [ -f "$MEETING_NOTE" ]; then
    rm "$MEETING_NOTE"
    echo "✓ Deleted meeting note: ${MEETING_NAME}.md"
    DELETED_FILES+=("Meetings/${MEETING_NAME}.md")
    ((DELETED_COUNT++))
fi

# Delete Obsidian transcript page
if [ -f "$TRANSCRIPT_PAGE" ]; then
    rm "$TRANSCRIPT_PAGE"
    echo "✓ Deleted transcript page: ${MEETING_NAME}.md"
    DELETED_FILES+=("Transcriptions/${MEETING_NAME}.md")
    ((DELETED_COUNT++))
fi

# Delete from Gemini File Search
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GEMINI_SCRIPT="$SCRIPT_DIR/gemini/delete_transcript.py"
if [ -f "$GEMINI_SCRIPT" ]; then
    cd "$SCRIPT_DIR/gemini"
    if uv run delete_transcript.py --name "$MEETING_NAME" 2>/dev/null; then
        ((DELETED_COUNT++))
    fi
    cd - > /dev/null
fi

echo ""

if [ $DELETED_COUNT -eq 0 ]; then
    echo "No files found for meeting: $MEETING_NAME"
    exit 1
else
    echo "Successfully deleted $DELETED_COUNT file(s)"
    exit 0
fi
