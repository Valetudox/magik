#!/bin/bash

# Script to convert WAV file to MP3
# Usage: ./convertToMp3.sh <input_file.wav>
# Output: Creates <input_file>.mp3 in the same directory

if [ $# -ne 1 ]; then
    echo "Usage: $0 <input_file.wav>"
    exit 1
fi

WAV_FILE="$1"

# Check if input file exists
if [ ! -f "$WAV_FILE" ]; then
    echo "Error: File '$WAV_FILE' not found"
    exit 1
fi

# Validate file extension
if [[ ! "$WAV_FILE" =~ \.wav$ ]]; then
    echo "Error: Input file must have .wav extension"
    exit 1
fi

# Generate MP3 filename (same name, different extension)
MP3_FILE="${WAV_FILE%.wav}.mp3"

echo "Converting WAV to MP3..."
echo "Input:  $WAV_FILE"
echo "Output: $MP3_FILE"

# Convert WAV to MP3 using ffmpeg
if ffmpeg -i "$WAV_FILE" -codec:a libmp3lame -qscale:a 2 "$MP3_FILE" -y 2>/dev/null; then
    echo "Conversion successful!"
    echo "MP3 file saved to: $MP3_FILE"
    exit 0
else
    echo "Error: Conversion failed"
    exit 1
fi
