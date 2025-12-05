# @magik/decisions

Decision management types and tools for architectural decision records (ADRs).

## Overview

This package provides:

- **Zod Schema Types**: Type-safe decision structures with validation
- **CLI Tools**: Command-line utilities for working with decisions
- **Confluence Integration**: Upload decisions to Confluence with diagrams

## Types

### Decision Schema

The main `decision` schema includes:

- `problemDefinition`: Description of the problem being solved
- `components`: Affected system components
- `decisionDrivers`: Criteria for evaluating options
- `options`: Possible solutions with descriptions and diagrams
- `evaluationMatrix`: Ratings for each option against each driver
- `proposal`: Chosen solution with reasoning
- `selectedOption`: ID of the selected option
- `confluenceLink`: Optional link to published Confluence page

## Usage

### Importing Types

```typescript
import { decision, decisionOption, evaluationRating } from '@magik/decisions'

// Validate decision data
const result = decision.safeParse(jsonData)
if (result.success) {
  console.log('Valid decision:', result.data)
}
```

### CLI Scripts

All scripts are available via npm scripts or can be run directly:

#### list

List all decisions in the documents/decisions directory recursively:

```bash
bun run list
```

Shows each decision's file path, problem definition, and selected option.

#### validate

Validate a decision JSON file against the Zod schema:

```bash
bun run validate -s ./src/types/decision.ts -e decision -j path/to/decision.json
```

#### convertToConfluenceStorage

Convert a decision JSON to Confluence Storage Format (HTML):

```bash
bun run convert path/to/decision.json
# With Mermaid diagrams as attachments
bun run convert path/to/decision.json --attachments '{"option-id":"diagram.png"}'
```

#### uploadMermaidDiagram

Generate PNG from Mermaid code and upload to Confluence:

```bash
bun run upload-diagram \
  --page-id 12345 \
  --filename my-diagram.png \
  --mermaid "graph LR; A --> B"
```

#### uploadToConfluence

Complete workflow: upload Mermaid diagrams and update Confluence page:

```bash
bun run upload \
  --url "https://confluence.example.com/pages/12345" \
  path/to/decision.json
```

## Environment Variables

Required for Confluence integration:

```bash
JIRA_USERNAME=your.email@example.com
JIRA_TOKEN=your_api_token
```

## Dependencies

- **zod**: Runtime type validation
- **commander**: CLI framework
- **axios**: HTTP client for Confluence API
- **form-data**: Multipart uploads
- **marked**: Markdown parsing
- **glob**: File pattern matching for recursive file search

## License

MIT
