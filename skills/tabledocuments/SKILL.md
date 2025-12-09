---
name: tabledocuments
description: MUST use it for handling table document related tasks
---

# Table Documents Management

A comprehensive toolkit for creating, validating, and publishing structured table documents with Mermaid diagrams to Confluence.

## Overview

This skill provides scripts for managing table documents through their entire lifecycle:

- **Create & Validate** table documents using type-safe schemas
- **Convert** table documents to Confluence-compatible table format
- **Generate & Upload** Mermaid diagrams as images for each row
- **Publish** complete tables to Confluence pages

## Scripts

### `tableDocument.ts` - Type Definitions

Zod schemas for table document structure with validation.

**Key Types**:

- `tableDocument` - Main document schema with confluence_url and table array
- `tableRow` - Schema for a single table row with use_case, diagram, required_context, required_tools, output

---

### `validate.ts` - Validate Table Document JSON

Validate a table document JSON file against the Zod schema.

```bash
bun run validate.ts \
  --schema ./tableDocument.ts \
  --export tableDocument \
  --json /path/to/document.json
```

**Parameters**:

- `--schema` - Path to TypeScript file with Zod schema
- `--export` - Name of exported schema (e.g., "tableDocument")
- `--json` - Path to JSON file to validate

**Output**:

```
✅ Validation successful!

Validated data:
{
  "confluence_url": "...",
  "table": [...]
}
```

**Use when**:

- Creating a new table document
- Verifying document structure before publishing
- Debugging validation errors

---

### `convertToConfluenceStorage.ts` - Convert to HTML Table

Convert table document JSON to Confluence Storage Format (HTML table).

```bash
bun run convertToConfluenceStorage.ts document.json
```

**With Mermaid diagrams as attachments**:

```bash
bun run convertToConfluenceStorage.ts document.json \
  --attachments '{"0":"diagram-0.png","1":"diagram-1.png"}'
```

**Parameters**:

- `<json-file>` - Path to table document JSON
- `--attachments` - JSON map of row indices to attachment filenames

**Output**: HTML table in Confluence Storage Format (to stdout)

**Table Structure**:

- **Columns**: Use Case | Diagram | Required Context | Required Tools | Output
- **Rows**: One row per entry in the table array
- **Lists**: required_context and required_tools are rendered as bullet lists

**Use when**:

- Previewing how a table will look in Confluence
- Generating HTML for manual upload
- Testing formatting before publishing

---

### `uploadMermaidDiagram.ts` - Upload Diagram

Generate PNG from Mermaid code and upload to Confluence.

```bash
bun run uploadMermaidDiagram.ts \
  --page-id 12345 \
  --filename diagram-0.png \
  --mermaid "graph TD; A[Start] --> B[End]"
```

**Parameters**:

- `--page-id` - Confluence page ID
- `--filename` - Filename for the attachment
- `--mermaid` - Mermaid diagram code
- `--title` - Optional title/description

**Output**: JSON with attachment details

**Requirements**:

- `mmdc` CLI tool installed (`npm install -g @mermaid-js/mermaid-cli`)
- `JIRA_USERNAME` and `JIRA_TOKEN` environment variables

**Use when**:

- Uploading diagrams separately
- Testing diagram rendering
- Updating diagrams without republishing entire document

---

### `uploadToConfluence.ts` - Complete Publishing Workflow

End-to-end workflow: validate, upload diagrams, convert to HTML table, and publish to Confluence.

```bash
bun run uploadToConfluence.ts \
  --url "https://emarsys.jira.com/wiki/spaces/.../pages/12345" \
  document.json
```

**Parameters**:

- `--url` - Full Confluence page URL
- `<json-file>` - Path to table document JSON

**What it does**:

1. Validates the table document JSON against schema
2. Extracts page ID from URL
3. Fetches current page version
4. Uploads all Mermaid diagrams as PNG attachments (one per row)
5. Converts document to Confluence HTML table format
6. Updates the Confluence page with new content

**Requirements**:

- `JIRA_USERNAME` and `JIRA_TOKEN` environment variables
- `mmdc` CLI tool for Mermaid diagrams

**Output**:

```
Extracting page ID from: https://...
✓ Page ID: 12345
Fetching current page...
✓ Current page: My Table Document (version 5)
Processing Mermaid diagrams...
  Processing Mermaid diagram for row 1: Add a hero image block...
  ✓ Uploaded: diagram-0.png
  Processing Mermaid diagram for row 2: Update the CTA button...
  ✓ Uploaded: diagram-1.png
✓ Uploaded 2 diagram(s)
Converting table document to Confluence storage format...
Updating Confluence page...
✅ Successfully updated: My Table Document
   Version: 6
   URL: https://...
```

**Use when**:

- Publishing a complete table document to Confluence
- Updating an existing table document page
- Automating documentation workflow

---

## Common Workflows

### 1. Creating a New Table Document

**Step 1: Create JSON file**

