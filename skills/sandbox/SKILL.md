---
name: sandbox
description: Guide for AI agents to use E2B SDK for code execution, file operations, and sandbox management
---

# Sandbox Skill - E2B SDK Guide for AI Agents

This guide teaches AI agents how to write code using the E2B SDK to execute code in isolated sandboxes, manage files, and retrieve results.

## Requirements

- `E2B_API_KEY` - E2B API key (set in environment)
- `@e2b/code-interpreter` - E2B Code Interpreter package for Python/JS/R
- `e2b` - E2B package for bash and general sandbox operations

## Documentation Links

- **Filesystem operations**: https://e2b.dev/docs/filesystem/read-write
- **Upload/Download files**: https://e2b.dev/docs/quickstart/upload-download-files
- **JavaScript support**: https://e2b.dev/docs/code-interpreting/supported-languages/javascript
- **Python support**: https://e2b.dev/docs/code-interpreting/supported-languages/python
- **Bash support**: https://e2b.dev/docs/code-interpreting/supported-languages/bash
- **Static charts**: https://e2b.dev/docs/code-interpreting/create-charts-visualizations/static-charts
- **Commands API**: https://e2b.dev/docs/commands

---

## How to Use E2B SDK

AI agents should write TypeScript/JavaScript code that uses the E2B SDK to create sandboxes, execute code, and manage files.

### Basic Structure

```typescript
#!/usr/bin/env bun
import "dotenv/config";
import { Sandbox } from "@e2b/code-interpreter";

async function main() {
  // 1. Create sandbox
  const sandbox = await Sandbox.create();
  console.log(`Sandbox created: ${sandbox.sandboxId}`);

  try {
    // 2. Execute code
    const execution = await sandbox.runCode(code, { language: "python" });

    // 3. Process results
    console.log("Output:", execution.logs.stdout);

    // 4. Handle files if needed
    const fileContent = await sandbox.files.read("/home/user/output.txt");
    console.log("File content:", fileContent);

  } finally {
    // 5. Cleanup
    await sandbox.kill();
  }
}

main();
```

---

## Code Execution with runCode

### Python Code Execution

**Basic example:**
```typescript
import { Sandbox } from "@e2b/code-interpreter";

const sandbox = await Sandbox.create();

const pythonCode = `
import pandas as pd
import numpy as np

# Create sample data
data = {'values': [10, 20, 30, 40, 50]}
df = pd.DataFrame(data)

print("DataFrame created:")
print(df)
print(f"Mean: {df['values'].mean()}")
`;

const execution = await sandbox.runCode(pythonCode, { language: "python" });

// Access output
execution.logs.stdout.forEach(line => console.log(line));
execution.logs.stderr.forEach(line => console.error(line));

if (execution.error) {
  console.error("Error:", execution.error);
}

await sandbox.kill();
```

**With matplotlib charts:**
```typescript
const chartCode = `
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', linewidth=2)
plt.xlabel('X')
plt.ylabel('sin(X)')
plt.title('Sine Wave')
plt.grid(True)
plt.show()
`;

const execution = await sandbox.runCode(chartCode, { language: "python" });

// Charts are automatically captured
if (execution.results.length > 0) {
  const chart = execution.results[0];
  if (chart.png) {
    // chart.png is base64 encoded PNG
    console.log("Chart generated (base64):", chart.png.substring(0, 50) + "...");

    // Save to file
    import fs from "fs";
    fs.writeFileSync("chart.png", chart.png, { encoding: "base64" });
  }
}

await sandbox.kill();
```

### TypeScript/JavaScript Code Execution

```typescript
import { Sandbox } from "@e2b/code-interpreter";

const sandbox = await Sandbox.create();

const tsCode = `
interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
];

console.log("Users:", users);
console.log("Count:", users.length);
`;

const execution = await sandbox.runCode(tsCode, { language: "ts" });

execution.logs.stdout.forEach(line => console.log(line));

await sandbox.kill();
```

### Bash Code Execution

For bash commands, use the standard `e2b` package and `commands.run`:

```typescript
import Sandbox from "e2b";

const sandbox = await Sandbox.create();

const result = await sandbox.commands.run(`
echo "Hello from Bash!"
echo "Current directory: $(pwd)"
ls -la /home/user
`);

console.log("stdout:", result.stdout);
console.log("stderr:", result.stderr);
console.log("exit code:", result.exitCode);

await sandbox.kill();
```

---

## File Operations

### Writing Files to Sandbox

