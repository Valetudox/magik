---
name: async-pr-from-issue
description: Create async PR from an issue, tag it as ready-to-implement, and close the issue
---

CRITICAL: Create GitHub pull request from an issue and manage issue lifecycle

Your task is to:

1. Get the issue title from the provided issue ID
2. Get the issue details
3. Create a pull request using the async skill
4. Tag the issue with "ready-to-implement" label
5. Close the issue

## User Input

Issue ID: $1

## Process

Execute these steps in sequence:

1. **Fetch issue details**

```bash
gh issue view $1 --json title,url
```

2. **Create async PR with issue URL and title**
   Use the async skill to create a PR with description: "https://github.com/Valetudox/magik/issues/$1 implement this please"

3. **Add label to issue**

```bash
gh issue edit $1 --add-label "ready-to-implement"
```

4. **Close the issue**

```bash
gh issue close $1 --comment "Implementation PR created. Work will be done asynchronously."
```

After completing all steps, tell the user:

- The PR number and URL
- Confirmation that issue was labeled and closed
- How to monitor: `gh pr checks <PR_NUMBER> --watch`
