#!/usr/bin/env bun
import "dotenv/config";
import { Sandbox } from "@e2b/code-interpreter";

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
 * Executes TypeScript/JavaScript code in an E2B code interpreter sandbox
 */
async function executeNodeCode(code: string): Promise<void> {
  if (!code) {
    console.error("Error: No code provided via stdin");
    process.exit(1);
  }

  console.log("Creating E2B code interpreter sandbox...");

  const sandbox = await Sandbox.create();

  console.log(`Sandbox created: ${sandbox.sandboxId}`);
  console.log("Executing TypeScript/JavaScript code...\n");

  try {
    // Code interpreter supports TypeScript natively
    const execution = await sandbox.runCode(code, { language: "ts" });

    // Display stdout
    if (execution.logs.stdout.length > 0) {
      execution.logs.stdout.forEach((line) => console.log(line));
    }

    // Display stderr
    if (execution.logs.stderr.length > 0) {
      execution.logs.stderr.forEach((line) => console.error(line));
    }

    // Display error if any
    if (execution.error) {
      console.error("\nError:", execution.error);
    }

    // Display results if any
    if (execution.results.length > 0) {
      console.log("\nResults:");
      execution.results.forEach((result) => console.log(result));
    }
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
    await executeNodeCode(code);
  } catch (error) {
    console.error("Sandbox execution failed:", error);
    process.exit(1);
  }
}

main();
