---
name: agentinsandbox
description: Execute Claude Code CLI prompts in an isolated E2B sandbox
---

# Agent in Sandbox Skill

Run Claude Code CLI prompts in isolated E2B sandboxes. Two modes: basic execution or full repository automation.

## Requirements

- `E2B_API_KEY` - E2B API key (required for all modes)
- `CLAUDE_CODE_OAUTH_TOKEN` - Claude Code authentication token (required)
- `GITHUB_TOKEN` - GitHub token (only for repository automation mode 2) (generate at: https://github.com/settings/tokens/new)

---

## 1. Basic Sandbox Execution

Run a prompt in an isolated sandbox.

**Script:** `execute-prompt-in-sandbox.ts`

**Usage:**
```bash
./execute-prompt-in-sandbox.ts "<prompt>"
```

**Examples:**
```bash
./execute-prompt-in-sandbox.ts "Write a Python script to calculate fibonacci numbers"
./execute-prompt-in-sandbox.ts "Create a simple web server in Node.js"
```

---

## 2. Repository Automation

Clone a repo, create a branch, run a prompt, commit changes, and push.

**Script:** `execute-prompt-on-repo-in-sandbox.ts`

**Usage:**
```bash
./execute-prompt-on-repo-in-sandbox.ts <repo-url> <branch-name> "<prompt>"
```

**Parameters:**
- `repo-url` - GitHub HTTPS URL (e.g., `https://github.com/user/repo.git`)
- `branch-name` - New branch name (must not exist remotely)
- `prompt` - What you want Claude to do

**Examples:**
```bash
# Add documentation
./execute-prompt-on-repo-in-sandbox.ts https://github.com/myorg/myrepo.git docs/readme "Create a comprehensive README with installation and usage"

# Fix bugs
./execute-prompt-on-repo-in-sandbox.ts https://github.com/myorg/myrepo.git fix/auth-bug "Fix the token validation bug in src/auth.ts"

# Add tests
./execute-prompt-on-repo-in-sandbox.ts https://github.com/myorg/myrepo.git test/user-service "Add unit tests for UserService"
```

**What happens:**
1. Clones repo
2. Creates new branch
3. Runs Claude with your prompt
4. Claude makes multiple commits as it works
5. Pushes branch to GitHub

---

## Monitoring Sandboxes

Both scripts log the sandbox ID when they start execution. You can use this ID to monitor and debug running sandboxes.

### List All Sandboxes

```bash
e2b sandbox list
```

This shows all active sandboxes with their IDs, status, and creation time.

### View Sandbox Logs

```bash
e2b sandbox logs <sandbox-id>
```

**Example:**
```bash
# From script output: "Sandbox created: imj1fqxipov73fa7t44ui"
e2b sandbox logs imj1fqxipov73fa7t44ui
```

This displays real-time logs from the sandbox, useful for:
- Debugging failed executions
- Monitoring long-running operations
- Viewing Claude Code CLI output if the script loses connection
- Troubleshooting git operations or authentication issues

**Reference:** [E2B CLI Documentation](https://e2b.dev/docs/cli/list-sandboxes)
