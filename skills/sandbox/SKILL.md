---
name: sandbox
description: Execute TypeScript, Python, or Bash code directly in an isolated E2B sandbox
---

# Sandbox Skill - AI Agent Guide

Execute code directly in isolated E2B sandboxes. This guide explains how AI agents should write code that will be executed in the sandbox environment.

## Requirements

- `E2B_API_KEY` - E2B API key (required)

---

## How It Works

AI agents write code that gets piped to these scripts:
- `execute-python-code.ts` - Executes Python code via stdin
- `execute-node-code.ts` - Executes TypeScript/JavaScript code via stdin
- `execute-bash-code.ts` - Executes Bash commands via stdin

**Key Points:**
- Code runs in isolated E2B Code Interpreter sandboxes
- Python and TypeScript use `@e2b/code-interpreter` with `runCode` API
- Bash uses standard E2B sandbox with `commands.run` API
- Working directory: `/home/user/`
- Output is captured from stdout, stderr, and results
- Sandboxes are ephemeral - cleaned up after execution

---

## Python Code Execution

### Capabilities
- Full Python 3 with top-level await support
- Pre-installed data science libraries (numpy, pandas, matplotlib, etc.)
- Automatic chart detection (matplotlib plots returned as base64 PNG)
- File I/O in `/home/user/` directory

### Writing Python Code for the Sandbox

**Basic Output:**
```python
print("Hello from Python!")
result = 2 + 2
print(f"Result: {result}")
```

**Data Processing:**
```python
import pandas as pd
import json

# Create sample data
data = {
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35],
    'score': [85, 90, 95]
}

df = pd.DataFrame(data)
print("DataFrame created:")
print(df)

# Calculate statistics
print(f"\nAverage age: {df['age'].mean()}")
print(f"Average score: {df['score'].mean()}")

# Export to JSON (print to retrieve)
print("\n=== JSON Output ===")
print(df.to_json(orient='records', indent=2))
```

**Creating Visualizations:**
```python
import matplotlib.pyplot as plt
import numpy as np

# Generate data
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Create plot
plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', linewidth=2, label='sin(x)')
plt.grid(True, alpha=0.3)
plt.xlabel('X axis')
plt.ylabel('Y axis')
plt.title('Sine Wave Visualization')
plt.legend()

# IMPORTANT: plt.show() triggers E2B to capture the chart as base64 PNG
plt.show()

print("Chart generated successfully!")
```

**File Operations:**
```python
import json

# Write data to file
data = {
    "timestamp": "2025-12-05",
    "values": [1, 2, 3, 4, 5],
    "status": "completed"
}

with open("/home/user/output.json", "w") as f:
    json.dump(data, f, indent=2)

print("File written to /home/user/output.json")

# Read it back
with open("/home/user/output.json", "r") as f:
    loaded_data = json.load(f)

print("\n=== File Contents ===")
print(json.dumps(loaded_data, indent=2))
```

**Installing Packages (if needed):**
```python
import subprocess
import sys

# Install package
subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])

# Now use it
import requests
response = requests.get("https://api.github.com/zen")
print(f"GitHub Zen: {response.text}")
```

---

## TypeScript/JavaScript Code Execution

### Capabilities
- Full TypeScript support with type checking
- Top-level await for async operations
- ESM-style imports
- Can install npm packages via commands
- File I/O in `/home/user/` directory

### Writing TypeScript Code for the Sandbox

**Basic Output:**
```typescript
const message: string = "Hello from TypeScript!";
console.log(message);

const sum = (a: number, b: number): number => a + b;
console.log(`Sum: ${sum(5, 10)}`);
```

**Working with Files:**
```typescript
import { writeFileSync, readFileSync, existsSync } from "fs";

// Write JSON file
const data = {
  users: [
    { id: 1, name: "Alice", email: "alice@example.com" },
    { id: 2, name: "Bob", email: "bob@example.com" }
  ]
};

writeFileSync("/home/user/users.json", JSON.stringify(data, null, 2));
console.log("✓ File written to /home/user/users.json");

// Read it back
if (existsSync("/home/user/users.json")) {
  const content = readFileSync("/home/user/users.json", "utf-8");
  const parsed = JSON.parse(content);
  console.log("\n=== File Contents ===");
  console.log(JSON.stringify(parsed, null, 2));
  console.log(`\nTotal users: ${parsed.users.length}`);
}
```

**Async Operations:**
```typescript
// Top-level await is supported
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

console.log("Starting async operations...");

await delay(100);
console.log("✓ Delayed operation 1 complete");

await delay(100);
console.log("✓ Delayed operation 2 complete");

console.log("All async operations finished!");
```

