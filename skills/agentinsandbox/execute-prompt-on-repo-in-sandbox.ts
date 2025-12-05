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
  const { owner, repo} = extractRepoInfo(repoUrl);
  const workspacePath = "/home/user/repo";

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
    // Step 1: Install GitHub CLI if not available
    console.log(`\nChecking for GitHub CLI...`);
    const ghCheckResult = await sandbox.commands.run('which gh', { timeoutMs: 5000 });

    if (ghCheckResult.exitCode !== 0) {
      console.log('GitHub CLI not found. Installing...');

      // Install GitHub CLI using the official installation script
      const installResult = await sandbox.commands.run(
        'curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null && sudo apt update && sudo apt install gh -y',
        {
          timeoutMs: 120000, // 2 minutes for installation
          onStdout: (line) => console.log(line),
          onStderr: (line) => console.error(line),
        }
      );

      if (installResult.exitCode !== 0) {
        throw new Error(`Failed to install GitHub CLI: ${installResult.stderr}`);
      }

      console.log('✓ GitHub CLI installed successfully');
    } else {
      console.log('✓ GitHub CLI is already available');
    }

    // Step 2: Clone repository
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

    // Step 3: Configure git identity and remote URL with token
    console.log("\nConfiguring git identity and authentication...");
    await sandbox.commands.run(
      `cd ${workspacePath} && git config user.name "Claude Code Bot" && git config user.email "bot@claude.com" && git remote set-url origin https://\${GITHUB_TOKEN}@github.com/${owner}/${repo}.git`,
      {
        onStdout: (line) => console.log(line),
        onStderr: (line) => console.error(line),
      }
    );

    // Step 4: Check if branch exists remotely
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

    // Step 5: Create and checkout new branch
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

    // Step 6: Execute Claude prompt with commit instructions
    console.log("\nExecuting Claude Code CLI with prompt...");
    console.log("─".repeat(60));

    const fullPrompt = `${prompt}

IMPORTANT: After completing each logical unit of work:
1. Run git status to check what files changed
2. Commit your changes with a descriptive semantic commit message (pattern: type(scope): description)
3. IMMEDIATELY push the commit to the remote repository with: git push origin ${branchName}
4. Continue with the next unit of work

Make multiple small commits with pushes rather than one large commit. Each commit should be pushed immediately after creation.`;

    const executeResult = await sandbox.commands.run(
      `cd ${workspacePath} && echo '${escapeShellArg(fullPrompt)}' | claude -p --dangerously-skip-permissions`,
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

    // Step 7: Verify branch was pushed
    console.log("\nVerifying branch was pushed...");
    const verifyResult = await sandbox.commands.run(
      `cd ${workspacePath} && git ls-remote --heads origin ${branchName}`,
      { timeoutMs: 0 }
    );

    if (verifyResult.stdout.trim().length === 0) {
      console.log("\n⚠ Warning: Branch was not pushed to remote.");
      console.log("Claude may not have made any commits or encountered an error.");
    } else {
      console.log(`\n✓ Successfully completed! Branch '${branchName}' is on remote`);
      console.log(`  View at: https://github.com/${owner}/${repo}/tree/${branchName}`);

      // Step 8: Create pull request
      console.log("\nCreating pull request...");

      const prBody = `## Task

${prompt}

## Changes

This PR was automatically generated using Claude Code in an E2B sandbox.

🤖 Generated with [Claude Code](https://claude.com/claude-code)`;

      const prResult = await sandbox.commands.run(
        `cd ${workspacePath} && gh pr create --title '${escapeShellArg(branchName)}' --body '${escapeShellArg(prBody)}'`,
        {
          timeoutMs: 0,
          onStdout: (line) => console.log(line),
          onStderr: (line) => console.error(line),
        }
      );

      if (prResult.exitCode !== 0) {
        console.log(`\n⚠ Warning: Failed to create pull request: ${prResult.stderr}`);
        console.log(`Branch '${branchName}' was pushed successfully. You can create the PR manually.`);
        console.log(`  View at: https://github.com/${owner}/${repo}/tree/${branchName}`);
      } else {
        // Extract PR URL from gh output (it's in stdout)
        const prUrl = prResult.stdout.trim().split('\n').find(line => line.startsWith('https://'));

        if (prUrl) {
          console.log(`\n✓ Successfully created pull request!`);
          console.log(`  PR URL: ${prUrl}`);
        } else {
          console.log(`\n✓ Pull request created successfully!`);
          console.log('Output:', prResult.stdout);
        }
      }
    }
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
