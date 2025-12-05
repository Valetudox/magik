#!/usr/bin/env python3
"""
Upload meeting transcript to Gemini File Search store.
Non-interactive CLI tool that takes arguments and exits.

Usage: python upload_transcript.py --file <path> --name <meeting_name>
"""

import argparse
import os
import sys
import time
from pathlib import Path

try:
    from google import genai
except ImportError:
    print("Error: google-genai package not installed", file=sys.stderr)
    print("Run: uv sync", file=sys.stderr)
    sys.exit(1)


STORE_DISPLAY_NAME = "meeting_transcripts"


def get_or_create_store(client):
    """Get existing store or create new one."""
    # Try to find existing store
    try:
        for store in client.file_search_stores.list():
            if hasattr(store, 'display_name') and store.display_name == STORE_DISPLAY_NAME:
                return store
    except Exception as e:
        print(f"Warning: Could not list stores: {e}", file=sys.stderr)

    # Create new store if not found
    try:
        store = client.file_search_stores.create(
            config={'display_name': STORE_DISPLAY_NAME}
        )
        return store
    except Exception as e:
        print(f"Error creating store: {e}", file=sys.stderr)
        raise


def upload_transcript(file_path: str, meeting_name: str):
    """Upload transcript to Gemini File Search store."""
    # Validate file exists
    if not Path(file_path).exists():
        print(f"Error: File not found: {file_path}", file=sys.stderr)
        sys.exit(1)

    # Get API key
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY environment variable not set", file=sys.stderr)
        print("Get your API key from: https://aistudio.google.com/apikey", file=sys.stderr)
        sys.exit(1)

    try:
        # Initialize client
        client = genai.Client(api_key=api_key)

        # Get or create store
        store = get_or_create_store(client)

        # Debug: check what store object we got
        if isinstance(store, str):
            store_name = store
        elif hasattr(store, 'name'):
            store_name = store.name
        else:
            print(f"Error: Unexpected store object type: {type(store)}", file=sys.stderr)
            sys.exit(1)

        # Upload file (automatic chunking)
        # Note: This is asynchronous - file will be indexed in the background
        client.file_search_stores.upload_to_file_search_store(
            file=file_path,
            file_search_store_name=store_name,
            config={
                'display_name': meeting_name,
                'custom_metadata': [
                    {"key": "meeting_name", "string_value": meeting_name},
                    {"key": "type", "string_value": "meeting_transcript"}
                ]
            }
        )

        # Success - file is uploaded and will be indexed shortly
        print(f"Transcript '{meeting_name}' uploaded successfully to knowledge base")
        print("Note: Indexing happens in the background and may take a few minutes")
        sys.exit(0)

    except Exception as e:
        import traceback
        print(f"Error: {e}", file=sys.stderr)
        print("\nFull traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Upload meeting transcript to Gemini File Search"
    )
    parser.add_argument(
        "--file",
        required=True,
        help="Path to transcript markdown file"
    )
    parser.add_argument(
        "--name",
        required=True,
        help="Meeting name"
    )

    args = parser.parse_args()
    upload_transcript(args.file, args.name)


if __name__ == "__main__":
    main()
