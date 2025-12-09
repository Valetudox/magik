export function createUserPrompt(
  documentJson: string,
  userAsk: string,
  schemaJson: string
): string {
  return `
<task>
Your task is to modify a table document based on the user's request. You will analyze the current document, understand the user's ask, and generate a set of structured changes to transform the document accordingly.
</task>

<user_ask>
${userAsk}
</user_ask>

<current_document>
${documentJson}
</current_document>

<schema>
You must report changes using the following schema:

${schemaJson}

Each change is a jq-like operation that describes a single transformation:
- Add operations create new use cases
- Update operations modify existing use cases by ID
- Remove operations delete use cases by ID
- Set operations update top-level properties like confluence_url
</schema>

<workflow>
1. Analyze the current table document structure
2. Understand what the user is asking for
3. Determine what changes are needed to fulfill the request
4. Generate the minimal set of TableDocumentChange operations
5. Validate that all changes are consistent (e.g., don't reference non-existent IDs)
6. Use the report tool to submit the changes
</workflow>

<examples>
Example 1 - Adding a new use case:
User asks: "Add a use case about changing the hero image dynamically based on user segment"
Changes: [
  {
    "type": "addUseCase",
    "useCase": {
      "id": "dynamic-hero",
      "use_case": "Change the hero image dynamically based on user segment (VIP vs Regular)",
      "diagram": "graph TD\\n    A[\\"User Request\\"] --> B[\\"Find Block\\"]\\n    B --> C[\\"Find Segment\\"]\\n    C --> D[\\"Update Image\\"]",
      "required_context": ["Email Content Structure", "User Segments", "Asset Library"],
      "required_tools": ["Block selector", "Segment filter", "Image updater"],
      "potential_interactions": ["Multiple hero blocks", "Multiple segment candidates"],
      "notes": ["May require different images for each segment"]
    }
  }
]

Example 2 - Updating an existing use case:
User asks: "Update the first use case to also mention personalization"
Changes: [
  {
    "type": "updateUseCase",
    "useCaseId": "hero-image-use-case-id",
    "updates": {
      "use_case": "Add a personalized hero image block at the top of the email with the summer sale banner"
    }
  }
]

Example 3 - Removing a use case:
User asks: "Remove the countdown timer use case"
Changes: [
  {
    "type": "removeUseCase",
    "useCaseId": "countdown-use-case-id"
  }
]

Example 4 - Setting confluence URL:
User asks: "Set the Confluence page URL to https://example.com/wiki/page/123"
Changes: [
  {
    "type": "setConfluenceUrl",
    "url": "https://example.com/wiki/page/123"
  }
]
</examples>

<important>
- Generate ALL necessary changes to fully satisfy the user's request
- Ensure IDs are unique and follow kebab-case naming
- Validate that referenced IDs (in updates) actually exist in the current document
- Keep descriptions clear and concise
- When adding Mermaid diagrams, use proper Mermaid syntax
- Array fields (required_context, required_tools, etc.) should contain meaningful items
</important>
`
}
