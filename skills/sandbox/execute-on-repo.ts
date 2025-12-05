#!/usr/bin/env bun
import "dotenv/config";
import Sandbox from "e2b";

/**
 * Validates required environment variables
 */
function validateEnvironment(): void {
  if (!process.env.GITHUB_TOKEN) {
    console.error("Error: GITHUB_TOKEN environment variable is required");
    console.error("Set it with: export GITHUB_TOKEN=<your-token>");
    console.error(
      "Generate a token at: https://github.com/settings/tokens/new"
    );
    process.exit(1);
  }

  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    console.error(
      "Error: CLAUDE_CODE_OAUTH_TOKEN environment variable is required"
    );
    process.exit(1);
  }
}

/**
 * Validates GitHub repository URL format
 */
function validateGitHubUrl(repoUrl: string): void {
  const githubUrlPattern =
    /^https:\/\/github\.com\/[\w-]+\/[\w.-]+(?:\.git)?$/;
  if (!githubUrlPattern.test(repoUrl)) {
    console.error("Error: Invalid GitHub repository URL");
    console.error(
      "Expected format: https://github.com/owner/repo or https://github.com/owner/repo.git"
    );
    process.exit(1);
  }
}

/**
 * Validates git branch name according to git naming rules
 */
function validateBranchName(branchName: string): void {
  const invalidBranchChars = /[\s~^:?*\[\\]/;
  if (
    invalidBranchChars.test(branchName) ||
    branchName.endsWith(".lock") ||
    branchName.startsWith(".") ||
    branchName.endsWith(".") ||
    branchName.includes("..")
  ) {
    console.error("Error: Invalid branch name");
    console.error(
      "Branch names cannot contain: spaces, ~, ^, :, ?, *, [, \\ or .."
    );
    console.error("Branch names cannot start or end with . or end with .lock");
    process.exit(1);
  }
}

/**
 * Validates all required parameters
 */
function validateParameters(
  repoUrl: string,
  branchName: string,
  prompt: string
): void {
  if (!repoUrl || !branchName || !prompt) {
    console.error("Error: Missing required parameters");
    console.error(
      'Usage: ./execute-on-repo.ts <repo-url> <branch-name> "<prompt>"'
    );
    console.error("");
    console.error("Example:");
    console.error(
      '  ./execute-on-repo.ts https://github.com/user/repo.git feature/add-readme "Create a comprehensive README file"'
    );
    process.exit(1);
  }

  validateGitHubUrl(repoUrl);
  validateBranchName(branchName);
}

/**
 * Escapes a string for safe use in shell commands
 */
function escapeShellArg(arg: string): string {
  // Escape single quotes by replacing ' with '\''
  return arg.replace(/'/g, "'\\''");
}

/**
 * Sanitizes error messages to remove GitHub tokens
 */
function sanitizeError(error: string): string {
  // Remove GitHub tokens from URLs in error messages
  return error.replace(/https:\/\/[^@]+@github\.com/g, "https://***@github.com");
}

/**
 * Generates a commit message for any remaining uncommitted changes
 */
function generateCommitMessage(prompt: string): string {
  const maxSummaryLength = 72;
  const summary =
    prompt.length > maxSummaryLength
      ? prompt.substring(0, maxSummaryLength - 3) + "..."
      : prompt;

  const fullPrompt =
    prompt.length > 500 ? prompt.substring(0, 500) + "..." : prompt;

  return `Claude Code: ${summary}

Executed prompt: ${fullPrompt}

🤖 Generated with Claude Code via E2B Sandbox

Co-Authored-By: Claude <noreply@anthropic.com>`;
}

/**
 * Extracts owner and repo name from GitHub URL
 */
function extractRepoInfo(repoUrl: string): { owner: string; repo: string } {
  const match = repoUrl.match(/github\.com\/([\w-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (!match) {
    throw new Error("Failed to parse repository URL");
  }
  return { owner: match[1], repo: match[2] };
}

/**
 * Executes the repository automation workflow in an E2B sandbox
 */
async function executeRepoWorkflow(
  repoUrl: string,
  branchName: string,
  prompt: string
): Promise<void> {
  const { owner, repo } = extractRepoInfo(repoUrl);
  const workspacePath = "/workspace/repo";

  console.log("Creating E2B sandbox with git and Claude Code CLI...");

  const sandbox = await Sandbox.create({
    envs: {
      CLAUDE_CODE_OAUTH_TOKEN: process.env.CLAUDE_CODE_OAUTH_TOKEN!,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
    },
    mcp: {},
  });

  console.log(`Sandbox created: ${sandbox.sandboxId}`);

  try {
    // Step 1: Clone repository
    console.log(`\nCloning repository...`);
    const cloneResult = await sandbox.commands.run(
      `git clone https://\${GITHUB_TOKEN}@github.com/${owner}/${repo}.git ${workspacePath}`,
      {
        onStdout: (line) => console.log(line),
        onStderr: (line) => console.error(sanitizeError(line)),
      }
    );

    if (cloneResult.exitCode !== 0) {
      if (cloneResult.stderr.includes("authentication failed")) {
        throw new Error(
          "Authentication failed. Check GITHUB_TOKEN is valid and has repo access"
        );
      } else if (cloneResult.stderr.includes("not found")) {
        throw new Error(
          `Repository not found: ${repoUrl}. Check URL and token permissions`
        );
      } else {
        throw new Error(
          `Failed to clone repository: ${sanitizeError(cloneResult.stderr)}`
        );
      }
    }

    // Step 2: Configure git identity
    console.log("\nConfiguring git identity...");
    await sandbox.commands.run(
      `cd ${workspacePath} && git config user.name "Claude Code Bot" && git config user.email "bot@claude.com"`,
      {
        onStdout: (line) => console.log(line),
        onStderr: (line) => console.error(line),
      }
    );

    // Step 3: Check if branch exists remotely
    console.log(`\nChecking if branch '${branchName}' exists remotely...`);
    const checkBranchResult = await sandbox.commands.run(
      `cd ${workspacePath} && git ls-remote --heads origin ${branchName}`,
      { timeoutMs: 0 }
    );

    if (checkBranchResult.exitCode !== 0) {
      throw new Error(
        `Failed to check remote branches: ${checkBranchResult.stderr}`
      );
    }

    if (checkBranchResult.stdout.trim().length > 0) {
      throw new Error(
        `Branch '${branchName}' already exists on remote. Choose a different branch name.`
      );
    }

    console.log("✓ Branch name is available");

    // Step 4: Create and checkout new branch
    console.log(`\nCreating branch '${branchName}'...`);
    const createBranchResult = await sandbox.commands.run(
      `cd ${workspacePath} && git checkout -b ${branchName}`,
      {
        onStdout: (line) => console.log(line),
        onStderr: (line) => console.error(line),
      }
    );

    if (createBranchResult.exitCode !== 0) {
      throw new Error(`Failed to create branch: ${createBranchResult.stderr}`);
    }

    // Step 5: Execute Claude prompt with commit instructions
    console.log("\nExecuting Claude Code CLI with prompt...");
    console.log("─".repeat(60));

    const commitInstructions =
      "After completing each logical unit of work, commit your changes with git. Use descriptive semantic commit messages following the pattern: type(scope): description. Make multiple small commits rather than one large commit. Always run git status to check what files changed before committing.";

    const executeResult = await sandbox.commands.run(
      `cd ${workspacePath} && echo '${escapeShellArg(prompt)}' | claude -p --dangerously-skip-permissions --append-system-prompt "${escapeShellArg(commitInstructions)}"`,
      {
        timeoutMs: 0, // No timeout
        onStdout: (line) => console.log(line),
        onStderr: (line) => console.error(line),
      }
    );

    console.log("─".repeat(60));

    if (executeResult.exitCode !== 0) {
      throw new Error(`Claude execution failed with exit code ${executeResult.exitCode}`);
    }

    // Step 6: Check for any uncommitted changes
    console.log("\nChecking for uncommitted changes...");
    const statusResult = await sandbox.commands.run(
      `cd ${workspacePath} && git status --porcelain`,
      { timeoutMs: 0 }
    );

    const hasUncommittedChanges = statusResult.stdout.trim().length > 0;

    if (hasUncommittedChanges) {
      console.log("Found uncommitted changes, creating final commit...");

      // Stage all changes
      await sandbox.commands.run(`cd ${workspacePath} && git add -A`, {
        onStdout: (line) => console.log(line),
        onStderr: (line) => console.error(line),
      });

      // Check if there are staged changes
      const diffResult = await sandbox.commands.run(
        `cd ${workspacePath} && git diff --staged --quiet`,
        { timeoutMs: 0 }
      );

      if (diffResult.exitCode !== 0) {
        // There are staged changes, commit them
        const commitMessage = generateCommitMessage(prompt);
        const commitResult = await sandbox.commands.run(
          `cd ${workspacePath} && git commit -m '${escapeShellArg(commitMessage)}'`,
          {
            onStdout: (line) => console.log(line),
            onStderr: (line) => console.error(line),
          }
        );

        if (commitResult.exitCode !== 0) {
          throw new Error(`Failed to commit changes: ${commitResult.stderr}`);
        }
      }
    } else {
      console.log("✓ All changes already committed by Claude");
    }

    // Step 7: Check if there are any commits on the branch
    const logResult = await sandbox.commands.run(
      `cd ${workspacePath} && git log --oneline`,
      { timeoutMs: 0 }
    );

    console.log("\nCommits on branch:");
    console.log(logResult.stdout);

    // Step 8: Push branch to remote
    console.log(`\nPushing branch '${branchName}' to remote...`);
    const pushResult = await sandbox.commands.run(
      `cd ${workspacePath} && git push -u origin ${branchName}`,
      {
        onStdout: (line) => console.log(line),
        onStderr: (line) => console.error(sanitizeError(line)),
      }
    );

    if (pushResult.exitCode !== 0) {
      if (pushResult.stderr.includes("rejected")) {
        throw new Error(
          "Push rejected. Branch may have been created by another process"
        );
      } else {
        throw new Error(
          `Failed to push branch: ${sanitizeError(pushResult.stderr)}`
        );
      }
    }

    console.log(
      `\n✓ Successfully pushed branch '${branchName}' to remote`
    );
    console.log(
      `  View at: https://github.com/${owner}/${repo}/tree/${branchName}`
    );
  } catch (error) {
    console.error("\n✗ Repository workflow failed:", error);
    throw error;
  } finally {
    console.log("\nCleaning up sandbox...");
    await sandbox.kill();
    console.log("Sandbox closed successfully");
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    // Validate environment first
    validateEnvironment();

    // Get parameters from CLI arguments
    const repoUrl = process.argv[2];
    const branchName = process.argv[3];
    const prompt = process.argv[4];

    // Validate parameters
    validateParameters(repoUrl, branchName, prompt);

    // Execute workflow
    await executeRepoWorkflow(repoUrl, branchName, prompt);
  } catch (error) {
    console.error("Execution failed:", error);
    process.exit(1);
  }
}

main();
