#!/usr/bin/env bun
import "dotenv/config";
import Sandbox from "e2b";

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
