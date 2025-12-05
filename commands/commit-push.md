---
description: Push commits to remote after pulling with rebase and handling conflicts
---

I'll push your commits to the remote repository with proper conflict handling:

1. First, I'll check the current git status and fetch the latest changes from remote
2. Pull with rebase to incorporate any remote changes
3. If conflicts occur, I'll guide you through resolution
4. Once clean, push your commits to remote

Let me start by checking the current state and fetching remote changes:

```bash
git status && git fetch origin
```

Now I'll pull with rebase:

```bash
git pull --rebase origin $(git branch --show-current)
```

If the rebase was successful, I'll push your commits:

```bash
git push origin $(git branch --show-current)
```

If there were conflicts during rebase, I'll help you:

- Identify the conflicted files
- Guide you through manual resolution
- Continue the rebase process once resolved
- Complete the push once everything is clean
