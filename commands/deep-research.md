---
name: deep-research
description: Trigger deep research via GitHub issue with automated Claude Code analysis
---

Trigger deep research using the async skill's issue workflow.

## User Request

<user_input>
$1
</user_input>

## Steps

1. **Check for uncommitted changes:**
   ```bash
   git status --short
   ```
   - If there are uncommitted changes, ask the user what to do with them

2. **Parse the user's request** to extract:
   - A clear research topic (for issue title)
   - A detailed research description including:
     - Research topic and objectives
     - Areas to explore
     - Expected deliverables

3. **Use the trigger script** to create the research issue:
   ```bash
   ISSUE_NUMBER=$(./skills/async/trigger-issue.sh \
     --label "deep-research" \
     --title "Research topic title" \
     --description "$(cat <<'EOF'
   ## Research Topic
   [Clear description of what needs to be researched]

   ## Areas to Explore
   - [Specific aspect 1]
   - [Specific aspect 2]
   - [Specific aspect 3]

   ## Context
   [Why this research is needed]

   ## Deliverables
   - [Expected output format]
   - [Comparison tables, recommendations, etc.]
   EOF
   )")
   ```

4. **Return the issue information** to the user:
   - Issue number
   - Issue URL (construct as: https://github.com/Valetudox/magik/issues/$ISSUE_NUMBER)
   - How to monitor: `gh issue view $ISSUE_NUMBER --comments`

## Important

- Deep research workflow posts comprehensive research reports as issue comments
- The workflow triggers automatically when the issue is created with the label
- Monitor progress with `gh issue view $ISSUE_NUMBER --comments`
- Research reports include analysis, comparisons, recommendations, and references
