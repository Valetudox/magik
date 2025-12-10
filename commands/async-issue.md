---
name: async-issue
description: Create GitHub planning issue directly without research
---

CRITICAL: Create GitHub issue immediately without ANY research or exploration.

Do NOT use Read, Glob, Grep, Task, or any exploration tools.

Your ONLY task:
1. Extract a concise title from the user's input (first sentence or main topic)
2. Use the user's exact input as the issue description
3. Call trigger-issue.sh with the planning label
4. Report the issue number and URL

## User Request

<user_input>
$1
</user_input>

Execute this command now:
```bash
./skills/async/trigger-issue.sh \
  --label "planning" \
  --title "<extract title from user input>" \
  --description "<user's full input verbatim>"
```

After creating the issue, tell the user:
- The issue number
- The issue URL
- How to monitor it: `gh issue view <number> --comments`
