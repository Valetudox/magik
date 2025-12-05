#!/bin/bash

# Script to rename a meeting and all related files
# Usage: ./renameMeeting.sh <old_meeting_name> <new_meeting_name>

if [ $# -ne 2 ]; then
    echo "Usage: $0 <old_meeting_name> <new_meeting_name>"
    echo "Example: $0 20251111_095430 weekly-standup"
    exit 1
fi

OLD_NAME="$1"
NEW_NAME="$2"

# Define paths
RECORDING_DIR="$HOME/Documents/recordings"
OBSIDIAN_VAULT="$HOME/Obsidian/magic"
MEETINGS_DIR="$OBSIDIAN_VAULT/Meetings"
TRANSCRIPTIONS_DIR="$OBSIDIAN_VAULT/Transcriptions"

# Define file paths
OLD_MEETING_NOTE="$MEETINGS_DIR/${OLD_NAME}.md"
NEW_MEETING_NOTE="$MEETINGS_DIR/${NEW_NAME}.md"
OLD_TRANSCRIPT_PAGE="$TRANSCRIPTIONS_DIR/${OLD_NAME}.md"
NEW_TRANSCRIPT_PAGE="$TRANSCRIPTIONS_DIR/${NEW_NAME}.md"

OLD_MP3="$RECORDING_DIR/${OLD_NAME}.mp3"
NEW_MP3="$RECORDING_DIR/${NEW_NAME}.mp3"
OLD_WAV="$RECORDING_DIR/${OLD_NAME}.wav"
NEW_WAV="$RECORDING_DIR/${NEW_NAME}.wav"
OLD_TRANSCRIPT_JSON="$RECORDING_DIR/${OLD_NAME}_transcript.json"
NEW_TRANSCRIPT_JSON="$RECORDING_DIR/${NEW_NAME}_transcript.json"

# Check if old meeting note exists
if [ ! -f "$OLD_MEETING_NOTE" ]; then
    echo "Error: Meeting note '$OLD_MEETING_NOTE' not found"
    exit 1
fi

echo "Renaming meeting from '$OLD_NAME' to '$NEW_NAME'..."
echo ""

# Step 1: Rename audio files
if [ -f "$OLD_MP3" ]; then
    mv "$OLD_MP3" "$NEW_MP3"
    echo "✓ Renamed MP3: ${OLD_NAME}.mp3 -> ${NEW_NAME}.mp3"
fi

if [ -f "$OLD_WAV" ]; then
    mv "$OLD_WAV" "$NEW_WAV"
    echo "✓ Renamed WAV: ${OLD_NAME}.wav -> ${NEW_NAME}.wav"
fi

if [ -f "$OLD_TRANSCRIPT_JSON" ]; then
    mv "$OLD_TRANSCRIPT_JSON" "$NEW_TRANSCRIPT_JSON"
    echo "✓ Renamed transcript JSON: ${OLD_NAME}_transcript.json -> ${NEW_NAME}_transcript.json"
fi

echo ""

# Step 2: Rename and update transcript page
if [ -f "$OLD_TRANSCRIPT_PAGE" ]; then
    # Update title in transcript page
    sed -i "s/^# Transcript: $OLD_NAME$/# Transcript: $NEW_NAME/" "$OLD_TRANSCRIPT_PAGE"

    # Update audio_file reference if it exists
    sed -i "s/audio_file: ${OLD_NAME}\\.mp3/audio_file: ${NEW_NAME}.mp3/" "$OLD_TRANSCRIPT_PAGE"

    # Rename the transcript page file
    mv "$OLD_TRANSCRIPT_PAGE" "$NEW_TRANSCRIPT_PAGE"
    echo "✓ Renamed transcript page: ${OLD_NAME}.md -> ${NEW_NAME}.md"
    echo "  - Updated title in transcript page"
    echo "  - Updated audio file reference"
fi

echo ""

# Step 3: Update meeting note
if [ -f "$OLD_MEETING_NOTE" ]; then
    # Update title (H1 heading)
    sed -i "s/^# $OLD_NAME$/# $NEW_NAME/" "$OLD_MEETING_NOTE"

    # Update audio link in frontmatter
    sed -i "s/audio: \"\[\[${OLD_NAME}\\.mp3\]\]\"/audio: \"[[${NEW_NAME}.mp3]]\"/" "$OLD_MEETING_NOTE"

    # Update transcript link in body
    sed -i "s|\[\[Transcriptions/${OLD_NAME}|${OLD_NAME}\]\]|[[Transcriptions/${NEW_NAME}|${NEW_NAME}]]|g" "$OLD_MEETING_NOTE"

    # Rename the meeting note file
    mv "$OLD_MEETING_NOTE" "$NEW_MEETING_NOTE"
    echo "✓ Updated meeting note: ${OLD_NAME}.md -> ${NEW_NAME}.md"
    echo "  - Updated title"
    echo "  - Updated audio link"
    echo "  - Updated transcript link"
fi

echo ""

# Step 4: Search for and update any other references in Obsidian vault
echo "Searching for other references in Obsidian vault..."

# Find all markdown files that reference the old meeting name
REFERENCES=$(grep -rl "\[\[${OLD_NAME}\]\]" "$OBSIDIAN_VAULT" 2>/dev/null | grep -v "$NEW_MEETING_NOTE" | grep -v "$NEW_TRANSCRIPT_PAGE")

if [ -n "$REFERENCES" ]; then
    echo "Found references in other files, updating..."
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            # Update references from [[old_name]] to [[new_name]]
            sed -i "s/\[\[${OLD_NAME}\]\]/[[${NEW_NAME}]]/g" "$file"
            echo "  - Updated: $file"
        fi
    done <<< "$REFERENCES"
else
    echo "  - No other references found"
fi

echo ""
echo "✓ Rename complete!"
echo ""
echo "Summary:"
echo "  Meeting note: $NEW_MEETING_NOTE"
if [ -f "$NEW_TRANSCRIPT_PAGE" ]; then
    echo "  Transcript page: $NEW_TRANSCRIPT_PAGE"
fi
if [ -f "$NEW_MP3" ]; then
    echo "  Audio file: $NEW_MP3"
fi
if [ -f "$NEW_TRANSCRIPT_JSON" ]; then
    echo "  Transcript JSON: $NEW_TRANSCRIPT_JSON"
fi
