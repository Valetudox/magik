#!/usr/bin/env bun
import "dotenv/config";
import Sandbox from "e2b";
import fs from "fs/promises";

/**
 * Escapes a prompt string for safe shell execution
 */
function escapePrompt(prompt: string): string {
  // Escape single quotes by replacing ' with '\''
  return prompt.replace(/'/g, "'\\''");
}

/**
 * Reads input from stdin
 */
async function readStdin(): Promise<string> {
  const decoder = new TextDecoder();
  const chunks: Uint8Array[] = [];

  for await (const chunk of Bun.stdin.stream()) {
    chunks.push(chunk);
  }

  const combined = new Uint8Array(
    chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  );
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  return decoder.decode(combined).trim();
}

/**
 * Backs up sandbox data (Claude project folder) to local machine
 */
async function backupSandboxData(
  sandbox: Sandbox,
  sandboxId: string,
  backupDir: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${backupDir}/${timestamp}_${sandboxId}`;

  console.log(`\nBacking up sandbox data to ${backupPath}...`);

  try {
    // Create backup directory
    await fs.mkdir(backupPath, { recursive: true });

    // Step 1: Create tar.gz archive in sandbox
    console.log("Creating archive in sandbox...");
    const compressResult = await sandbox.commands.run(
      `cd /home/user && if [ -d .claude ]; then tar -czf claude-backup.tar.gz .claude && echo "✓ Created archive: $(du -h claude-backup.tar.gz | cut -f1)"; else echo "⚠ No .claude directory found" && touch claude-backup.tar.gz; fi`,
      {
        onStdout: (line) => console.log(line),
        onStderr: (line) => console.error(line),
      }
    );

    if (compressResult.exitCode !== 0) {
      console.error("⚠ Warning: Failed to create archive in sandbox");
      return;
    }

    // Step 2: Download the archive using E2B SDK
    console.log("Downloading archive...");
    const archiveExists = await sandbox.files.exists("/home/user/claude-backup.tar.gz");

    if (archiveExists) {
      const archiveData = await sandbox.files.read("/home/user/claude-backup.tar.gz", {
        format: "bytes",
      });

      await fs.writeFile(`${backupPath}/claude-backup.tar.gz`, archiveData);
      console.log("✓ Downloaded Claude project archive");
    } else {
      console.log("⚠ Archive file not found in sandbox");
    }

    // Step 3: Save metadata
    const metadata = {
      sandboxId,
      timestamp,
      backupPath,
    };

    await fs.writeFile(
      `${backupPath}/metadata.json`,
      JSON.stringify(metadata, null, 2)
    );

    console.log(`✓ Backup completed: ${backupPath}`);
  } catch (error) {
    console.error("✗ Failed to backup sandbox data:", error);
  }
}

/**
 * Executes a prompt using Claude Code CLI in an E2B sandbox
 */
async function executeSandbox(prompt: string): Promise<void> {
  if (!prompt) {
    console.error("Error: No prompt provided");
    process.exit(1);
  }

  console.log("Creating E2B sandbox with Claude Code CLI...");

  const sandbox = await Sandbox.create({
    envs: {
      CLAUDE_CODE_OAUTH_TOKEN: process.env.CLAUDE_CODE_OAUTH_TOKEN!,
    },
    mcp: {},
  });

  console.log(`Sandbox created: ${sandbox.sandboxId}`);
  console.log("Executing prompt...\n");

  try {
    await sandbox.commands.run(
      `echo '${escapePrompt(prompt)}' | claude -p --dangerously-skip-permissions --output-format stream-json --verbose`,
      {
        timeoutMs: 0, // No timeout
        onStdout: (line) => console.log(line),
        onStderr: (line) => console.error(line),
      }
    );

    // Backup sandbox data
    await backupSandboxData(
      sandbox,
      sandbox.sandboxId,
      "/home/magic/claude-sandbox-backups"
    );
  } finally {
    console.log("\nCleaning up sandbox...");
    await sandbox.kill();
    console.log("Sandbox closed successfully");
  }
}

// Main execution
async function main() {
  try {
    // Get prompt from CLI argument or stdin
    const prompt = process.argv[2] || (await readStdin());
    await executeSandbox(prompt);
  } catch (error) {
    console.error("Sandbox execution failed:", error);
    process.exit(1);
  }
}

main();
