#!/bin/bash

# Script to convert Speechmatics JSON transcript to Obsidian markdown
# Usage: ./formatTranscript.sh <transcript.json> <meeting_name>

if [ $# -ne 2 ]; then
    echo "Usage: $0 <transcript.json> <meeting_name>"
    exit 1
fi

TRANSCRIPT_JSON="$1"
MEETING_NAME="$2"

# Check if input file exists
if [ ! -f "$TRANSCRIPT_JSON" ]; then
    echo "Error: File '$TRANSCRIPT_JSON' not found"
    exit 1
fi

# Check for speaker mappings file
RECORDING_DIR="$HOME/Documents/recordings"
SPEAKER_MAP_FILE="$RECORDING_DIR/${MEETING_NAME}_speakers.json"
HAS_SPEAKER_MAP=false

if [ -f "$SPEAKER_MAP_FILE" ]; then
    HAS_SPEAKER_MAP=true
    echo "Using speaker mappings from: $SPEAKER_MAP_FILE"
fi

# Check for jq dependency
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install jq to use this script."
    exit 1
fi

# Obsidian vault paths
OBSIDIAN_VAULT="$HOME/Obsidian/magic"
TRANSCRIPTIONS_DIR="$OBSIDIAN_VAULT/Transcriptions"
OUTPUT_FILE="$TRANSCRIPTIONS_DIR/${MEETING_NAME}.md"

# Create Transcriptions directory if it doesn't exist
mkdir -p "$TRANSCRIPTIONS_DIR"

# Extract metadata from JSON
LANGUAGE=$(jq -r '.metadata.transcription_config.language' "$TRANSCRIPT_JSON")
DURATION=$(jq -r '.job.duration' "$TRANSCRIPT_JSON")
CREATED_AT=$(jq -r '.job.created_at' "$TRANSCRIPT_JSON")
DATA_NAME=$(jq -r '.job.data_name' "$TRANSCRIPT_JSON")

# Convert ISO timestamp to readable format
TRANSCRIPT_DATE=$(date -d "$CREATED_AT" +%Y-%m-%d 2>/dev/null || echo "Unknown")
TRANSCRIPT_TIME=$(date -d "$CREATED_AT" +%H:%M:%S 2>/dev/null || echo "Unknown")

# Create the markdown file with frontmatter
cat > "$OUTPUT_FILE" << EOF
---
date: $TRANSCRIPT_DATE
time: $TRANSCRIPT_TIME
language: $LANGUAGE
duration: ${DURATION}s
audio_file: $DATA_NAME
tags:
  - transcript
---

# Transcript: $MEETING_NAME

**Duration**: ${DURATION} seconds
**Language**: $LANGUAGE
**Generated**: $TRANSCRIPT_DATE at $TRANSCRIPT_TIME

---

## Transcript

EOF

# Process the JSON and format it as a readable transcript
echo "Processing transcript..."

# Use jq to parse the JSON and create a formatted transcript
# If speaker mappings exist, use them; otherwise use default speaker IDs
if [ "$HAS_SPEAKER_MAP" = true ]; then
    # Load speaker mappings and apply them
    jq -r --slurpfile speakermap "$SPEAKER_MAP_FILE" '
      # Extract word-level and punctuation data
      [.results[] | select(.type == "word" or .type == "punctuation")] |

      # Group consecutive words by speaker and format with timestamps
      reduce .[] as $item (
        {current_speaker: null, current_text: "", current_start: 0, lines: []};

        # Get the speaker from alternatives
        ($item.alternatives[0].speaker) as $speaker |
        ($item.alternatives[0].content) as $content |
        ($item.start_time // 0) as $start_time |
        ($item.attaches_to // "none") as $attaches |

        if .current_speaker != $speaker then
          # Speaker changed, output previous line and start new one
          if .current_speaker != null then
            .lines += [{
              speaker: .current_speaker,
              text: .current_text,
              start_time: .current_start
            }]
          else
            .
          end |
          .current_speaker = $speaker |
          .current_text = $content |
          .current_start = $start_time
        else
          # Same speaker, continue building the line
          if $attaches == "previous" then
            .current_text += $content
          else
            .current_text += " " + $content
          end
        end
      ) |

      # Output the last line
      if .current_speaker != null then
        .lines += [{
          speaker: .current_speaker,
          text: .current_text,
          start_time: .current_start
        }]
      else
        .
      end |

      # Format each line with speaker name mapping
      .lines[] |
      # Map speaker ID to name if available
      ($speakermap[0][.speaker] // .speaker) as $speaker_name |
      # Convert seconds to MM:SS format
      (.start_time | floor) as $seconds |
      ($seconds / 60 | floor) as $minutes |
      ($seconds % 60) as $secs |
      "**\($speaker_name)** `\($minutes | tostring | if length == 1 then "0" + . else . end):\($secs | tostring | if length == 1 then "0" + . else . end)` - \(.text)"
    ' "$TRANSCRIPT_JSON" >> "$OUTPUT_FILE"
else
    # No speaker mappings, use default speaker IDs
    jq -r '
      # Extract word-level and punctuation data
      [.results[] | select(.type == "word" or .type == "punctuation")] |

      # Group consecutive words by speaker and format with timestamps
      reduce .[] as $item (
        {current_speaker: null, current_text: "", current_start: 0, lines: []};

        # Get the speaker from alternatives
        ($item.alternatives[0].speaker) as $speaker |
        ($item.alternatives[0].content) as $content |
        ($item.start_time // 0) as $start_time |
        ($item.attaches_to // "none") as $attaches |

        if .current_speaker != $speaker then
          # Speaker changed, output previous line and start new one
          if .current_speaker != null then
            .lines += [{
              speaker: .current_speaker,
              text: .current_text,
              start_time: .current_start
            }]
          else
            .
          end |
          .current_speaker = $speaker |
          .current_text = $content |
          .current_start = $start_time
        else
          # Same speaker, continue building the line
          if $attaches == "previous" then
            .current_text += $content
          else
            .current_text += " " + $content
          end
        end
      ) |

      # Output the last line
      if .current_speaker != null then
        .lines += [{
          speaker: .current_speaker,
          text: .current_text,
          start_time: .current_start
        }]
      else
        .
      end |

      # Format each line
      .lines[] |
      # Convert seconds to MM:SS format
      (.start_time | floor) as $seconds |
      ($seconds / 60 | floor) as $minutes |
      ($seconds % 60) as $secs |
      "**\(.speaker)** `\($minutes | tostring | if length == 1 then "0" + . else . end):\($secs | tostring | if length == 1 then "0" + . else . end)` - \(.text)"
    ' "$TRANSCRIPT_JSON" >> "$OUTPUT_FILE"
fi

echo ""
echo "Transcript formatted successfully!"
echo "Output: $OUTPUT_FILE"

# Return the output file path for the calling script
echo "$OUTPUT_FILE"