```json
{
  "confluence_url": "https://emarsys.jira.com/wiki/spaces/.../pages/12345",
  "table": [
    {
      "use_case": "Add a hero image block at the top of the email",
      "diagram": "graph TD\\n    A[User Request] --> B[Parse Intent]\\n    B --> C[Insert Block]",
      "required_context": [
        "Email template structure",
        "Available block types"
      ],
      "required_tools": [
        "Block Insertion Tool",
        "Preview Tool (image & HTML)"
      ],
      "output": "Updated email template with hero image block inserted"
    }
  ]
}
```

**Step 2: Validate**

```bash
bun run validate.ts \
  --schema ./tableDocument.ts \
  --export tableDocument \
  --json my-document.json
```

**Step 3: Publish to Confluence**

```bash
bun run uploadToConfluence.ts \
  --url "https://emarsys.jira.com/wiki/spaces/.../pages/12345" \
  my-document.json
```

---

### 2. Updating an Existing Table Document

**Step 1: Modify JSON file**

- Add/remove rows from the table array
- Update use cases, diagrams, or other fields

**Step 2: Validate changes**

```bash
bun run validate.ts --schema ./tableDocument.ts --export tableDocument --json my-document.json
```

**Step 3: Republish**

```bash
bun run uploadToConfluence.ts \
  --url "https://emarsys.jira.com/wiki/spaces/.../pages/12345" \
  my-document.json
```

The script will:

- Detect existing diagrams and update them
- Increment the page version
- Preserve the page URL

---

### 3. Previewing Before Publishing

**Generate HTML locally**:

```bash
bun run convertToConfluenceStorage.ts my-document.json > preview.html
```

Then open `preview.html` in a browser to see how the table will look.

---

## Document Structure

### JSON Schema

```typescript
{
  confluence_url: string,  // Full Confluence page URL
  table: [                 // Array of table rows
    {
      use_case: string,              // Description of the use case
      diagram: string,               // Mermaid diagram code
      required_context: string[],    // List of required context
      required_tools: string[],      // List of required tools
      output: string                 // Output description
    }
  ]
}
```

### Confluence Table Output

The generated Confluence table has these columns:

1. **Use Case** - The use case description
2. **Diagram** - Rendered Mermaid diagram as image (400px width)
3. **Required Context** - Bullet list of context items
4. **Required Tools** - Bullet list of required tools
5. **Output** - Output description

---

## Environment Setup

### Required Environment Variables

```bash
# Confluence Authentication
export JIRA_USERNAME="your.email@example.com"
export JIRA_TOKEN="your_api_token"
```

### Required Tools

```bash
# Mermaid CLI (for diagram generation)
npm install -g @mermaid-js/mermaid-cli

# Verify installation
mmdc --version
```

### Getting Confluence API Token

1. Go to https://id.atlassian.com/manage/api-tokens
2. Click "Create API token"
3. Give it a name (e.g., "Table Document Scripts")
4. Copy the token and save it securely
5. Add to your environment variables

---

## Integration Patterns

### With Git Workflow

```bash
# 1. Create document branch
git checkout -b docs/agentic-use-cases

# 2. Create and validate document
vim documents/agentic-use-cases.json
bun run validate.ts --schema ./tableDocument.ts --export tableDocument --json documents/agentic-use-cases.json

# 3. Publish to Confluence
bun run uploadToConfluence.ts --url "https://confluence.../12345" documents/agentic-use-cases.json

# 4. Commit and create PR
git add documents/agentic-use-cases.json
git commit -m "Add agentic use cases documentation"
```

---

## Examples

### Example 1: Email Use Cases Table

```json
{
  "confluence_url": "https://emarsys.jira.com/wiki/spaces/.../pages/6016270341",
  "table": [
    {
      "use_case": "Add a hero image block at the top of the email with the summer sale banner",
      "diagram": "graph TD\\n    A[User Request] --> B[Parse Intent]\\n    B --> C[Identify Block Type]\\n    C --> D[Get Hero Image Assets]\\n    D --> E[Insert Block at Position]",
      "required_context": [
        "Email template structure",
        "Available block types",
        "Asset library with summer sale banner"
      ],
      "required_tools": [
        "Email template editor API",
        "Asset management system",
        "Block insertion tool"
      ],
      "input": "Natural language request: 'Add a hero image block at the top of the email with the summer sale banner'",
      "output": "Updated email template with hero image block inserted at position 0"
    },
    {
      "use_case": "Set the loyalty block to only show for customers in the Gold segment",
      "diagram": "graph TD\\n    A[User Request] --> B[Identify Loyalty Block]\\n    B --> C[Parse Segment Condition]\\n    C --> D[Create Visibility Rule]",
      "required_context": [
        "Available customer segments",
        "Loyalty block identifier",
        "Visibility rule syntax"
      ],
      "required_tools": [
        "Block selector",
        "Segment filter builder",
        "Rule engine"
      ],
      "output": "Loyalty block configured with visibility rule: segment == 'Gold'"
    }
  ]
}
```

---

This skill enables a complete table documentation workflow from creation through publication, with strong validation and visual documentation support via Mermaid diagrams.
