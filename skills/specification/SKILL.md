---
name: specification
description: MUST use it for create or update specifications based on an ask
---

# Specification

A toolkit for creating a specification based on a user input.

## Overview

This skill provides a guideline on how to create a specification based on a user input.

## Requirements

- Focus on WHAT the system should do, not HOW it should be implemented

## Workflow

1. **Clarify requirements**: If something is not clear, ask clarification questions until it is clear
   - Ask about user workflows and expected behavior
   - Ask about different scenarios and edge cases
   - Do NOT ask technical implementation questions

2. **Create specification**: Create the specification JSON based on the EARS format
   - Use appropriate EARS requirement types (ubiquitous, event-driven, state-driven, etc.)
   - Organize requirements into logical sections
   - Write from user perspective using clear, simple language

3. **Save to /tmp**: Write the specification to the `/tmp` folder with timestamp filename
   - Format: `/tmp/spec_{timestamp}.json` (e.g., `/tmp/spec_1733229000000.json`)
   - Use current timestamp in milliseconds

4. **Validate**: Run the validation script from the skill directory
   - Execute: `validate-specification.sh /tmp/{filename}.json`
   - The script uses Node.js with AJV to properly validate against both schemas
   - If validation fails, fix the errors and re-validate

5. **Respond**: Provide the user with the specification file path and a summary

## EARS Format

EARS (Easy Approach to Requirements Syntax) is a structured format for writing clear requirements.

### Requirement Types:

1. **Ubiquitous**: Always active requirements
   - Template: `The <system name> shall <system response>`
   - Example: "The mobile phone shall have a mass of less than 150 grams"

2. **Event-driven**: Triggered by events
   - Template: `When <trigger>, the <system name> shall <system response>`
   - Example: "When 'mute' is selected, the laptop shall suppress all audio output"

3. **State-driven**: Active during specific states
   - Template: `While <precondition(s)>, the <system name> shall <system response>`
   - Example: "While there is no card in the ATM, the ATM shall display 'insert card'"

4. **Optional feature**: Apply when features are included
   - Template: `Where <feature is included>, the <system name> shall <system response>`
   - Example: "Where the car has a sunroof, the car shall have a sunroof control panel"

5. **Unwanted behaviour**: Handle error conditions
   - Template: `If <trigger>, then the <system name> shall <system response>`
   - Example: "If an invalid credit card number is entered, then the website shall display 'please re-enter'"

6. **Complex**: Combinations of the above
   - Template: `While <precondition>, When <trigger>, the <system name> shall <system response>`

More details: https://alistairmavin.com/ears/

## Specification Format

The specification JSON must include:

- `title`: Clear title of what is being specified
- `description`: High-level description of the system/feature
- `requirements`: Array of requirement sections
  - Each section has a `sectionName` and array of `items`
  - Each item follows the EARS schema format

See `specification-schema.json` for the complete structure.

## Tips for Good Specifications

- Use "the system" as the systemName for consistency
- Group related requirements into logical sections
- Write clear, testable requirements
- Avoid technical implementation details
- Focus on user-observable behavior
- Use simple, unambiguous language
