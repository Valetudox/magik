# Intent: Decision Domain

- I need to make technical/architectural decisions with systematic evaluation.
- I want to compare multiple options against decision drivers using an evaluation matrix.
- I want to store/load/edit decision documents with full context and reasoning.
- I want to be able to edit these with an AI agent and with in-place editing.
- I want to be able to upload the result to Confluence

## Data Model

Each decision must have the following at least:

- Problem definition
- Components (systems affected)
- Use cases
- Decision drivers (evaluation criteria)
- Options (alternatives)
- Evaluation matrix (option × driver ratings with details)
- Proposal (selected solution with reasoning)
- Confluence link (optional)

Each driver must have:

- Id
- Name
- Description (plain text, max 500 chars)

Each option must have:

- Id
- Name
- Description (plain text, max 200 chars)
- More link (optional URL)
- Architecture diagram (optional Mermaid or link)

Each evaluation must have:

- Option id
- Driver id
- Rating (high/medium/low)
- Evaluation details (array of strings)

Each component must have:

- Id
- Name
- Description

Each use case must have:

- Id
- Name
- Description

Each proposal must have:

- Description
- Reasoning (array of strings)

## Requirements
- The rendered output must show the evaluation matrix as a table (options × drivers)
- I want real-time file watching to notify of changes
- I want to select one option as the final decision
