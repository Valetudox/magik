# Code Generation with Plop.js

This project uses [Plop.js](https://plopjs.com/) to generate boilerplate code and ensure consistency across the codebase. Code generators help streamline development by creating files that follow the repository's established patterns.

## Table of Contents

- [Getting Started](#getting-started)
- [Available Generators](#available-generators)
  - [Backend Service Generator](#backend-service-generator)
  - [API Action Generator](#api-action-generator)
  - [ESLint Rule Generator](#eslint-rule-generator)
  - [Documentation Generator](#documentation-generator)
  - [Validation Script Generator](#validation-script-generator)
- [Project Structure](#project-structure)
- [Custom Helpers](#custom-helpers)
- [Extending Generators](#extending-generators)

## Getting Started

To use the code generators, run one of the following commands:

```bash
# Interactive mode - choose from available generators
bun run generate
# or
bun run plop

# Run a specific generator directly
bun run plop backend-service
bun run plop api-action
bun run plop eslint-rule
bun run plop documentation
bun run plop validation-script
```

## Available Generators

### Backend Service Generator

Generates a complete backend service with all required files following the repository's architecture.

**Command:**
```bash
bun run plop backend-service
```

**Prompts:**
- Service name (e.g., `decision`, `audio`, `specification`)
- Port number (default: 4000)
- Service description

**Generated Files:**
```
apps/backend-{service}/
├── src/
│   ├── index.ts           # Main entry point with Fastify setup
│   ├── routes.ts          # Route registration
│   ├── actions/           # Action handlers (empty)
│   └── services/          # Business logic services (empty)
├── package.json           # Service dependencies
├── tsconfig.json          # TypeScript configuration
├── eslint.config.js       # ESLint configuration
├── Dockerfile             # Docker configuration
├── openapi.yaml           # OpenAPI specification
└── .gitignore            # Git ignore rules
```

**Example:**
```bash
? Service name: notification
? Port number: 4003
? Service description: notification service
```

This creates a fully configured backend service at `apps/backend-notification/` with:
- Fastify server setup
- CORS configured
- Health check endpoint
- Docker support with health checks
- ESLint and TypeScript configured
- Ready-to-use folder structure

### API Action Generator

Generates an API action handler file following the route-to-folder pattern.

**Command:**
```bash
bun run plop api-action
```

**Prompts:**
- Backend service name (e.g., `decision`, `audio`)
- API route (e.g., `/api/decisions/:id/options/:optionId`)
- HTTP method (get, post, patch, delete, put)
- Function name (e.g., `updateOption`, `createDecision`)

**Generated File:**
```typescript
// Example: apps/backend-decision/src/actions/decisions/[id]/options/[optionId]/patch.action.ts

import type { FastifyRequest, FastifyReply } from 'fastify'

interface UpdateOptionParams {
  id: string
  optionId: string
}

interface UpdateOptionBody {
  // TODO: Define your request body interface
}

export async function updateOption(
  request: FastifyRequest<{ Params: UpdateOptionParams; Body: UpdateOptionBody }>,
  reply: FastifyReply
) {
  try {
    const { id, optionId } = request.params
    const body = request.body

    // TODO: Implement your logic here

    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
```

**Route-to-Path Conversion:**
- `/api/decisions/:id` → `actions/decisions/[id]/`
- `/api/decisions/:id/options/:optionId` → `actions/decisions/[id]/options/[optionId]/`

The generator automatically:
- Creates the correct nested folder structure
- Extracts route parameters and generates TypeScript interfaces
- Generates appropriate function signatures based on HTTP method
- Includes error handling boilerplate

### ESLint Rule Generator

Generates a custom ESLint rule with test scaffolding.

**Command:**
```bash
bun run plop eslint-rule
```

**Prompts:**
- Rule name (kebab-case, e.g., `no-console-log`)
- Rule description

**Generated Files:**
```
eslint-rules/
├── {rule-name}.js          # Rule implementation
└── tests/
    └── {rule-name}.test.js # Rule tests
```

**Example Rule Structure:**
```javascript
// eslint-rules/no-console-log.js
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow console.log statements',
      recommended: false,
    },
    fixable: null,
    schema: [],
    messages: {
      noConsoleLog: 'Disallow console.log statements',
    },
  },

  create(context) {
    return {
      // TODO: Implement your rule logic here
    }
  },
}
```

### Documentation Generator

Generates standardized markdown documentation with a consistent template.

**Command:**
```bash
bun run plop documentation
```

**Prompts:**
- Documentation type (backend, frontend, api, architecture, guide)
- Document title
- Filename (without .md extension)

**Generated File:**
```
documentation/{type}/{filename}.md
```

The template includes standard sections:
- Overview
- Purpose
- Usage (with code examples)
- Details
- Best Practices
- Related Documentation

### Validation Script Generator

Generates a shell script for validation or linting purposes.

**Command:**
```bash
bun run plop validation-script
```

**Prompts:**
- Script name (e.g., `validate-routes`, `check-imports`)
- Script description

**Generated File:**
```bash
#!/usr/bin/env bash
# {description}

set -e

echo "Running {script-name}..."

# TODO: Implement your validation logic here

echo "✓ {script-name} completed successfully"
```

The script is placed in `scripts/lints/{script-name}.sh` with executable permissions.

## Project Structure

```
.
├── plopfile.js                    # Main Plop configuration
├── plop-templates/                # Handlebars templates
│   ├── backend-service/
│   │   ├── src/
│   │   │   ├── index.ts.hbs
│   │   │   ├── routes.ts.hbs
│   │   │   └── actions/
│   │   ├── package.json.hbs
│   │   ├── tsconfig.json.hbs
│   │   ├── Dockerfile.hbs
│   │   └── openapi.yaml.hbs
│   ├── api-action/
│   │   └── action.ts.hbs
│   ├── eslint-rule/
│   │   ├── rule.js.hbs
│   │   └── test.js.hbs
│   ├── documentation/
│   │   └── doc.md.hbs
│   └── validation-script/
│       └── script.sh.hbs
└── plop-helpers/                  # Custom helper functions
    ├── route-parser.js            # Route parsing utilities
    ├── string-helpers.js          # String transformation helpers
    └── validators.js              # Input validation functions
```

## Custom Helpers

The code generators use several custom Handlebars helpers:

### String Helpers
- `camelCase`: Converts to camelCase (e.g., `my-service` → `myService`)
- `pascalCase`: Converts to PascalCase (e.g., `my-service` → `MyService`)
- `uppercase`: Converts to UPPER_CASE (e.g., `my-service` → `MY_SERVICE`)
- `contains`: Checks if string contains substring

### Route Helpers
- `routeToPath`: Converts route to file path (e.g., `/api/decisions/:id` → `actions/decisions/[id]`)
- `extractParams`: Extracts parameters from route (e.g., `/api/decisions/:id` → `['id']`)
- `calculateImportDepth`: Calculates nesting depth for imports
- `hasParams`: Checks if route has parameters

### Utility Helpers
- `importPath`: Generates relative import path (e.g., `../../../`)
- `date`: Returns current date in ISO format
- `eq`: Equality comparison for conditionals
- `or`: Logical OR for conditionals

## Extending Generators

To add a new generator:

1. **Create templates** in `plop-templates/{generator-name}/`
2. **Add generator configuration** in `plopfile.js`:

```javascript
plop.setGenerator('my-generator', {
  description: 'Generator description',
  prompts: [
    {
      type: 'input',
      name: 'myInput',
      message: 'Enter value:',
      validate: (value) => value ? true : 'Value required'
    }
  ],
  actions: [
    {
      type: 'add',
      path: 'path/to/{{myInput}}.ts',
      templateFile: 'plop-templates/my-generator/template.hbs'
    }
  ]
})
```

3. **Create Handlebars templates** using `.hbs` extension:

```handlebars
// plop-templates/my-generator/template.hbs
export class {{pascalCase myInput}} {
  constructor() {
    // Generated code
  }
}
```

## Benefits

Using these code generators provides:

1. **Consistency**: All generated code follows established patterns
2. **Speed**: Reduce boilerplate creation time by 80%
3. **Error Reduction**: Eliminate manual errors in file structure and naming
4. **Best Practices**: Built-in validation ensures code quality
5. **Onboarding**: New developers can quickly generate correct code
6. **Documentation**: Generators serve as executable documentation of patterns

## Best Practices

1. **Always use generators** for new backend services and API actions
2. **Review generated code** and fill in TODOs
3. **Run linters** after generating code to ensure compliance
4. **Update templates** if patterns change
5. **Add validation** to prevent invalid inputs
6. **Document changes** when modifying generators

## Troubleshooting

### Generator not found
```bash
# List available generators
bun run plop
```

### Validation error
Make sure inputs follow the required format:
- Service names: kebab-case (lowercase with hyphens)
- Routes: must start with `/api/`
- Function names: camelCase

### File already exists
Use `--force` flag to overwrite existing files:
```bash
bun run plop api-action --force
```

---

*Last updated: 2024-12-10*
