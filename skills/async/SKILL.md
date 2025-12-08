---
name: async
description: Trigger asynchronous work for an agent
---

# Async Work via Pull Requests

A system for triggering asynchronous work through GitHub pull requests, leveraging GitHub Actions and Claude Code automation to execute tasks in the background.

## Overview

This skill enables you to offload work to GitHub Actions by creating a pull request that automatically triggers a Claude Code workflow. The workflow executes your requested task asynchronously and commits the results back to the PR branch.

## How It Works

1. **Create a new branch** with a descriptive name
2. **Make an empty commit** to trigger the workflow
3. **Push the branch** to the remote repository
4. **Create a pull request** with detailed task description
5. **Capture the PR number** from the creation output
6. **GitHub Actions triggers** the Claude Code workflow automatically
7. **Claude Code executes** the task described in the PR
8. **Monitor workflow status** using GitHub CLI to check action progress
9. **Results are committed** back to the PR branch

## Workflow Configuration

The automation is configured in `.github/workflows/pr.yml` and triggers on:

- Pull request opened
- Pull request marked as ready for review

### Workflow Capabilities

The automated Claude Code instance has access to:

- **File operations**: Read, Write, Edit, MultiEdit
- **Search tools**: Glob, Grep, LS
- **Build tools**: Bun commands (`bun run:*`, `bun:*`)
- **Version control**: Git commands
- **GitHub CLI**: Issue and PR viewing/commenting

## When to Use Async Execution

Use this approach when:

- **Long-running tasks** that would block your local work
- **Independent work** that doesn't require immediate feedback
- **Parallel execution** of multiple tasks simultaneously
- **CI/CD integration** for automated implementations
- **Code reviews** that benefit from automated implementation

## Usage Pattern

### Basic Workflow

```bash
# 1. Create a new branch
git checkout -b task-description-$(date +%Y%m%d-%H%M%S)

# 2. Create empty commit to trigger automation
git commit --allow-empty -m "chore: trigger async task"

# 3. Push to remote
git push -u origin <branch-name>

# 4. Create pull request with task description and capture PR URL
PR_URL=$(gh pr create --title "Task Title" --body "Detailed task description...")
echo "Pull Request created: $PR_URL"

# 5. Extract PR number from URL
PR_NUMBER=$(echo $PR_URL | grep -oP '/pull/\K\d+')

# 6. Monitor workflow status
gh pr checks $PR_NUMBER --watch
# Or check status without watching:
gh pr checks $PR_NUMBER

# 7. View workflow run details
gh run list --workflow=pr.yml --limit 1
gh run view <run-id> --log
```

### Pull Request Description Format

Your PR description should clearly specify:

- **What needs to be done** - The specific task or feature
- **Context** - Any relevant background information
- **Acceptance criteria** - How to verify completion
- **Related issues** - Link to any related GitHub issues


## Monitoring Execution

### Programmatic Monitoring with GitHub CLI

After creating the PR, you can monitor the workflow execution programmatically:

```bash
# Check PR checks status
gh pr checks $PR_NUMBER

# Watch checks in real-time (blocks until completion)
gh pr checks $PR_NUMBER --watch

# List recent workflow runs
gh run list --workflow=pr.yml --limit 5

# View specific run details with logs
gh run view <run-id> --log

# Check if workflow is still running
gh run list --workflow=pr.yml --json status,conclusion --jq '.[0]'
```

