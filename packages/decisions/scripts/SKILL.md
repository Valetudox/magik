---
name: decisiondocuments
description: MUST use it for handling decision document related tasks
---

# Decision Documents Management

A comprehensive toolkit for creating, validating, and publishing architectural decision records (ADRs) to Confluence.

## Overview

This skill provides scripts for managing decision documents through their entire lifecycle:

- **Create & Validate** decisions using type-safe schemas
- **Convert** decisions to Confluence-compatible format
- **Generate & Upload** Mermaid diagrams as images
- **Publish** complete decisions to Confluence pages
- **List & Browse** all decisions in the repository

## Scripts

### `decision.ts` - Type Definitions

Zod schemas for decision structure with validation.

**Key Types**:

- `decision` - Main decision schema with all fields
- `decisionOption` - An option being evaluated
- `decisionDriver` - A criterion for evaluation
- `evaluationRecord` - Rating for an option/driver pair

### `list.ts` - Browse Decisions

List all decisions in the repository.

```bash
bun run list.ts
```

**Output**:

```
2025-11-21_BMW-design-sprint/multilanguage-campaign-variants.json
  Currently, customers creating multilanguage campaigns must...
  → Email Domain with Content Variants

Total: 12 decisions
```

**Use when**:

- Getting an overview of all decisions
- Finding a specific decision file
- Checking decision status

---

### `validate.ts` - Validate Decision JSON

Validate a decision JSON file against the Zod schema.

```bash
bun run validate.ts \
  --schema ./decision.ts \
  --export decision \
  --json /path/to/decision.json
```

**Parameters**:

- `--schema` - Path to TypeScript file with Zod schema
- `--export` - Name of exported schema (e.g., "decision")
- `--json` - Path to JSON file to validate

**Output**:

```
✅ Validation successful!

Validated data:
{
  "problemDefinition": "...",
  "options": [...],
  ...
}
```

**Use when**:

- Creating a new decision document
- Verifying decision structure before publishing
- Debugging validation errors

---

### `convertToConfluenceStorage.ts` - Convert to HTML

Convert decision JSON to Confluence Storage Format (HTML).

```bash
bun run convertToConfluenceStorage.ts decision.json
```

**With Mermaid diagrams as attachments**:

```bash
bun run convertToConfluenceStorage.ts decision.json \
  --attachments '{"option-id":"diagram.png"}'
```

**Parameters**:

- `<json-file>` - Path to decision JSON
- `--attachments` - JSON map of option IDs to attachment filenames

**Output**: HTML in Confluence Storage Format (to stdout)

**Use when**:

- Previewing how a decision will look in Confluence
- Generating HTML for manual upload
- Testing formatting before publishing

---

### `uploadMermaidDiagram.ts` - Upload Diagram

Generate PNG from Mermaid code and upload to Confluence.

```bash
bun run uploadMermaidDiagram.ts \
  --page-id 12345 \
  --filename architecture-diagram.png \
  --mermaid "graph LR; A[Component A] --> B[Component B]"
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

- Uploading architecture diagrams separately
- Testing diagram rendering
- Updating diagrams without republishing entire decision

---

### `uploadToConfluence.ts` - Complete Publishing Workflow

End-to-end workflow: validate, upload diagrams, convert to HTML, and publish to Confluence.

```bash
bun run uploadToConfluence.ts \
  --url "https://confluence.example.com/pages/12345" \
  decision.json
```

**Parameters**:

- `--url` - Full Confluence page URL
- `<json-file>` - Path to decision JSON

**What it does**:

1. Validates the decision JSON against schema
2. Extracts page ID from URL
3. Fetches current page version
4. Uploads all Mermaid diagrams as PNG attachments
5. Converts decision to Confluence HTML format
6. Updates the Confluence page with new content

**Requirements**:

- `JIRA_USERNAME` and `JIRA_TOKEN` environment variables
- `mmdc` CLI tool for Mermaid diagrams

**Output**:

```
Extracting page ID from: https://...
✓ Page ID: 12345
Fetching current page...
✓ Current page: My Decision (version 5)
Processing Mermaid diagrams...
  Processing Mermaid diagram for option: Email Domain
  ✓ Uploaded: email-domain-diagram.png
✓ Uploaded 1 diagram(s)
Converting decision to Confluence storage format...
Updating Confluence page...
✅ Successfully updated: My Decision
   Version: 6
   URL: https://...
```

**Use when**:

- Publishing a complete decision to Confluence
- Updating an existing decision page
- Automating decision documentation workflow

---

## Common Workflows

### 1. Creating a New Decision

**Step 1: Create JSON file**

```json
{
  "problemDefinition": "What approach should we use for...",
  "components": [{ "id": "api", "name": "API Gateway", "description": "..." }],
  "decisionDrivers": [{ "id": "perf", "name": "Performance", "description": "..." }],
  "options": [
    {
      "id": "option-a",
      "name": "Option A",
      "description": "...",
      "architectureDiagramMermaid": "graph LR; A --> B"
    }
  ],
  "evaluationMatrix": [
    {
      "optionId": "option-a",
      "driverId": "perf",
      "rating": "high",
      "evaluationDetails": ["..."]
    }
  ],
  "proposal": {
    "description": "We chose Option A because...",
    "reasoning": ["Reason 1", "Reason 2"]
  },
  "selectedOption": "option-a"
}
```

**Step 2: Validate**

```bash
bun run validate.ts \
  --schema ./decision.ts \
  --export decision \
  --json my-decision.json
