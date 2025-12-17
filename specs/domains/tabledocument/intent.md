# Intent: Table Document Domain

- I have a list of use cases which forms a group.
- I want to store/load/edit these groups.
- I want to be able to edit these with an AI agent and with in place editing.
- I want to upload the document into confluence

## Data Model

Each group must have the followings at least:

- Confluence url
- Use cases

Each use case must have the following fields at least:

- An id
- A short name
- A mermaid diagram
- Required Contexts (string of arrays)
- Required Tools (string of arrays)
- Potential interactions (string of arrays)
- Notes (string of arrays)

## Requirements

- The rendered output and the editing screen
  - must be a table
  - each row is a use case
