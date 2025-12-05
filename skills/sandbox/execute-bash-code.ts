#!/usr/bin/env bun
import "dotenv/config";
import Sandbox from "e2b";

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
 * Executes bash code in an E2B sandbox
 */
async function executeBashCode(code: string): Promise<void> {
  if (!code) {
    console.error("Error: No code provided via stdin");
    process.exit(1);
  }

  console.log("Creating E2B sandbox...");

  const sandbox = await Sandbox.create();

  console.log(`Sandbox created: ${sandbox.sandboxId}`);
  console.log("Executing bash code...\n");

  try {
    await sandbox.commands.run(code, {
      timeoutMs: 0, // No timeout
      onStdout: (line) => console.log(line),
      onStderr: (line) => console.error(line),
    });
  } finally {
    console.log("\nCleaning up sandbox...");
    await sandbox.kill();
    console.log("Sandbox closed successfully");
  }
}

// Main execution
async function main() {
  try {
    const code = await readStdin();
    await executeBashCode(code);
  } catch (error) {
    console.error("Sandbox execution failed:", error);
    process.exit(1);
  }
}

main();