**Data Processing:**
```typescript
interface SalesRecord {
  date: string;
  amount: number;
  product: string;
}

const sales: SalesRecord[] = [
  { date: "2025-01-01", amount: 150, product: "Widget A" },
  { date: "2025-01-02", amount: 200, product: "Widget B" },
  { date: "2025-01-03", amount: 175, product: "Widget A" }
];

// Calculate total sales
const total = sales.reduce((sum, record) => sum + record.amount, 0);
console.log(`Total Sales: $${total}`);

// Group by product
const byProduct = sales.reduce((acc, record) => {
  acc[record.product] = (acc[record.product] || 0) + record.amount;
  return acc;
}, {} as Record<string, number>);

console.log("\n=== Sales by Product ===");
console.log(JSON.stringify(byProduct, null, 2));
```

**Installing and Using NPM Packages:**
```typescript
// Note: To install packages, you need to run a command first
// This is a two-step process in the sandbox

// Step 1: Install package (run this via bash script or separate execution)
// npm install axios

// Step 2: Use it in your TypeScript code
// For this example, we'll use built-in fetch instead
const response = await fetch("https://api.github.com/zen");
const text = await response.text();
console.log(`GitHub Zen: ${text}`);
```

---

## Bash Code Execution

### Capabilities
- Full bash shell access
- Standard Unix utilities (ls, grep, find, etc.)
- File operations
- Process management
- Environment manipulation

### Writing Bash Code for the Sandbox

**Basic Commands:**
```bash
echo "Hello from Bash!"
echo "Current directory: $(pwd)"
echo "Current user: $(whoami)"
echo "System info:"
uname -a
```

**File Operations:**
```bash
# Create a file
cat > /home/user/data.txt << EOF
Line 1: Sample data
Line 2: More data
Line 3: Final line
EOF

echo "✓ File created"

# Read and display
echo ""
echo "=== File Contents ==="
cat /home/user/data.txt

# File stats
echo ""
echo "=== File Stats ==="
wc -l /home/user/data.txt
ls -lh /home/user/data.txt
```

**Working with JSON:**
```bash
# Create JSON file
cat > /home/user/config.json << 'EOF'
{
  "app": "MyApp",
  "version": "1.0.0",
  "settings": {
    "debug": true,
    "timeout": 30
  }
}
EOF

echo "✓ JSON file created"

# Pretty print with jq (if available)
if command -v jq &> /dev/null; then
    echo ""
    echo "=== Formatted JSON ==="
    cat /home/user/config.json | jq .
else
    echo ""
    echo "=== JSON Contents ==="
    cat /home/user/config.json
fi
```

**Data Processing:**
```bash
# Generate sample data
cat > /home/user/sales.csv << EOF
date,product,amount
2025-01-01,Widget A,150
2025-01-02,Widget B,200
2025-01-03,Widget A,175
2025-01-04,Widget C,225
EOF

echo "✓ CSV file created"
echo ""
echo "=== Sales Data ==="
cat /home/user/sales.csv

# Calculate total (skip header)
echo ""
echo "=== Total Sales ==="
tail -n +2 /home/user/sales.csv | awk -F, '{sum += $3} END {print "$" sum}'

# Count products
echo ""
echo "=== Product Count ==="
tail -n +2 /home/user/sales.csv | awk -F, '{print $2}' | sort | uniq -c
```

**Process Management:**
```bash
echo "=== System Information ==="
echo "Memory usage:"
free -h 2>/dev/null || echo "free command not available"

echo ""
echo "Disk usage:"
df -h /home/user

echo ""
echo "Running processes:"
ps aux | head -10
```

**Installing Packages (if package manager available):**
```bash
# Check if apt is available
if command -v apt-get &> /dev/null; then
    echo "apt-get is available"
    # apt-get update && apt-get install -y curl
fi

# Check if apk is available (Alpine)
if command -v apk &> /dev/null; then
    echo "apk is available"
    # apk add --no-cache curl
fi

# Use built-in tools
echo ""
echo "Available tools:"
for cmd in curl wget git python3 node npm; do
    if command -v $cmd &> /dev/null; then
        echo "✓ $cmd: $(command -v $cmd)"
    else
        echo "✗ $cmd: not found"
    fi
done
```

---

## File Upload/Download Patterns

### Uploading Files to Sandbox

**Option 1: Embed content in code (recommended)**
```python
# For small files, embed the content directly
content = """
This is the file content.
It can be multiple lines.
"""

with open("/home/user/input.txt", "w") as f:
    f.write(content)

print("File uploaded (embedded)")
```

**Option 2: Base64 encoding for binary files**
```python
import base64

# Base64 encoded data
base64_data = "SGVsbG8gV29ybGQhIFRoaXMgaXMgYSB0ZXN0IGZpbGUu"

# Decode and write
binary_data = base64.b64decode(base64_data)
with open("/home/user/uploaded.bin", "wb") as f:
    f.write(binary_data)

print("Binary file uploaded")
```

### Downloading Files from Sandbox

**Always print file contents to retrieve them:**