**Single file:**
```typescript
import { Sandbox } from "@e2b/code-interpreter";

const sandbox = await Sandbox.create();

// Write text file
await sandbox.files.write("/home/user/input.txt", "Hello, World!");

// Write JSON file
const data = { name: "test", value: 42 };
await sandbox.files.write(
  "/home/user/data.json",
  JSON.stringify(data, null, 2)
);

console.log("Files written");

await sandbox.kill();
```

**Multiple files:**
```typescript
await sandbox.files.write([
  { path: "/home/user/file1.txt", data: "Content 1" },
  { path: "/home/user/file2.txt", data: "Content 2" },
  { path: "/home/user/config.json", data: JSON.stringify({ setting: true }) }
]);
```

**Binary files (base64):**
```typescript
import fs from "fs";

// Read local file
const localFile = fs.readFileSync("local/image.png");

// Write to sandbox
await sandbox.files.write("/home/user/image.png", localFile);
```

### Reading Files from Sandbox

**Single file:**
```typescript
const content = await sandbox.files.read("/home/user/output.txt");
console.log("File content:", content);
```

**Multiple files:**
```typescript
const file1 = await sandbox.files.read("/home/user/result1.json");
const file2 = await sandbox.files.read("/home/user/result2.json");

console.log("Result 1:", JSON.parse(file1));
console.log("Result 2:", JSON.parse(file2));
```

**Save to local filesystem:**
```typescript
import fs from "fs";

const remoteContent = await sandbox.files.read("/home/user/output.csv");
fs.writeFileSync("local/output.csv", remoteContent);
console.log("File downloaded to local/output.csv");
```

---

## Complete Workflow Examples

### Example 1: Data Analysis with File I/O

```typescript
#!/usr/bin/env bun
import "dotenv/config";
import { Sandbox } from "@e2b/code-interpreter";
import fs from "fs";

async function analyzeData() {
  const sandbox = await Sandbox.create();

  try {
    // 1. Upload input data
    const inputData = {
      sales: [
        { date: "2025-01-01", amount: 150 },
        { date: "2025-01-02", amount: 200 },
        { date: "2025-01-03", amount: 175 }
      ]
    };

    await sandbox.files.write(
      "/home/user/input.json",
      JSON.stringify(inputData)
    );

    // 2. Process data with Python
    const code = `
import json
import pandas as pd
import matplotlib.pyplot as plt

# Load input
with open("/home/user/input.json") as f:
    data = json.load(f)

# Create DataFrame
df = pd.DataFrame(data['sales'])
df['date'] = pd.to_datetime(df['date'])

# Calculate statistics
total = df['amount'].sum()
average = df['amount'].mean()

print(f"Total sales: ${total}")
print(f"Average: ${average:.2f}")

# Create visualization
plt.figure(figsize=(10, 6))
plt.bar(df['date'].dt.strftime('%Y-%m-%d'), df['amount'])
plt.xlabel('Date')
plt.ylabel('Amount ($)')
plt.title('Daily Sales')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# Export results
results = {
    "total": float(total),
    "average": float(average),
    "count": len(df)
}

with open("/home/user/results.json", "w") as f:
    json.dump(results, f, indent=2)
`;

    const execution = await sandbox.runCode(code, { language: "python" });

    // 3. Display output
    execution.logs.stdout.forEach(line => console.log(line));

    // 4. Download chart
    if (execution.results.length > 0 && execution.results[0].png) {
      fs.writeFileSync("sales_chart.png", execution.results[0].png, {
        encoding: "base64"
      });
      console.log("✓ Chart saved to sales_chart.png");
    }

    // 5. Download results
    const results = await sandbox.files.read("/home/user/results.json");
    console.log("\nResults:", JSON.parse(results));

  } finally {
    await sandbox.kill();
  }
}

analyzeData();
```

### Example 2: Multi-Step Processing Pipeline

```typescript
#!/usr/bin/env bun
import "dotenv/config";
import { Sandbox } from "@e2b/code-interpreter";

async function processPipeline() {
  const sandbox = await Sandbox.create();

  try {
    // Step 1: Generate data with Python
    console.log("=== Step 1: Generating Data ===");
    await sandbox.runCode(`
import json
import random

data = [random.randint(1, 100) for _ in range(50)]

with open("/home/user/data.json", "w") as f:
    json.dump(data, f)

print(f"Generated {len(data)} random numbers")
`, { language: "python" });

    // Step 2: Process with TypeScript
    console.log("\n=== Step 2: Processing with TypeScript ===");
    const tsResult = await sandbox.runCode(`
import { readFileSync, writeFileSync } from "fs";

const data: number[] = JSON.parse(
  readFileSync("/home/user/data.json", "utf-8")
);

