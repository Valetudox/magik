---
description: Analyze changes and commit them in logical segments
---

You must analyze the current changes and create multiple logical commits by grouping related modifications together.

## Process

1. **Check git status and analyze all changes**

```bash
git status
git diff --name-status
```

2. **Analyze changes by category**

```bash
git diff --stat
```

3. **Group changes into logical segments**
   I'll categorize changes into groups.

4. **Identify dependencies between changes**
   I'll ensure that:

- Independent changes are committed separately
- Dependent changes are committed in the correct order
- Each commit is atomic and can stand alone

5. **Review commit history for conventions**

```bash
git log -10
```

6. **Create segmented commits**
   For each identified segment:

- Stage only the relevant files or changes for that segment
- Create a focused commit message describing that specific change
- Commit the segment

Example execution:

```bash
# Segment 1: Test improvements
git add apps/cli-e2e/src/cli.e2e.spec.ts
git commit -m "test(cli): improve e2e test coverage"

# Segment 2: Core feature - tf-gcp-differ enhancements
git add packages/tf-gcp-differ/src/lib/differ.factory.ts
git add packages/tf-gcp-differ/src/lib/differ.ts
git add packages/tf-gcp-differ/src/lib/schemas.ts
git add packages/tf-gcp-differ/src/lib/transformers.ts
git add packages/tf-gcp-differ/src/lib/types.ts
git commit -m "feat(tf-gcp-differ): enhance differ functionality with improved schemas and transformers"

# Segment 3: CLI commands updates
git add apps/cli/src/commands/tools/export-terraform-assets.ts
git add apps/cli/src/commands/tools/tf-gcp-differ.ts
git commit -m "feat(cli): update terraform asset export and differ commands"

# Segment 4: Scripts and configuration
git add apps/cli/src/scripts/create-temp-workspace.sh
git add apps/cli/src/scripts/export-terraform-assets.sh
git add package.json
git commit -m "chore: update build scripts and package configuration"
```

7. **Verify all changes are committed**

```bash
git status
git log --oneline -n [number_of_segments_created]
```

The goal is to create a clean, logical commit history where each commit:

- Has a single, clear purpose
- Can be reviewed independently
- Follows the project's commit message conventions
- Maintains the codebase in a working state
