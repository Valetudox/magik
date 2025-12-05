#!/usr/bin/env python3
"""
Query Gemini File Search knowledge base with a question.
Non-interactive CLI tool that takes a question and outputs the answer.

Usage: python query_knowledge_base.py --question "Your question here"
"""

import argparse
import os
import sys

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Error: google-genai package not installed", file=sys.stderr)
    print("Run: uv sync", file=sys.stderr)
    sys.exit(1)


STORE_DISPLAY_NAME = "meeting_transcripts"


def get_store(client):
    """Get the meeting transcripts store."""
    for store in client.file_search_stores.list():
        if store.display_name == STORE_DISPLAY_NAME:
            return store

    print(f"Error: Store '{STORE_DISPLAY_NAME}' not found", file=sys.stderr)
    print("Please upload at least one transcript first", file=sys.stderr)
    sys.exit(1)


def query_knowledge_base(question: str):
    """Query the knowledge base with a question."""
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

        # Extract store name (handle both string and object)
        if isinstance(store, str):
            store_name = store
        elif hasattr(store, 'name'):
            store_name = store.name
        else:
            print(f"Error: Unexpected store type: {type(store)}", file=sys.stderr)
            sys.exit(1)

        # Query with File Search
        # Note: Use gemini-2.5-flash as it supports File Search
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=question,
            config=types.GenerateContentConfig(
                tools=[
                    types.Tool(
                        file_search=types.FileSearch(
                            file_search_store_names=[store_name]
                        )
                    )
                ]
            )
        )

        # Output answer
        print(response.text)
        print()

        # Output grounding and citations
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                grounding_metadata = candidate.grounding_metadata

                # Show grounding supports (which parts of answer are supported by which citations)
                if hasattr(grounding_metadata, 'grounding_supports') and grounding_metadata.grounding_supports:
                    print("Grounding:")
                    for support in grounding_metadata.grounding_supports:
                        if hasattr(support, 'segment') and support.segment:
                            segment_text = support.segment.text if hasattr(support.segment, 'text') else ''
                            indices = support.grounding_chunk_indices if hasattr(support, 'grounding_chunk_indices') else []

                            if indices:
                                # Convert to 1-based indices for display
                                citation_nums = [str(i + 1) for i in indices]
                                print(f'→ "{segment_text}" [Citations {", ".join(citation_nums)}]')
                    print()

                # Check if we have grounding chunks
                if hasattr(grounding_metadata, 'grounding_chunks') and grounding_metadata.grounding_chunks:
                    chunks = grounding_metadata.grounding_chunks

                    print("Citations:")
                    print()

                    # Deduplicate citations by text content
                    seen_texts = {}
                    for i, chunk in enumerate(chunks, 1):
                        if hasattr(chunk, 'retrieved_context') and chunk.retrieved_context:
                            context = chunk.retrieved_context
                            title = context.title if hasattr(context, 'title') else 'Unknown'
                            text = context.text if hasattr(context, 'text') else ''

                            # Check if we've seen this exact text before
                            if text in seen_texts:
                                # Add this index to the existing citation
                                seen_texts[text]['indices'].append(i)
                                continue

                            # New unique citation
                            seen_texts[text] = {'title': title, 'indices': [i]}

                    # Output unique citations
                    for text, info in seen_texts.items():
                        indices_str = ', '.join(str(i) for i in info['indices'])
                        print(f"Citation {indices_str} ({info['title']}):")

                        # Format the text for better readability (keep speaker format)
                        print(text)
                        print()

        sys.exit(0)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Query Gemini File Search knowledge base"
    )
    parser.add_argument(
        "--question",
        required=True,
        help="Question to ask about the meeting transcripts"
    )

    args = parser.parse_args()
    query_knowledge_base(args.question)


if __name__ == "__main__":
    main()
