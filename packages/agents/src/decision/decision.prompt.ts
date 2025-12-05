export function createUserPrompt(
  decisionJson: string,
  userAsk: string,
  schemaJson: string
): string {
  return `
<task>
Your task is to modify a decision document based on the user's request. You will analyze the current decision, understand the user's ask, and generate a set of structured changes to transform the decision accordingly.
</task>

<user_ask>
${userAsk}
</user_ask>

<current_decision>
${decisionJson}
</current_decision>

<schema>
You must report changes using the following schema:

${schemaJson}

Each change is a jq-like operation that describes a single transformation:
- Add operations create new items (components, drivers, options, evaluations)
- Update operations modify existing items by ID
- Remove operations delete items by ID
- Set operations update top-level properties
</schema>

<workflow>
1. Analyze the current decision document structure
2. Understand what the user is asking for
3. Determine what changes are needed to fulfill the request
4. Generate the minimal set of DecisionChange operations
5. Validate that all changes are consistent (e.g., don't reference non-existent IDs)
6. Use the report tool to submit the changes
</workflow>

<examples>
Example 1 - Adding a new component:
User asks: "Add a new component called 'Analytics' that handles data collection"
Changes: [
  {
    "type": "addComponent",
    "component": {
      "id": "analytics",
      "name": "Analytics",
      "description": "Handles data collection and analytics tracking"
    }
  }
]

Example 2 - Updating problem definition:
User asks: "Update the problem to mention performance concerns"
Changes: [
  {
    "type": "updateProblemDefinition",
    "problemDefinition": "We need to decide on the architecture while considering performance constraints..."
  }
]

Example 3 - Adding an option with evaluation:
User asks: "Add a new option 'Use Redis' and rate it high for performance"
Changes: [
  {
    "type": "addOption",
    "option": {
      "id": "redis-option",
      "name": "Use Redis",
      "description": "Implement caching layer using Redis"
    }
  },
  {
    "type": "addEvaluation",
    "evaluation": {
      "optionId": "redis-option",
      "driverId": "performance",
      "rating": "high",
      "evaluationDetails": ["Redis provides excellent performance for caching"]
    }
  }
]
</examples>

<important>
- Generate ALL necessary changes to fully satisfy the user's request
- Ensure IDs are unique and follow kebab-case naming
- Validate that referenced IDs (in updates/evaluations) actually exist
- Keep descriptions clear and concise
- Use proper ratings: "high", "medium", or "low"
</important>
`
}
