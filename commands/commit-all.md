---
description: Commit all changes to the current branch
---

I'll commit all the changes in the current branch with a comprehensive commit message.

## Process

1. **Check current git status**

```bash
git status
```

If there are no changes, I'll exit.

2. **Analyze all changes**

```bash
git diff --stat
git diff --name-status
```

3. **Review changes in detail**

```bash
git diff
```

4. **Check commit message conventions**

```bash
git log --oneline -10
```

5. **Formulate comprehensive commit message**
   I'll create a commit message that:

- Follows the project's commit conventions (type, scope, description)
- Summarizes all changes concisely
- Explains the overall purpose of the changes

6. **Stage all changes and commit**

```bash
git add .
git commit -m "type(scope): comprehensive description

Detailed explanation if needed for multiple changes"
```

7. **Verify commit was successful**

```bash
git status
git log --oneline -1
```
