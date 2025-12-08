---
name: async
description: Trigger asynchronous work for an agent
---

# Async Work via Pull Requests

A system for triggering asynchronous work through GitHub pull requests, leveraging GitHub Actions and Claude Code automation to execute tasks in the background.

## Overview

This skill enables you to offload work to GitHub Actions by creating a pull request that automatically triggers a Claude Code workflow. The workflow executes your requested task asynchronously and commits the results back to the PR branch.

## How It Works

1. **Fetch latest changes** from the remote repository
2. **Update main branch** to ensure branch is based on latest code
3. **Create a new branch** with a descriptive name from updated main
4. **Push the branch** to the remote repository
5. **Create a pull request** with detailed task description
6. **Capture the PR number** from the creation output
7. **GitHub Actions triggers** the Claude Code workflow automatically
8. **Claude Code executes** the task described in the PR
9. **Monitor workflow status** using GitHub CLI to check action progress
10. **Results are committed** back to the PR branch

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

### Important: Handling Uncommitted Changes

**Before triggering async work, you MUST handle any uncommitted changes:**

1. **Check for uncommitted changes:**
   ```bash
   git status --short
   ```

2. **If there are uncommitted changes, ask the user:**
   - "You have uncommitted changes. Would you like to commit them or stash them?"
   - **If commit:** Ask for a commit message, then `git add -A && git commit -m "message"`
   - **If stash:** Run `git stash push -m "Before async work"` and note that you'll restore it later

3. **After triggering the async work:**
   - If changes were stashed, restore them: `git stash pop`

### Quick Start with Helper Script

The easiest way to trigger async work is using the helper script:

```bash
# Trigger async work and capture PR number
PR_NUMBER=$(./skills/async/trigger-async-work.sh \
  --name "Fix lint issues in backend-decision" \
  --description "$(cat <<'EOF'
## Task
Fix all lint issues in the apps/backend-decision/ directory.

## Acceptance Criteria
- [ ] All ESLint errors resolved
- [ ] TypeScript compilation passes
EOF
)")

# Monitor the workflow
gh pr checks $PR_NUMBER --watch
```

The script automatically:
1. Fetches latest changes from remote
2. Updates main branch to latest
3. Creates a timestamped branch from updated main (`async/<name>-<timestamp>`)
4. Pushes the branch to remote
5. Creates a pull request with your description
6. Returns the PR number for monitoring
7. Returns you to your original branch

### Manual Workflow

If you prefer to do it manually:

```bash
# 1. Fetch and update main
git fetch origin
git checkout main
git pull origin main

# 2. Create a new branch from updated main
git checkout -b async/task-description-$(date +%s)

# 3. Push to remote (triggers workflow)
git push -u origin <branch-name>

# 4. Create pull request and capture PR number
PR_URL=$(gh pr create --title "Task Title" --body "Detailed task description...")
PR_NUMBER=$(echo $PR_URL | grep -oP '/pull/\K\d+')

# 5. Return to original branch
git checkout main

# 6. Monitor workflow status
gh pr checks $PR_NUMBER --watch
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

