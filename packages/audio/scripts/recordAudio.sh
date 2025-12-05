#!/bin/bash

# Script to record audio to a WAV file
# Usage: ./recordAudio.sh <output_filename.wav>

if [ $# -ne 1 ]; then
    echo "Usage: $0 <output_filename.wav>"
    exit 1
fi

OUTPUT_FILE="$1"

# Validate file extension
if [[ ! "$OUTPUT_FILE" =~ \.wav$ ]]; then
    echo "Error: Output file must have .wav extension"
    exit 1
fi

# Get the directory of the output file
OUTPUT_DIR=$(dirname "$OUTPUT_FILE")

# Create directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Recording to: $OUTPUT_FILE"
echo "Press Ctrl+C to stop recording"

# Check if parecord is available (Linux/PulseAudio)
if command -v parecord &> /dev/null; then
    # Start recording from rec_mix.monitor device (silently in background mode)
    parecord --device=rec_mix.monitor --rate=48000 --channels=2 --format=float32le "$OUTPUT_FILE" 2>/dev/null
# Check if rec (SoX) is available (macOS)
elif command -v rec &> /dev/null; then
    # Record using SoX with equivalent settings from BlackHole 2ch device
    # -t coreaudio: CoreAudio driver, -r 48000: sample rate, -c 2: stereo, -b 32: 32-bit, -e floating-point: float32
    rec -t coreaudio "BlackHole 2ch" -r 48000 -c 2 -b 32 -e floating-point "$OUTPUT_FILE" 2>/dev/null
else
    echo "Error: Neither parecord (PulseAudio) nor rec (SoX) found."
    echo "Please install PulseAudio (Linux) or SoX (macOS: brew install sox)"
    exit 1
fi

echo "Recording stopped. File saved to: $OUTPUT_FILE"
