#!/bin/bash

# Script to create or update an Obsidian meeting note
# Usage: ./createMeetingNote.sh <meeting_name> <language> [audio_path] [transcript_path] [end_time]

if [ $# -lt 2 ]; then
    echo "Usage: $0 <meeting_name> <language> [audio_path] [transcript_path] [end_time]"
    exit 1
fi

MEETING_NAME="$1"
LANGUAGE="$2"
AUDIO_PATH="$3"
TRANSCRIPT_PATH="$4"
END_TIME="$5"

# Obsidian vault paths
OBSIDIAN_VAULT="$HOME/Obsidian/magic"
MEETINGS_DIR="$OBSIDIAN_VAULT/Meetings"
NOTE_FILE="$MEETINGS_DIR/${MEETING_NAME}.md"

# Create Meetings directory if it doesn't exist
mkdir -p "$MEETINGS_DIR"

# Get current date and time
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_TIME=$(date +%H:%M:%S)

# If note doesn't exist, create it with frontmatter
if [ ! -f "$NOTE_FILE" ]; then
    cat > "$NOTE_FILE" << EOF
---
date: $CURRENT_DATE
time: $CURRENT_TIME
language: $LANGUAGE
tags:
  - meeting
---

# $MEETING_NAME

EOF
    echo "Created meeting note: $NOTE_FILE"
fi

# Add audio link to frontmatter if provided
if [ -n "$AUDIO_PATH" ] && [ -f "$AUDIO_PATH" ]; then
    # Get relative path or filename
    AUDIO_FILENAME=$(basename "$AUDIO_PATH")
    # Check if audio field already exists in frontmatter
    if ! grep -q "^audio:" "$NOTE_FILE"; then
        # Add audio field after language field in frontmatter
        sed -i "/^language:/a audio: \"[[$AUDIO_FILENAME]]\"" "$NOTE_FILE"
        echo "Added audio link to meeting note frontmatter"
    fi
fi

# Add transcript link in body if provided
if [ -n "$TRANSCRIPT_PATH" ]; then
    # Check if it's a markdown file (transcript page) or JSON file
    if [[ "$TRANSCRIPT_PATH" =~ \.md$ ]]; then
        # It's a transcript page, link to it in the body
        TRANSCRIPT_PAGENAME=$(basename "$TRANSCRIPT_PATH" .md)
        # Check if transcript link already exists in the body
        if ! grep -q "Transcriptions/$TRANSCRIPT_PAGENAME" "$NOTE_FILE"; then
            # Add transcript section if it doesn't exist
            if ! grep -q "## Transcript" "$NOTE_FILE"; then
                # Insert before ## Notes section
                if grep -q "## Notes" "$NOTE_FILE"; then
                    sed -i "/## Notes/i ## Transcript\n\n[[Transcriptions/$TRANSCRIPT_PAGENAME|$TRANSCRIPT_PAGENAME]]\n" "$NOTE_FILE"
                else
                    # Append at the end
                    cat >> "$NOTE_FILE" << EOF

## Transcript

[[Transcriptions/$TRANSCRIPT_PAGENAME|$TRANSCRIPT_PAGENAME]]

EOF
                fi
            else
                # Transcript section exists, add link to it
                sed -i "/## Transcript/a \n[[Transcriptions/$TRANSCRIPT_PAGENAME|$TRANSCRIPT_PAGENAME]]" "$NOTE_FILE"
            fi
            echo "Added transcript page link to meeting note body"
        fi
    fi
fi

# Add end time to frontmatter if provided
if [ -n "$END_TIME" ]; then
    # Check if end_time field already exists in frontmatter
    if ! grep -q "^end_time:" "$NOTE_FILE"; then
        # Add end_time field after time field in frontmatter
        sed -i "/^time:/a end_time: $END_TIME" "$NOTE_FILE"
        echo "Added end time to meeting note frontmatter"
    fi
fi

# Add notes section if it doesn't exist
if ! grep -q "## Notes" "$NOTE_FILE"; then
    cat >> "$NOTE_FILE" << EOF

## Notes


## Action Items
- [ ]

## Attendees

EOF
    echo "Added notes sections to meeting note"
fi

echo "Meeting note updated: $NOTE_FILE"
