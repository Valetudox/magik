#!/usr/bin/env python3
"""
Live audio recording with real-time Speechmatics transcription.
"""
import sys
import json
import os
import asyncio
import sounddevice as sd
import numpy as np
from queue import Queue
from speechmatics.models import ServerMessageType, AudioSettings, TranscriptionConfig
from speechmatics.client import WebsocketClient


# Audio configuration
SAMPLE_RATE = 48000
CHANNELS = 2
CHUNK_SIZE = 4096

# PulseAudio/PipeWire device name
DEVICE_NAME = "Recording Mix (Mic + System)"


def find_device_index(device_name):
    """Find the index of a device by name."""
    devices = sd.query_devices()
    for i, device in enumerate(devices):
        if device_name in device['name']:
            return i
    return None


async def record_and_transcribe(api_key, language, jsonl_file, markdown_file):
    """Record audio and transcribe in real-time."""

    # Find the device
    device_index = find_device_index(DEVICE_NAME)
    if device_index is None:
        print(f"Error: Device '{DEVICE_NAME}' not found")
        print("\nAvailable devices:")
        print(sd.query_devices())
        sys.exit(1)

    device_info = sd.query_devices(device_index)
    print(f"Using device: {device_info['name']}")
    print("Recording started...")

    # Queue for audio chunks
    audio_queue = Queue()

    # Audio callback
    def audio_callback(indata, frames, time, status):
        if status:
            print(f"Audio status: {status}")
        # Convert to bytes (float32 little-endian)
        audio_queue.put(indata.copy().tobytes())

    # Audio settings for Speechmatics
    audio_settings = AudioSettings(
        encoding="pcm_f32le",
        sample_rate=SAMPLE_RATE,
        chunk_size=CHUNK_SIZE
    )

    # Transcription config
    transcription_config = TranscriptionConfig(
        language=language,
        enable_partials=True,
        max_delay=2.0
    )

    # Create client with auth token
    ws = WebsocketClient(api_key)

    # Track last transcript to avoid duplicates in markdown
    last_transcript = ""

    # Open both output files
    with open(jsonl_file, 'w') as jf, open(markdown_file, 'w') as mf:
        # Write markdown header
        mf.write(f"# Live Transcription\n\n")
        mf.write(f"**Language:** {language}\n\n")
        mf.write("---\n\n")
        mf.flush()

        # Event handlers
        def on_message(message):
            """Handle all messages from Speechmatics."""
            nonlocal last_transcript

            # Write raw JSON to JSONL file
            json.dump(message, jf)
            jf.write('\n')
            jf.flush()

            # Extract and write to markdown (only final transcripts, not partials)
            if message.get('message') == 'AddTranscript':
                transcript = message.get('metadata', {}).get('transcript', '')
                if transcript and transcript != last_transcript:
                    # Format with timestamp
                    start_time = message.get('metadata', {}).get('start_time', 0)
                    minutes = int(start_time // 60)
                    seconds = int(start_time % 60)

                    mf.write(f"**{minutes:02d}:{seconds:02d}** {transcript}\n\n")
                    mf.flush()
                    last_transcript = transcript

        # Add event handlers for all message types
        ws.add_event_handler(ServerMessageType.AddTranscript, on_message)
        ws.add_event_handler(ServerMessageType.AddPartialTranscript, on_message)

        # Create a file-like stream from the queue
        class AudioStream:
            def read(self, size=-1):
                """Read from the audio queue, blocking if necessary."""
                # Block until data is available
                return audio_queue.get(block=True)

        audio_stream = AudioStream()

        # Start audio recording
        stream = sd.InputStream(
            device=device_index,
            channels=CHANNELS,
            samplerate=SAMPLE_RATE,
            callback=audio_callback,
            blocksize=CHUNK_SIZE,
            dtype=np.float32
        )

        try:
            with stream:
                # Run the WebSocket client
                await ws.run(
                    audio_stream,
                    transcription_config,
                    audio_settings
                )
        except KeyboardInterrupt:
            print("\nStopping...")


def main():
    if len(sys.argv) != 5:
        print("Usage: recordLive.py <meeting_name> <language> <jsonl_file> <markdown_file>")
        sys.exit(1)

    meeting_name = sys.argv[1]
    language = sys.argv[2]
    jsonl_file = sys.argv[3]
    markdown_file = sys.argv[4]

    # Get API key from environment
    api_key = os.getenv('SPEECHMATICS_API_KEY')
    if not api_key:
        print("Error: SPEECHMATICS_API_KEY environment variable not set")
        sys.exit(1)

    # Run async recording
    try:
        asyncio.run(record_and_transcribe(api_key, language, jsonl_file, markdown_file))
    except KeyboardInterrupt:
        print("\nRecording stopped.")


if __name__ == "__main__":
    main()
