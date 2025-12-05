# Gemini File Search Integration

This directory contains scripts for integrating Google Gemini File Search API with meeting transcripts.

## Features

- **Automatic Upload**: Transcripts are automatically uploaded to Gemini after recording
- **Knowledge Base Q&A**: Ask questions about all your meeting transcripts using AI
- **Semantic Search**: Find relevant information across all meetings
- **Citations**: Answers include references to source documents

## Prerequisites

### 1. Install uv (Python Package Manager)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Get Google API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Set the environment variable:

```bash
export GOOGLE_API_KEY="your_api_key_here"
```

Add this to your `~/.bashrc` or `~/.zshrc` to make it permanent:

```bash
echo 'export GOOGLE_API_KEY="your_api_key_here"' >> ~/.bashrc
source ~/.bashrc
```

### 3. Install Python Dependencies

From the project root:

```bash
cd scripts/gemini
uv sync
```

## Usage

### Automatic Upload (Happens During Recording)

When you record a meeting using `magik record`, the transcript is automatically uploaded to the Gemini knowledge base after transcription completes.

### Interactive Q&A

Ask questions about your meeting transcripts:

```bash
magik knowledge-base
```

Or select "💬 Knowledge base Q&A" from the interactive menu when running `magik` without arguments.

Example questions:

- "What action items were discussed?"
- "Who talked about the budget?"
- "Summarize the decisions made in the last meeting"
- "What topics did John mention?"

### Manual Upload (If Needed)

To manually upload a transcript:

```bash
./scripts/gemini/uploadTranscript.sh /path/to/transcript.md "meeting_name"
```

Or directly with Python:

```bash
uv run scripts/gemini/upload_transcript.py --file /path/to/transcript.md --name "meeting_name"
```

### Direct Query (Non-Interactive)

To query without the interactive loop:

```bash
uv run scripts/gemini/query_knowledge_base.py --question "What were the main topics?"
```

## How It Works

### File Search Store

All transcripts are uploaded to a single Gemini File Search store called "meeting_transcripts". This allows you to search across all meetings at once.

### Chunking Strategy

Transcripts use automatic chunking provided by Gemini File Search, which is optimized for document structure and content.

### Metadata

Each uploaded transcript includes metadata:

- Meeting name
- Document type (meeting_transcript)
- Custom metadata (if provided)

### Model

Uses `gemini-2.5-flash` for fast, cost-effective responses.

## Troubleshooting

### "GOOGLE_API_KEY not set"

Make sure you've exported the API key:

```bash
export GOOGLE_API_KEY="your_key_here"
```

### "google-genai package not installed"

Install dependencies:

```bash
cd scripts/gemini
uv sync
```

### "Store 'meeting_transcripts' not found"

Upload at least one transcript first by running `magik record` or manually uploading a transcript.

### Upload Timeout

If uploads are timing out, the transcript file may be too large (>100MB). Consider splitting large files.

## Cost Information

- **Indexing**: ~$0.15 per 1 million tokens (one-time at upload)
- **Storage**: FREE
- **Queries**: Standard Gemini API rates

Example: A 50-page transcript (~25,000 tokens) costs approximately $0.00375 to index.

## Files

- `pyproject.toml` - Python dependencies (uv)
- `upload_transcript.py` - Upload transcript to Gemini (CLI tool)
- `query_knowledge_base.py` - Query knowledge base (CLI tool)
- `uploadTranscript.sh` - Bash wrapper for upload script

## Resources

- [Gemini File Search Documentation](https://ai.google.dev/gemini-api/docs/file-search)
- [Google AI Studio](https://aistudio.google.com/)
- [uv Documentation](https://docs.astral.sh/uv/)
