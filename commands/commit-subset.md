---
description: Commit subset of changes to the current branch
---

You must commit a specific subset of changes based on the provided arguments.

## Process

1. **Check current git status**

```bash
git status
```

If there are no changes, I'll exit.

2. **Analyze all available changes**

```bash
git diff --stat
git diff --name-status
```

3. **Review changes in detail**

```bash
git diff
```

4. **Select subset based on arguments: $ARGUMENTS**
   I'll analyze and select only the changes that are relevant to: $ARGUMENTS
   This includes:

- Files directly related to the specified feature/area
- Dependencies required for those changes
- Test files related to the changes

5. **Stage selected changes**

```bash
# Example staging pattern based on arguments
git add [selected files matching the criteria]
```

6. **Check commit message conventions**

```bash
git log --oneline -10
```

7. **Formulate focused commit message**
   I'll create a commit message that:

- Describes only the staged subset of changes
- Follows the project's commit conventions
- Clearly indicates the scope of the commit

8. **Commit the staged changes**

```bash
git commit -m "type(scope): description of subset changes"
```

9. **Verify commit and show remaining changes**

```bash
git log --oneline -1
git status
```
