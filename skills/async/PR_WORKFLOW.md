# Pull Request Workflow (Implementation)

## Overview

Offload implementation tasks to GitHub Actions by creating a pull request that triggers a Claude Code workflow to execute and commit changes.

## How It Works

1. **Fetch latest changes** from the remote repository
2. **Update main branch** to ensure branch is based on latest code
3. **Create a new branch** with a descriptive name from updated main
4. **Create an empty commit** to allow PR creation
5. **Push the branch** to the remote repository
6. **Create a pull request** with detailed task description
7. **Capture the PR number** from the creation output
8. **GitHub Actions triggers** the Claude Code workflow automatically
9. **Claude Code executes** the task described in the PR
10. **Results are committed** back to the PR branch

## Workflow Configuration

- **File**: `.github/workflows/pr.yml`
- **Triggers**: PR opened, PR ready for review
- **Tools Available**: Read, Write, Edit, MultiEdit, Glob, Grep, LS, Bash (git, bun, gh)

## When to Use

Use this approach when:

- **Long-running tasks** that would block your local work
- **Independent work** that doesn't require immediate feedback
- **Parallel execution** of multiple tasks simultaneously
- **CI/CD integration** for automated implementations
- **Code reviews** that benefit from automated implementation

## Usage

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
4. Creates an empty commit
5. Pushes the branch to remote
6. Creates a pull request with your description
7. Returns the PR number for monitoring
8. Returns you to your original branch

### Manual Workflow

If you prefer to do it manually:

```bash
# 1. Fetch and update main
git fetch origin
git checkout main
git pull origin main

# 2. Create a new branch from updated main
git checkout -b async/task-description-$(date +%s)

# 3. Create empty commit
git commit --allow-empty -m "Start async work: task description"

# 4. Push to remote (triggers workflow)
git push -u origin <branch-name>

# 5. Create pull request and capture PR number
PR_URL=$(gh pr create --title "Task Title" --body "Detailed task description...")
PR_NUMBER=$(echo $PR_URL | grep -oP '/pull/\K\d+')

# 6. Return to original branch
git checkout main

# 7. Monitor workflow status
gh pr checks $PR_NUMBER --watch
```

## Pull Request Description Format

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
