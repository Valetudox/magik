#!/usr/bin/env python3
"""
Delete meeting transcript from Gemini File Search store.
Non-interactive CLI tool that takes arguments and exits.

Usage: python delete_transcript.py --name <meeting_name>
"""

import argparse
import os
import sys

try:
    from google import genai
except ImportError:
    print("Error: google-genai package not installed", file=sys.stderr)
    print("Run: uv sync", file=sys.stderr)
    sys.exit(1)


STORE_DISPLAY_NAME = "meeting_transcripts"


def get_store(client):
    """Get existing store."""
    try:
        for store in client.file_search_stores.list():
            if hasattr(store, 'display_name') and store.display_name == STORE_DISPLAY_NAME:
                return store
    except Exception as e:
        print(f"Warning: Could not list stores: {e}", file=sys.stderr)
        return None

    return None


def delete_transcript(meeting_name: str):
    """Delete transcript from Gemini File Search store."""
    # Get API key
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY environment variable not set", file=sys.stderr)
        print("Get your API key from: https://aistudio.google.com/apikey", file=sys.stderr)
        sys.exit(1)

    try:
        # Initialize client
        client = genai.Client(api_key=api_key)

        # Get store
        store = get_store(client)

        if not store:
            print(f"Warning: Store '{STORE_DISPLAY_NAME}' not found", file=sys.stderr)
            sys.exit(0)

        # Get store name
        if isinstance(store, str):
            store_name = store
        elif hasattr(store, 'name'):
            store_name = store.name
        else:
            print(f"Error: Unexpected store object type: {type(store)}", file=sys.stderr)
            sys.exit(1)

        # List files in the store and find matching meeting
        deleted_count = 0
        try:
            for file in client.file_search_stores.list_files(file_search_store_name=store_name):
                # Check if display_name matches
                if hasattr(file, 'display_name') and file.display_name == meeting_name:
                    # Delete the file
                    if hasattr(file, 'name'):
                        client.files.delete(name=file.name)
                        print(f"✓ Deleted from Knowledge base: {meeting_name}")
                        deleted_count += 1
        except Exception as e:
            print(f"Error listing or deleting files: {e}", file=sys.stderr)

        if deleted_count == 0:
            print(f"No transcript found in Gemini for meeting: {meeting_name}", file=sys.stderr)

        sys.exit(0)

    except Exception as e:
        import traceback
        print(f"Error: {e}", file=sys.stderr)
        print("\nFull traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Delete meeting transcript from Gemini File Search"
    )
    parser.add_argument(
        "--name",
        required=True,
        help="Meeting name"
    )

    args = parser.parse_args()
    delete_transcript(args.name)


if __name__ == "__main__":
    main()
