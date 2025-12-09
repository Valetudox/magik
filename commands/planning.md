---
name: planning
description: Trigger implementation planning via GitHub issue with automated Claude Code plan generation
---

Trigger implementation planning using the async skill's issue workflow.

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
   - A clear feature/bug title (for issue title)
   - A detailed description including:
     - Feature or bug description
     - Requirements (functional and non-functional)
     - Constraints (technical limitations or must-haves)
     - Context (background information)

3. **Use the trigger script** to create the planning issue:
   ```bash
   ISSUE_NUMBER=$(./skills/async/trigger-issue.sh \
     --label "planning" \
     --title "Feature/Bug title" \
     --description "$(cat <<'EOF'
   ## Feature Request / Bug Report
   [Clear description of what needs to be done]

   ## Requirements
   - [Functional requirement 1]
   - [Functional requirement 2]
   - [Non-functional requirement 3]

   ## Constraints
   - [Technical limitation or must-have 1]
   - [Technical limitation or must-have 2]

   ## Context
   [Background information about the codebase or why this is needed]
   EOF
   )")
   ```

4. **Return the issue information** to the user:
   - Issue number
   - Issue URL (construct as: https://github.com/Valetudox/magik/issues/$ISSUE_NUMBER)
   - How to monitor: `gh issue view $ISSUE_NUMBER --comments`

## Important

- Planning workflow posts detailed implementation plans as issue comments
- The workflow triggers automatically when the issue is created with the label
- Monitor progress with `gh issue view $ISSUE_NUMBER --comments`
- Plans include:
  - Problem analysis (for bugs) or feature overview (for features)
  - Technical analysis of affected components
  - Step-by-step implementation tasks
  - Considerations, risks, and estimates