```python
# For text files
with open("/home/user/output.txt", "r") as f:
    print("=== FILE: output.txt ===")
    print(f.read())
```

```python
# For JSON files
import json

with open("/home/user/data.json", "r") as f:
    data = json.load(f)
    print("=== FILE: data.json ===")
    print(json.dumps(data, indent=2))
```

```python
# For binary files (images, etc.)
import base64

with open("/home/user/chart.png", "rb") as f:
    encoded = base64.b64encode(f.read()).decode('utf-8')
    print("=== FILE: chart.png (base64) ===")
    print(encoded)
```

**For matplotlib charts (automatic):**
```python
import matplotlib.pyplot as plt

# Create chart
plt.plot([1, 2, 3, 4])
plt.ylabel('Values')

# E2B automatically captures and returns as base64 PNG
plt.show()
```

---

## Best Practices for AI Agents

### 1. Always Print Output
```python
# ✓ GOOD - Output is captured
result = calculate_something()
print(f"Result: {result}")

# ✗ BAD - No output visible
result = calculate_something()
```

### 2. Use Clear Section Headers
```python
print("=== Data Processing ===")
# ... processing code ...
print("\n=== Results ===")
# ... print results ...
```

### 3. Handle Errors Gracefully
```python
try:
    data = process_data()
    print(f"✓ Processing successful: {len(data)} records")
except Exception as e:
    print(f"✗ Error: {str(e)}")
```

### 4. Verify File Operations
```python
import os

filepath = "/home/user/output.json"
with open(filepath, "w") as f:
    json.dump(data, f)

if os.path.exists(filepath):
    size = os.path.getsize(filepath)
    print(f"✓ File created: {filepath} ({size} bytes)")
```

### 5. Structure Complex Output
```typescript
interface Result {
  success: boolean;
  data: any;
  message: string;
}

const result: Result = {
  success: true,
  data: { count: 42 },
  message: "Operation completed"
};

console.log(JSON.stringify(result, null, 2));
```

### 6. Always Show Final Status
```python
print("\n" + "="*50)
print("EXECUTION COMPLETED SUCCESSFULLY")
print("="*50)
```

---

## Common Patterns

### Pattern 1: Data Analysis Pipeline
```python
import pandas as pd
import matplotlib.pyplot as plt

# 1. Load/create data
print("=== Step 1: Loading Data ===")
data = {'values': [10, 20, 30, 40, 50]}
df = pd.DataFrame(data)
print(f"Loaded {len(df)} rows")

# 2. Process
print("\n=== Step 2: Processing ===")
df['squared'] = df['values'] ** 2
print(df)

# 3. Visualize
print("\n=== Step 3: Creating Visualization ===")
plt.figure(figsize=(8, 6))
plt.plot(df['values'], df['squared'], 'bo-')
plt.xlabel('Values')
plt.ylabel('Squared')
plt.title('Values vs Squared')
plt.grid(True)
plt.show()

# 4. Export
print("\n=== Step 4: Exporting Results ===")
with open("/home/user/results.json", "w") as f:
    df.to_json(f, orient='records')
print("✓ Results exported to results.json")
```

### Pattern 2: File Processing
```typescript
import { readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";

const dir = "/home/user";

console.log("=== Directory Scan ===");
const files = readdirSync(dir);
console.log(`Found ${files.length} items`);

for (const file of files) {
  const filepath = join(dir, file);
  const stats = statSync(filepath);

  if (stats.isFile()) {
    console.log(`\n📄 ${file}`);
    console.log(`   Size: ${stats.size} bytes`);
    console.log(`   Modified: ${stats.mtime}`);
  }
}
```

### Pattern 3: API Data Fetching and Processing
```python
import json

# Simulate API response (or use requests library)
api_data = {
    "users": [
        {"id": 1, "name": "Alice", "active": True},
        {"id": 2, "name": "Bob", "active": False},
        {"id": 3, "name": "Charlie", "active": True}
    ]
}

print("=== API Data Processing ===")
print(f"Total users: {len(api_data['users'])}")

# Filter active users
active_users = [u for u in api_data['users'] if u['active']]
print(f"Active users: {len(active_users)}")

# Export processed data
print("\n=== Processed Data ===")
for user in active_users:
    print(f"- {user['name']} (ID: {user['id']})")
```

---

## Usage Examples

### Execute Python Code
```bash
echo 'print("Hello from Python!")' | ./execute-python-code.ts
```

### Execute TypeScript Code
```bash
echo 'console.log("Hello from TypeScript!")' | ./execute-node-code.ts
```

### Execute Bash Code
```bash
echo 'echo "Hello from Bash!"' | ./execute-bash-code.ts
```

### Multi-line Code
```bash
cat << 'EOF' | ./execute-python-code.ts
import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.plot(x, y)
plt.title('Sine Wave')
plt.show()

print("Chart generated!")
EOF
```
