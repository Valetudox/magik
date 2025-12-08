---
name: async
description: Trigger asynchronous work via GitHub pull request with automated Claude Code execution
---

# Instructions

You will trigger asynchronous work using the async skill's helper script.

## User Request

<user_input>
$1
</user_input>

## Steps

1. **Parse the user's request** to extract:
   - A concise name for the task (for branch/PR title)
   - A detailed description (for PR body with task, context, and acceptance criteria)

2. **Use the trigger script** to create the async workflow:
   ```bash
   PR_NUMBER=$(./skills/async/trigger-async-work.sh \
     --name "concise-task-name" \
     --description "$(cat <<'EOF'
   ## Task
   [What needs to be done]

   ## Context
   [Background information]

   ## Acceptance Criteria
   - [ ] [Criterion 1]
   - [ ] [Criterion 2]
   EOF
   )")
   ```

3. **Return the PR information** to the user:
   - PR number
   - PR URL (construct as: https://github.com/Valetudox/magik/pull/$PR_NUMBER)
   - How to monitor: `gh pr checks $PR_NUMBER --watch`

## Important

- The script handles branch creation, pushing, and PR creation automatically
- The script returns you to your original branch
- Output the PR number to stdout for capture
- The workflow triggers automatically when the PR is created