```

**Step 3: Publish to Confluence**

```bash
bun run uploadToConfluence.ts \
  --url "https://confluence.example.com/pages/12345" \
  my-decision.json
```

---

### 2. Updating an Existing Decision

**Step 1: Modify JSON file**

- Update problem definition, options, or ratings
- Add/modify Mermaid diagrams

**Step 2: Validate changes**

```bash
bun run validate.ts --schema ./decision.ts --export decision --json my-decision.json
```

**Step 3: Republish**

```bash
bun run uploadToConfluence.ts \
  --url "https://confluence.example.com/pages/12345" \
  my-decision.json
```

The script will:

- Detect existing diagrams and update them
- Increment the page version
- Preserve the page URL

---

### 3. Previewing Before Publishing

**Generate HTML locally**:

```bash
bun run convertToConfluenceStorage.ts my-decision.json > preview.html
```

Then open `preview.html` in a browser to see how it will look.

---

### 4. Managing Diagrams Separately

**Upload a single diagram**:

```bash
bun run uploadMermaidDiagram.ts \
  --page-id 12345 \
  --filename system-architecture.png \
  --mermaid "$(cat diagram.mmd)"
```

**Update diagram without republishing decision**:

```bash
bun run uploadMermaidDiagram.ts \
  --page-id 12345 \
  --filename option-a-diagram.png \
  --mermaid "graph TB; A[Updated] --> B[Diagram]"
```

---

### 5. Batch Operations

**Validate all decisions**:

```bash
for file in documents/decisions/**/*.json; do
  echo "Validating $file"
  bun run validate.ts --schema ./decision.ts --export decision --json "$file"
done
```

**List decisions with specific status**:

```bash
bun run list.ts | grep "→"  # Show only decisions with selected options
```

---

## Integration Patterns

### With Git Workflow

```bash
# 1. Create decision branch
git checkout -b decision/api-gateway-choice

# 2. Create and validate decision
vim documents/decisions/2025-01-15_api-gateway/decision.json
bun run validate.ts --schema ./decision.ts --export decision --json documents/decisions/2025-01-15_api-gateway/decision.json

# 3. Publish to Confluence
bun run uploadToConfluence.ts --url "https://confluence.../12345" documents/decisions/2025-01-15_api-gateway/decision.json

# 4. Update decision with Confluence link
# (Add confluenceLink field to JSON)

# 5. Commit and create PR
git add documents/decisions/2025-01-15_api-gateway/
git commit -m "Add API Gateway decision"
```

### With CI/CD Pipeline

```yaml
# .github/workflows/validate-decisions.yml
name: Validate Decisions
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: bun install
      - run: |
          for file in documents/decisions/**/*.json; do
            bun run packages/decisions/scripts/validate.ts \
              --schema packages/decisions/scripts/decision.ts \
              --export decision \
              --json "$file"
          done
```

### With Airflow DAG

```python
# Automated decision publishing
from airflow import DAG
from airflow.operators.bash import BashOperator

with DAG('publish_decisions', schedule_interval='@daily') as dag:
    validate = BashOperator(
        task_id='validate_decisions',
        bash_command='bun run validate.ts --schema ./decision.ts --export decision --json {{ params.decision_file }}'
    )

    publish = BashOperator(
        task_id='publish_to_confluence',
        bash_command='bun run uploadToConfluence.ts --url {{ params.confluence_url }} {{ params.decision_file }}'
    )

    validate >> publish
```

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
3. Give it a name (e.g., "Decision Scripts")
4. Copy the token and save it securely
5. Add to your environment variables

---

## Script Combinations

### Validate → Convert → Manual Review → Publish

For high-stakes decisions that need review:

```bash
# 1. Validate
bun run validate.ts --schema ./decision.ts --export decision --json decision.json

# 2. Generate HTML preview
bun run convertToConfluenceStorage.ts decision.json > preview.html

# 3. Review in browser
open preview.html

# 4. Publish if approved
bun run uploadToConfluence.ts --url "https://..." decision.json
```

### List → Select → Validate → Republish

Update an existing decision:

```bash
# 1. Find the decision
bun run list.ts | grep "API Gateway"

# 2. Edit the JSON
vim documents/decisions/2025-01-15_api-gateway/decision.json

# 3. Validate changes
bun run validate.ts --schema ./decision.ts --export decision --json documents/decisions/2025-01-15_api-gateway/decision.json

# 4. Republish
bun run uploadToConfluence.ts --url "https://..." documents/decisions/2025-01-15_api-gateway/decision.json
```

---

This skill enables a complete decision documentation workflow from creation through publication, with strong validation and visual documentation support.
