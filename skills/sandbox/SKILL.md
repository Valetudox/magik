---
name: sandbox
description: Execute prompts using Claude Code CLI in an isolated E2B sandbox
---

# Sandbox Execution Skill

Execute prompts using Claude Code CLI within an isolated E2B cloud sandbox.

## Overview

This skill provides secure code execution capabilities by running Claude Code CLI prompts in isolated E2B sandboxes. Each execution happens in a fresh, isolated environment that is automatically cleaned up after completion.

## Requirements

- E2B API key must be set in environment (automatically loaded from .bashrc)
- CLAUDE_CODE_OAUTH_TOKEN must be set in environment (automatically loaded from .bashrc)

## Workflow

1. **Receive execution request**: Agent receives a prompt that needs to be executed in a sandbox
2. **Execute script**: Run `./execute-sandbox.ts "<prompt>"`
3. **Sandbox creation**: Script creates an E2B sandbox with Claude Code CLI
4. **Prompt execution**: Prompt is piped to Claude CLI within the sandbox
5. **Stream output**: Output is streamed back in real-time
6. **Automatic cleanup**: Sandbox is automatically destroyed after execution

## Usage

The skill can be invoked by executing the script with a prompt as an argument:

```bash
./execute-sandbox.ts "Write a Python script to calculate fibonacci numbers"
```

Or by piping a prompt to the script:

```bash
echo "Analyze this code for security vulnerabilities" | ./execute-sandbox.ts
```

## Examples

- `./execute-sandbox.ts "Write a Python script to calculate fibonacci"`
- `./execute-sandbox.ts "Create a simple web server in Node.js"`
- `./execute-sandbox.ts "Analyze the security of this code snippet"`
- `./execute-sandbox.ts "Generate a diagram showing the architecture"`

---

## Repository Automation

Execute prompts on GitHub repositories with automatic branch creation, commits, and pushing.

### Requirements

- E2B API key (same as sandbox execution)
- CLAUDE_CODE_OAUTH_TOKEN (same as sandbox execution)
- **GITHUB_TOKEN** - Personal Access Token with repo access
  - Generate at: https://github.com/settings/tokens/new
  - Required scopes: `repo` (full control of private repositories)

### Workflow

1. **Receive automation request**: Agent receives repository URL, branch name, and prompt
2. **Execute script**: Run `./execute-on-repo.ts <repo-url> <branch-name> "<prompt>"`
3. **Sandbox creation**: Script creates an E2B sandbox with Claude Code CLI and git
4. **Repository cloning**: Clone the repository using GitHub token authentication
5. **Branch creation**: Create a new branch (fails if branch exists remotely)
6. **Prompt execution**: Execute the Claude prompt with automatic commit instructions
7. **Multiple commits**: Claude makes multiple commits as it completes logical units of work
8. **Final commit**: Create final commit if Claude left uncommitted changes
9. **Push to remote**: Push the branch to GitHub
10. **Automatic cleanup**: Sandbox is automatically destroyed after completion

### Usage

```bash
./execute-on-repo.ts <repo-url> <branch-name> "<prompt>"
```

**Parameters:**
- `repo-url` - GitHub repository HTTPS URL (e.g., https://github.com/user/repo.git)
- `branch-name` - Name for the new branch to create (must not exist remotely)
- `prompt` - What you want Claude to do in the repository

### Examples

```bash
# Add documentation
./execute-on-repo.ts https://github.com/myorg/myrepo.git docs/add-readme "Create a comprehensive README.md file with installation instructions, usage examples, and API documentation"

# Fix bugs
./execute-on-repo.ts https://github.com/myorg/myrepo.git fix/auth-bug "Fix the authentication bug in src/auth.ts where tokens are not being validated correctly"

# Add tests
./execute-on-repo.ts https://github.com/myorg/myrepo.git test/user-service "Add comprehensive unit tests for UserService including edge cases and error scenarios"

# Refactor code
./execute-on-repo.ts https://github.com/myorg/myrepo.git refactor/api-handlers "Refactor the API handlers to use async/await and improve error handling"

# Add new feature
./execute-on-repo.ts https://github.com/myorg/myrepo.git feature/dark-mode "Implement dark mode support with theme toggle in settings"
```

### Automatic Commits

Claude is instructed via `--append-system-prompt` to commit frequently:

- Makes multiple small commits during execution
- Each commit represents a logical unit of work
- Uses semantic commit messages: `type(scope): description`
- Examples: `feat(api): add user endpoint`, `fix(ui): resolve alignment issue`

This means you'll see a series of commits on the branch, not just one large commit at the end.

### Error Handling

The script validates and handles:

- **Missing environment variables**: GITHUB_TOKEN or CLAUDE_CODE_OAUTH_TOKEN not set
- **Invalid GitHub URL**: URL is not in format `https://github.com/owner/repo(.git)?`
- **Invalid branch name**: Contains spaces or special characters (~ ^ : ? * [ \)
- **Branch already exists**: Specified branch name exists on remote
- **Authentication failure**: GITHUB_TOKEN is invalid or lacks repo access
- **Repository not found**: Repository URL is incorrect or token lacks permissions
- **No changes to commit**: Claude didn't modify any files (warning, not error)
- **Push rejection**: Branch was created by another process during execution

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Branch already exists" | Branch name exists on remote | Choose a different branch name |
| "Authentication failed" | Invalid GITHUB_TOKEN | Check token is valid and has repo access |
| "Repository not found" | Incorrect URL or permissions | Verify URL and token has read access |
| "Invalid branch name" | Special characters in name | Use only letters, numbers, hyphens, slashes |
| "Push rejected" | Branch created elsewhere | Choose a different branch name |

### Security

- **Token protection**: GITHUB_TOKEN is never logged in command output
- **Sanitized errors**: Error messages have tokens removed automatically
- **Ephemeral sandboxes**: All execution in isolated E2B cloud environments
- **Automatic cleanup**: Credentials cleared when sandbox is destroyed
- **Scoped access**: Token only used for the specified repository operations

### Git Identity

All commits are made with the identity:
- **Name**: Claude Code Bot
- **Email**: bot@claude.com

This clearly identifies automated commits in the git history.

## Technical Details

- Uses E2B SDK for sandbox management
- Executes Claude CLI with `--dangerously-skip-permissions` flag (safe within sandbox)
- No execution timeout (runs until completion)
- Real-time stdout/stderr streaming
- Automatic sandbox cleanup on completion or error

## Security

- All execution happens in isolated E2B cloud sandboxes
- No access to local filesystem or network
- Sandboxes are ephemeral and destroyed after each execution
- Environment variables are properly isolated