const stats = {
  count: data.length,
  sum: data.reduce((a, b) => a + b, 0),
  min: Math.min(...data),
  max: Math.max(...data),
  mean: data.reduce((a, b) => a + b, 0) / data.length
};

writeFileSync("/home/user/stats.json", JSON.stringify(stats, null, 2));

console.log("Statistics calculated:");
console.log(JSON.stringify(stats, null, 2));
`, { language: "ts" });

    tsResult.logs.stdout.forEach(line => console.log(line));

    // Step 3: Visualize with Python
    console.log("\n=== Step 3: Creating Visualization ===");
    const vizResult = await sandbox.runCode(`
import json
import matplotlib.pyplot as plt

with open("/home/user/data.json") as f:
    data = json.load(f)

plt.figure(figsize=(12, 6))
plt.hist(data, bins=20, edgecolor='black', alpha=0.7)
plt.xlabel('Value')
plt.ylabel('Frequency')
plt.title('Distribution of Random Numbers')
plt.grid(True, alpha=0.3)
plt.show()

print("Visualization created")
`, { language: "python" });

    // Save chart
    if (vizResult.results[0]?.png) {
      import fs from "fs";
      fs.writeFileSync("distribution.png", vizResult.results[0].png, {
        encoding: "base64"
      });
      console.log("✓ Chart saved to distribution.png");
    }

    // Download final stats
    const stats = await sandbox.files.read("/home/user/stats.json");
    console.log("\n=== Final Statistics ===");
    console.log(stats);

  } finally {
    await sandbox.kill();
  }
}

processPipeline();
```

### Example 3: File Processing with Bash

```typescript
#!/usr/bin/env bun
import "dotenv/config";
import Sandbox from "e2b";

async function processFiles() {
  const sandbox = await Sandbox.create();

  try {
    // Upload CSV file
    const csvData = `name,age,city
Alice,25,NYC
Bob,30,LA
Charlie,35,Chicago`;

    await sandbox.files.write("/home/user/data.csv", csvData);

    // Process with bash
    const result = await sandbox.commands.run(`
echo "=== Processing CSV file ==="

# Count lines
echo "Total lines:"
wc -l /home/user/data.csv

# Extract names
echo ""
echo "Names:"
tail -n +2 /home/user/data.csv | cut -d, -f1

# Calculate average age
echo ""
echo "Average age:"
tail -n +2 /home/user/data.csv | cut -d, -f2 | awk '{sum+=$1; count++} END {print sum/count}'

# Create summary
cat > /home/user/summary.txt << EOF
CSV Processing Summary
=====================
File: data.csv
Lines: $(wc -l < /home/user/data.csv)
Records: $(($(wc -l < /home/user/data.csv) - 1))
EOF

cat /home/user/summary.txt
`);

    console.log(result.stdout);

    // Download summary
    const summary = await sandbox.files.read("/home/user/summary.txt");
    console.log("\n=== Downloaded Summary ===");
    console.log(summary);

  } finally {
    await sandbox.kill();
  }
}

processFiles();
```

### Example 4: Installing Packages and Using APIs

```typescript
#!/usr/bin/env bun
import "dotenv/config";
import { Sandbox } from "@e2b/code-interpreter";

async function fetchAndAnalyze() {
  const sandbox = await Sandbox.create();

  try {
    // Install required package
    console.log("Installing requests...");
    await sandbox.commands.run("pip install requests");

    // Fetch data and analyze
    const code = `
import requests
import json

# Fetch data from API
response = requests.get("https://api.github.com/users/github")
user_data = response.json()

print(f"User: {user_data['login']}")
print(f"Name: {user_data['name']}")
print(f"Public repos: {user_data['public_repos']}")
print(f"Followers: {user_data['followers']}")

# Save to file
with open("/home/user/github_user.json", "w") as f:
    json.dump(user_data, f, indent=2)

print("\\nData saved to github_user.json")
`;

    const execution = await sandbox.runCode(code, { language: "python" });
    execution.logs.stdout.forEach(line => console.log(line));

    // Download the saved data
    const userData = await sandbox.files.read("/home/user/github_user.json");
    const parsed = JSON.parse(userData);

    console.log("\n=== Downloaded User Data ===");
    console.log(`Login: ${parsed.login}`);
    console.log(`Public Repos: ${parsed.public_repos}`);

  } finally {
    await sandbox.kill();
  }
}

fetchAndAnalyze();
```

---

## Best Practices for AI Agents

### 1. Always Clean Up Sandboxes

```typescript
const sandbox = await Sandbox.create();
try {
  // ... your code ...
} finally {
  await sandbox.kill(); // Always cleanup
}
```

### 2. Handle Errors Properly

