# Deep Research Workflow (Issues)

## Overview

Trigger deep research and analysis tasks by creating a GitHub issue with the `deep-research` label. Claude Code will analyze the topic and post a comprehensive research report as an issue comment.

## How It Works

1. **Create GitHub issue** with `deep-research` label
2. **GitHub Actions triggers** the deep research workflow
3. **Claude Code analyzes** the topic thoroughly
4. **Research report** is posted as an issue comment
5. **Issue remains open** for discussion and follow-up

## Workflow Configuration

- **File**: `.github/workflows/claude-issue.yml`
- **Job**: `deep-research`
- **Trigger**: Issue opened with `deep-research` label
- **Tools Available**: Bash (gh issue view, gh issue comment, gh issue list, gh search)

## When to Use

Use deep research for:
- Technology/framework comparisons
- Feasibility studies
- Best practices research
- Architecture decisions requiring research
- API/library exploration

## Usage

### Quick Start with Helper Script

```bash
# Trigger deep research and capture issue number
ISSUE_NUMBER=$(./skills/async/trigger-issue.sh \
  --label "deep-research" \
  --title "Research TypeScript code generation tools" \
  --description "$(cat <<'EOF'
## Research Topic
Compare code generation tools for TypeScript backends with strict conventions.

## Areas to Explore
- Plop.js capabilities and limitations
- Fastify autoload for file-based routing
- Comparison with hygen, yeoman, custom scripts
- Integration with our ESLint rules

## Deliverables
- Detailed comparison table
- Recommendations for our use case
- Example implementations if applicable
EOF
)")

# Monitor the research progress
gh issue view $ISSUE_NUMBER --comments
```

### Manual Usage

```bash
# Create issue with deep-research label
ISSUE_URL=$(gh issue create \
  --title "Research topic title" \
  --body "Detailed research description" \
  --label "deep-research")

# Extract issue number
ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -oP '/issues/\K\d+')

# View the issue and comments
gh issue view $ISSUE_NUMBER --comments
```

## Issue Description Format

Your issue description should include:

- **Research Topic** - What needs to be researched
- **Areas to Explore** - Specific aspects or questions to investigate
- **Context** - Why this research is needed
- **Deliverables** - Expected output format (comparison table, recommendations, etc.)

## Monitoring

```bash
# View issue with comments
gh issue view $ISSUE_NUMBER --comments

# Watch for new comments (manual refresh)
watch -n 30 "gh issue view $ISSUE_NUMBER --comments"

# View in browser
gh issue view $ISSUE_NUMBER --web
```

