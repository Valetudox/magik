---
name: async
description: Trigger asynchronous work for an agent
---

# Async Work System

A system for triggering asynchronous work through GitHub, leveraging GitHub Actions and Claude Code automation to execute tasks in the background.

## Three Async Workflows

1. **Pull Request Workflow** - For implementation tasks
2. **Deep Research Workflow** - For research and analysis via issues
3. **Planning Workflow** - For creating implementation plans via issues

---

## 1. Pull Request Workflow (Implementation)

### Overview

Offload implementation tasks to GitHub Actions by creating a pull request that triggers a Claude Code workflow to execute and commit changes.

### How It Works

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

### Monitoring Execution

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

---

## 2. Deep Research Workflow (Issues)

### Overview

Trigger deep research and analysis tasks by creating a GitHub issue with the `deep-research` label. Claude Code will analyze the topic and post a comprehensive research report as an issue comment.

### How It Works

1. **Create GitHub issue** with `deep-research` label
2. **GitHub Actions triggers** the deep research workflow
3. **Claude Code analyzes** the topic thoroughly
4. **Research report** is posted as an issue comment
5. **Issue remains open** for discussion and follow-up

### When to Use

Use deep research for:
- Technology/framework comparisons
- Feasibility studies
- Best practices research
- Architecture decisions requiring research
- API/library exploration

### Quick Start with Helper Script

```bash
# Trigger deep research and capture issue number
ISSUE_NUMBER=$(./skills/async/trigger-deep-research.sh \
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

### Monitoring

```bash
# View issue with comments
gh issue view $ISSUE_NUMBER --comments

# Watch for new comments (manual refresh)
watch -n 30 "gh issue view $ISSUE_NUMBER --comments"
```

---

## 3. Planning Workflow (Issues)

### Overview

Generate implementation plans for features or bugs by creating a GitHub issue with the `planning` label. Claude Code will analyze requirements and post a detailed implementation plan.

### How It Works

1. **Create GitHub issue** with `planning` label
2. **GitHub Actions triggers** the planning workflow
3. **Claude Code analyzes** the codebase and requirements
4. **Implementation plan** is posted as an issue comment
5. **Plan includes** tasks, risks, estimates, and approach

### When to Use

Use planning for:
- Feature implementation planning
- Bug fix strategies
- Refactoring approaches
- Breaking down complex tasks
- Architecture changes

### Quick Start with Helper Script

```bash
# Trigger planning and capture issue number
ISSUE_NUMBER=$(./skills/async/trigger-planning.sh \
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

### Expected Plan Output

The planning workflow generates a comprehensive plan including:

**For Bug Reports:**
- Problem analysis and root causes
- Investigation steps and debug approach
- Fix strategy and code changes
- Testing strategy

**For Feature Requests:**
- Feature overview and requirements
- Technical analysis of affected components
- Step-by-step implementation tasks
- Dependencies and prerequisites

**For All Types:**
- Considerations and risks
- Impact on existing functionality
- Testing requirements
- Documentation needs
- Effort estimates and priority

### Monitoring

```bash
# View issue with plan
gh issue view $ISSUE_NUMBER --comments

# Watch for plan updates (manual refresh)
watch -n 30 "gh issue view $ISSUE_NUMBER --comments"
```

---

## Workflow Configuration

### Pull Request Workflow
- **File**: `.github/workflows/pr.yml`
- **Triggers**: PR opened, PR ready for review
- **Tools**: Read, Write, Edit, Glob, Grep, Bash (git, bun, gh)

### Issue Workflows
- **File**: `.github/workflows/claude-issue.yml`
- **Triggers**: Issue opened with specific labels
- **Labels**:
  - `deep-research` → Runs deep research job
  - `planning` → Runs planning job
- **Tools**: Bash (gh issue/search commands)