```typescript
const execution = await sandbox.runCode(code, { language: "python" });

if (execution.error) {
  console.error("Execution error:", execution.error);
  return;
}

if (execution.logs.stderr.length > 0) {
  console.warn("Warnings:", execution.logs.stderr);
}
```

### 3. Check File Existence Before Reading

```typescript
const code = `
import os
filepath = "/home/user/output.json"
if os.path.exists(filepath):
    print(f"File exists: {filepath}")
else:
    print(f"File not found: {filepath}")
`;

const execution = await sandbox.runCode(code, { language: "python" });
```

### 4. Use Appropriate Language for Task

- **Python**: Data analysis, ML, scientific computing, visualization
- **TypeScript**: Type-safe data processing, JSON manipulation, async operations
- **Bash**: File operations, system tasks, text processing

### 5. Structure Output for Easy Parsing

```typescript
const code = `
import json

result = {
    "status": "success",
    "data": {"count": 42},
    "message": "Processing completed"
}

print(json.dumps(result))
`;

const execution = await sandbox.runCode(code, { language: "python" });
const output = execution.logs.stdout.join("\n");
const parsed = JSON.parse(output);
console.log("Status:", parsed.status);
```

---

## Common Patterns

### Pattern 1: Upload → Process → Download

```typescript
// 1. Upload
await sandbox.files.write("/home/user/input.csv", csvData);

// 2. Process
await sandbox.runCode(processingCode, { language: "python" });

// 3. Download
const result = await sandbox.files.read("/home/user/output.json");
```

### Pattern 2: Multi-Language Pipeline

```typescript
// Python for data generation
await sandbox.runCode(generateDataCode, { language: "python" });

// TypeScript for processing
await sandbox.runCode(processCode, { language: "ts" });

// Python for visualization
await sandbox.runCode(visualizeCode, { language: "python" });
```

### Pattern 3: Iterative Processing

```typescript
for (let i = 0; i < datasets.length; i++) {
  await sandbox.files.write(`/home/user/input_${i}.json`, datasets[i]);

  const code = `
import json
with open("/home/user/input_${i}.json") as f:
    data = json.load(f)
# Process data...
with open("/home/user/output_${i}.json", "w") as f:
    json.dump(result, f)
`;

  await sandbox.runCode(code, { language: "python" });

  const result = await sandbox.files.read(`/home/user/output_${i}.json`);
  console.log(`Result ${i}:`, result);
}
```

---

## Key SDK Methods Reference

### Sandbox Creation
```typescript
import { Sandbox } from "@e2b/code-interpreter";
const sandbox = await Sandbox.create();
```

### Code Execution
```typescript
const execution = await sandbox.runCode(code, {
  language: "python" | "ts" | "js" | "bash"
});
```

### File Operations
```typescript
// Write single file
await sandbox.files.write(path, content);

// Write multiple files
await sandbox.files.write([
  { path: "/path/1", data: "content1" },
  { path: "/path/2", data: "content2" }
]);

// Read file
const content = await sandbox.files.read(path);
```

### Command Execution (for bash)
```typescript
import Sandbox from "e2b";
const sandbox = await Sandbox.create();
const result = await sandbox.commands.run(command);
```

### Cleanup
```typescript
await sandbox.kill();
```

---

## Template for AI Agents

When an AI agent needs to execute code in a sandbox, use this template:

```typescript
#!/usr/bin/env bun
import "dotenv/config";
import { Sandbox } from "@e2b/code-interpreter";

async function main() {
  const sandbox = await Sandbox.create();
  console.log(`Sandbox created: ${sandbox.sandboxId}`);

  try {
    // Step 1: Upload any input files
    // await sandbox.files.write("/home/user/input.txt", inputData);

    // Step 2: Execute code
    const code = \`
# Your Python/TypeScript/Bash code here
print("Hello from sandbox!")
\`;

    const execution = await sandbox.runCode(code, { language: "python" });

    // Step 3: Handle output
    execution.logs.stdout.forEach(line => console.log(line));
    execution.logs.stderr.forEach(line => console.error(line));

    if (execution.error) {
      console.error("Error:", execution.error);
    }

    // Step 4: Download results if needed
    // const output = await sandbox.files.read("/home/user/output.json");
    // console.log("Results:", output);

    // Step 5: Handle charts if created
    // if (execution.results.length > 0 && execution.results[0].png) {
    //   import fs from "fs";
    //   fs.writeFileSync("chart.png", execution.results[0].png, {
    //     encoding: "base64"
    //   });
    // }

  } finally {
    await sandbox.kill();
    console.log("Sandbox cleaned up");
  }
}

main().catch(console.error);
```
