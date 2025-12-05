---
name: sandbox
description: Execute TypeScript, Python, or Bash code directly in an isolated E2B sandbox
---

# Sandbox Skill

Execute code directly in isolated E2B sandboxes without Claude Code CLI. Pipe your code to these scripts via stdin.

## Requirements

- `E2B_API_KEY` - E2B API key (required)

---

**Scripts:**
- `execute-bash-code.ts` - Execute bash commands/scripts
- `execute-python-code.ts` - Execute Python code
- `execute-node-code.ts` - Execute Node.js/TypeScript code

**Usage:**
```bash
echo "your code here" | ./execute-bash-code.ts
echo "your code here" | ./execute-python-code.ts
echo "your code here" | ./execute-node-code.ts

# Or from a file:
cat script.py | ./execute-python-code.ts
cat script.js | ./execute-node-code.ts
cat script.sh | ./execute-bash-code.ts
```

### TypeScript/JavaScript Execution

**Example: Run TypeScript directly**
```bash
echo 'const factorial = (n: number): number => {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
};
console.log("Factorial of 10:", factorial(10));' | ./execute-node-code.ts
```

**Example: Run JavaScript directly**
```bash
echo "console.log('Hello from JS:', Math.random());" | ./execute-node-code.ts
```

**Example: From a file**
```bash
cat my-script.ts | ./execute-node-code.ts
```

### Python Execution

**Example: Run Python code directly**
```bash
echo 'import json
import random

data = [random.randint(1, 100) for _ in range(10)]
with open("output.json", "w") as f:
    json.dump(data, f, indent=2)
print("Generated:", data)' | ./execute-python-code.ts
```

**Example: Simple Python execution**
```bash
echo 'import sys; print(f"Python {sys.version}")' | ./execute-python-code.ts
```

**Example: From a file**
```bash
cat my-script.py | ./execute-python-code.ts
```

### Bash Script Execution

**Example: Run bash commands directly**
```bash
echo 'echo "System Info:"
uname -a
df -h
echo "User: $(whoami)"' | ./execute-bash-code.ts
```

**Example: Multi-line bash script**
```bash
echo '#!/bin/bash
for i in {1..5}; do
  echo "Number: $i"
done' | ./execute-bash-code.ts
```

**Example: From a file**
```bash
cat my-script.sh | ./execute-bash-code.ts
```

### Retrieving Output Files

When executing code that generates files, include commands to display the file contents in your code.

**Example: Generate JSON and retrieve it**
```bash
echo 'import json
data = {"users": [{"id": i, "name": f"user{i}"} for i in range(5)]}
with open("data.json", "w") as f:
    json.dump(data, f, indent=2)

# Read and display the file
with open("data.json") as f:
    print(f.read())' | ./execute-python-code.ts
```

**Example: Generate CSV with bash**
```bash
echo 'cat > data.csv << EOF
name,email,age
Alice,alice@example.com,30
Bob,bob@example.com,25
EOF

echo "=== Generated CSV ==="
cat data.csv' | ./execute-bash-code.ts
```

**Example: TypeScript with file output**
```bash
echo 'import { writeFileSync, readFileSync } from "fs";

const data = {
  timestamp: new Date().toISOString(),
  values: Array.from({ length: 5 }, () => Math.random())
};

writeFileSync("result.json", JSON.stringify(data, null, 2));
console.log("Generated result.json:");
console.log(readFileSync("result.json", "utf-8"));' | ./execute-node-code.ts
```

**How it works:**
- Code runs directly in the E2B sandbox environment
- Files created in `/home/user/` or current directory persist during the session
- Include file reading commands (cat, print, console.log) in your code to retrieve output
- Sandbox is ephemeral - files are deleted after session ends
- No Claude Code CLI overhead - just direct code execution

