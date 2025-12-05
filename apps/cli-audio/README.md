# Magik CLI Audio

Audio recording and transcription CLI tool with Obsidian integration.

## Description

Magik is a powerful command-line tool for recording audio, transcribing it with real-time capabilities, and integrating with Obsidian for note-taking.

## Features

- **Audio Recording**: Record audio to WAV files
- **Real-time Transcription**: Live transcription using Speechmatics
- **Obsidian Integration**: Automatic note creation in Obsidian
- **Meeting Management**: Rename, delete, and organize meetings
- **Knowledge Base**: AI-powered Q&A about meeting transcripts using Gemini
- **Speaker Detection**: Setup and manage speaker names in transcripts

## Installation

From the root of the repository:

```bash
bun install
```

## Usage

```bash
# Run from root
bun run start

# Or using workspace filter
bun run dev

# Or directly
bun run apps/cli-audio/src/index.ts
```

## Available Commands

### record

Record audio to WAV file (processing handled by Airflow DAG).

```bash
bun run start record
```

### record-live

Record audio with real-time transcription using Speechmatics.

```bash
bun run start record-live
```

### rename

Rename a meeting and all related files.

```bash
bun run start rename
```

### setup-speakers

Setup speaker names for a meeting transcription.

```bash
bun run start setup-speakers
```

### knowledge-base

Ask questions about your meeting transcripts using AI.

```bash
bun run start knowledge-base
```

### delete-meeting

Delete a meeting and all related files.

```bash
bun run start delete-meeting
```

## Environment Variables

Create a `.env` file in the root directory with:

```bash
# Speechmatics API
SPEECHMATICS_API_KEY=your_api_key_here

# Google Gemini API
GOOGLE_API_KEY=your_google_api_key_here

# Confluence (for decision tools)
JIRA_USERNAME=your_username
JIRA_TOKEN=your_api_token

# File paths
RECORDINGS_DIR=/path/to/recordings
OBSIDIAN_DIR=/path/to/obsidian/vault
```

## Project Structure

```
apps/cli-audio/
├── src/
│   ├── commands/         # CLI command implementations
│   │   ├── record.ts
│   │   ├── recordLive.ts
│   │   ├── rename.ts
│   │   ├── setupSpeakers.ts
│   │   ├── knowledgeBase.ts
│   │   └── deleteMeeting.ts
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   │   ├── paths.ts
│   │   ├── recent-meetings.ts
│   │   └── ...
│   └── index.ts        # Main CLI entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- **@speechmatics/real-time-client**: Real-time speech recognition
- **commander**: CLI framework
- **inquirer**: Interactive CLI prompts
- **axios**: HTTP client
- **marked**: Markdown parser
- **mic**: Microphone access
- **wav**: WAV file handling

## Development

This app is part of the Magik monorepo. It can reference shared packages using the workspace protocol:

```typescript
import { decision } from '@magik/types'
import { getPaths } from '@magik/shared'
```

## Related Packages

- Decision management: `packages/decisions/`
- Audio processing: `packages/audio/`
- Transcription: `packages/transcription/`
- Gemini integration: `packages/gemini/`
- Obsidian integration: `packages/obsidian/`
- Meeting management: `packages/meeting/`

## License

MIT
