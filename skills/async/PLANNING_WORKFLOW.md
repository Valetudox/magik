# Planning Workflow (Issues)

## Overview

Generate implementation plans for features or bugs by creating a GitHub issue with the `planning` label. 

## How It Works

1. **Create GitHub issue** with `planning` label
2. **GitHub Actions triggers** the planning workflow
3. **Claude Code analyzes** the codebase and requirements
4. **Implementation plan** is posted as an issue comment
5. **Plan includes** tasks, risks, estimates, and approach

## Workflow Configuration

- **File**: `.github/workflows/claude-issue.yml`
- **Job**: `planning`
- **Trigger**: Issue opened with `planning` label
- **Tools Available**: Bash (gh issue view, gh issue comment, gh issue list, gh search)

## When to Use

Use planning for:
- Feature implementation planning
- Bug fix strategies
- Refactoring approaches
- Breaking down complex tasks
- Architecture changes

## Usage

### Quick Start with Helper Script

```bash
# Trigger planning and capture issue number
ISSUE_NUMBER=$(./skills/async/trigger-issue.sh \
  --label "planning" \
  --title "Add user authentication to backend services" \
  --description "$(cat <<'EOF'
## Feature Request
Implement user authentication across all backend services.

## Requirements
- JWT-based authentication
- Role-based access control
- Integrate with existing services
- Follow our backend conventions

## Constraints
- Must work with folder-based routing
- Must pass all lint validators
- Minimal breaking changes
EOF
)")

# Monitor the planning progress
gh issue view $ISSUE_NUMBER --comments
```

### Manual Usage

```bash
# Create issue with planning label
ISSUE_URL=$(gh issue create \
  --title "Feature/Bug title" \
  --body "Detailed description with requirements" \
  --label "planning")

# Extract issue number
ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -oP '/issues/\K\d+')

# View the plan
gh issue view $ISSUE_NUMBER --comments
```

## Issue Description Format

Your issue description should include:

- **Feature/Bug Description** - What needs to be done
- **Requirements** - Functional and non-functional requirements
- **Constraints** - Technical limitations or must-haves
- **Context** - Background information about the codebase

## Expected Plan Output

The planning workflow generates a comprehensive plan including:

### For Bug Reports:
- Problem analysis and root causes
- Investigation steps and debug approach
- Fix strategy and code changes
- Testing strategy

### For Feature Requests:
- Feature overview and requirements
- Technical analysis of affected components
- Step-by-step implementation tasks
- Dependencies and prerequisites

### For All Types:
- Considerations and risks
- Impact on existing functionality
- Testing requirements
- Documentation needs
- Effort estimates and priority

## Monitoring

```bash
# View issue with plan
gh issue view $ISSUE_NUMBER --comments

# Watch for plan updates (manual refresh)
watch -n 30 "gh issue view $ISSUE_NUMBER --comments"

# View in browser
gh issue view $ISSUE_NUMBER --web
```

## Using the Plan

Once the plan is generated:

1. **Review the plan** - Check if it aligns with your expectations
2. **Ask follow-up questions** - Comment on the issue for clarifications
3. **Approve and implement** - Use the plan to guide implementation
4. **Create PR** - Reference the issue in your pull request
