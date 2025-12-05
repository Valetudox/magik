#!/bin/bash

# Script to transcribe audio using Speechmatics with speaker diarization
# Usage: ./transcribeAudio.sh <input_file.mp3> <language_code>
# Output: Creates <input_file>_transcript.json in the same directory

if [ $# -ne 2 ]; then
    echo "Usage: $0 <input_file.mp3> <language_code>"
    echo "Example: $0 recording.mp3 en"
    echo "Common language codes: en (English), es (Spanish), fr (French), de (German), it (Italian)"
    exit 1
fi

MP3_FILE="$1"
LANGUAGE="$2"

# Check if input file exists
if [ ! -f "$MP3_FILE" ]; then
    echo "Error: File '$MP3_FILE' not found"
    exit 1
fi

# Validate file extension
if [[ ! "$MP3_FILE" =~ \.mp3$ ]]; then
    echo "Error: Input file must have .mp3 extension"
    exit 1
fi

# Check for required dependencies
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed. Please install curl to use this script."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install jq to use this script."
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  Arch Linux: sudo pacman -S jq"
    echo "  macOS: brew install jq"
    exit 1
fi

# Check if API key is set
if [ -z "$SPEECHMATICS_API_KEY" ]; then
    echo "Error: SPEECHMATICS_API_KEY environment variable is not set."
    echo "Please set it in your shell profile (~/.bashrc or ~/.zshrc):"
    echo "  export SPEECHMATICS_API_KEY=\"your_api_key_here\""
    exit 1
fi

# Generate transcript filename (same name, add _transcript.json)
TRANSCRIPT_FILE="${MP3_FILE%.mp3}_transcript.json"

echo "Uploading to Speechmatics for transcription..."
echo "Input:    $MP3_FILE"
echo "Language: $LANGUAGE"
echo "Output:   $TRANSCRIPT_FILE"

# Submit job with diarization enabled
RESPONSE=$(curl -s -L -X POST 'https://asr.api.speechmatics.com/v2/jobs' \
    -H "Authorization: Bearer $SPEECHMATICS_API_KEY" \
    -F "data_file=@$MP3_FILE" \
    -F "config={\"type\":\"transcription\",\"transcription_config\":{\"language\":\"$LANGUAGE\",\"diarization\":\"speaker\"}}")

# Extract job ID
JOB_ID=$(echo "$RESPONSE" | jq -r '.id')

if [ "$JOB_ID" = "null" ] || [ -z "$JOB_ID" ]; then
    echo "Error: Failed to submit job to Speechmatics"
    echo "Response: $RESPONSE"
    exit 1
fi

echo "Job submitted successfully. Job ID: $JOB_ID"
echo "Waiting for transcription to complete..."

# Poll for job completion
while true; do
    STATUS_RESPONSE=$(curl -s -X GET "https://asr.api.speechmatics.com/v2/jobs/$JOB_ID" \
        -H "Authorization: Bearer $SPEECHMATICS_API_KEY")

    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.job.status')

    if [ "$STATUS" = "done" ]; then
        echo "Transcription completed!"
        break
    elif [ "$STATUS" = "rejected" ] || [ "$STATUS" = "deleted" ]; then
        echo "Error: Job was $STATUS"
        exit 1
    fi

    # Wait 1 second before polling again
    sleep 1
done

# Retrieve transcript
echo "Downloading transcript..."
curl -s -X GET "https://asr.api.speechmatics.com/v2/jobs/$JOB_ID/transcript" \
    -H "Authorization: Bearer $SPEECHMATICS_API_KEY" \
    -o "$TRANSCRIPT_FILE"

if [ -f "$TRANSCRIPT_FILE" ]; then
    echo "Transcript saved to: $TRANSCRIPT_FILE"
    exit 0
else
    echo "Error: Failed to download transcript"
    exit 1
fi
