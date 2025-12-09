---
name: async
description: Trigger asynchronous work for an agent
---

# Async Work System

A system for triggering asynchronous work through GitHub, leveraging GitHub Actions and Claude Code automation to execute tasks in the background.

## Three Async Workflows

### 1. Pull Request Workflow (Implementation)

**Purpose**: Implement code changes, fix bugs, add features

**Trigger**: Create a pull request → Claude Code executes the task and commits changes

**Script**: `./skills/async/trigger-async-work.sh`

**Documentation**: See [PR_WORKFLOW.md](./PR_WORKFLOW.md)

---

### 2. Deep Research Workflow (Issues)

**Purpose**: Research technologies, frameworks, best practices, architecture decisions

**Trigger**: Create issue with `deep-research` label → Claude Code posts comprehensive research report

**Script**: `./skills/async/trigger-issue.sh --label "deep-research"`

**Documentation**: See [DEEP_RESEARCH_WORKFLOW.md](./DEEP_RESEARCH_WORKFLOW.md)

---

### 3. Planning Workflow (Issues)

**Purpose**: Generate implementation plans for features or bugs

**Trigger**: Create issue with `planning` label → Claude Code posts detailed implementation plan

**Script**: `./skills/async/trigger-issue.sh --label "planning"`

**Documentation**: See [PLANNING_WORKFLOW.md](./PLANNING_WORKFLOW.md)

---

## Quick Reference

### Scripts

```bash
# Pull Request Workflow (Implementation)
./skills/async/trigger-async-work.sh \
  --name "task-name" \
  --description "Task description"

# Deep Research Workflow
./skills/async/trigger-issue.sh \
  --label "deep-research" \
  --title "Research topic" \
  --description "Research description"

# Planning Workflow
./skills/async/trigger-issue.sh \
  --label "planning" \
  --title "Feature/Bug title" \
  --description "Requirements and constraints"
```

### Monitoring

```bash
# Monitor PR workflow
gh pr checks $PR_NUMBER --watch

# Monitor issue workflows (research/planning)
gh issue view $ISSUE_NUMBER --comments
```

---

## Workflow Configuration Files

- **PR Workflow**: `.github/workflows/pr.yml`
- **Issue Workflows**: `.github/workflows/claude-issue.yml`
  - `deep-research` job - Runs when issue has `deep-research` label
  - `planning` job - Runs when issue has `planning` label

