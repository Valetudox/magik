# Migration from Plop to Hygen

This document describes the migration from Plop to Hygen for code generation in the Magik repository.

## What Changed

### Technology Stack
- **Removed**: Plop.js (interactive-only generator)
- **Added**: Hygen (supports both interactive and non-interactive modes)
- **Added**: Custom CLI wrapper (`generate.js`) for better command-line argument support

### File Structure

**Old Structure:**
```
generators/
├── helpers/
│   ├── route-parser.js
│   ├── string-helpers.js
│   └── validators.js
└── templates/
    ├── backend-service/
    │   └── *.hbs (Handlebars templates)
    └── api-action/
        └── *.hbs
plopfile.js
```

**New Structure:**
```
_templates/
├── backend-service/
│   └── new/
│       ├── prompt.js (includes validation)
│       └── *.ejs.t (EJS templates)
└── api-action/
    └── new/
        ├── prompt.js (includes validation)
        └── *.ejs.t
generate.js (CLI wrapper)
```

### Command Changes

**Old Commands:**
```bash
bun run plop
bun run generate  # alias for plop
bun run plop backend-service
bun run plop api-action
```

**New Commands:**
```bash
# Interactive mode
bun run generate:backend-service
bun run generate:api-action

# Non-interactive mode (NEW - for AI agents)
bun run generate backend-service --serviceName myservice --port 4000 --description "My service"
bun run generate api-action --serviceName myservice --route /api/test --method get --functionName testFunc

# Direct hygen usage
hygen backend-service new --serviceName myservice --port 4000
hygen api-action new --serviceName myservice --route /api/test --method get --functionName testFunc
```

## Key Features

### Non-Interactive Mode
The main advantage of Hygen is support for non-interactive mode, which allows AI agents to generate code without manual prompts:

```bash
bun run generate backend-service \
  --serviceName notification \
  --port 4003 \
  --description "Notification management service"

bun run generate api-action \
  --serviceName notification \
  --route /api/notifications/:id \
  --method get \
  --functionName getNotification
```

### Validation Preserved
All validation logic from the old Plop generators has been preserved:
- Service names must be in kebab-case
- Port numbers must be between 1 and 65535
- Routes must start with `/api/`
- Function names must be in camelCase

### Template Conversion
Templates have been converted from Handlebars (`.hbs`) to EJS (`.ejs.t`):

**Handlebars Syntax:**
```handlebars
{{serviceName}}
{{pascalCase serviceName}}
{{#if hasParams}}...{{/if}}
```

**EJS Syntax:**
```ejs
<%= serviceName %>
<%= h.changeCase.pascalCase(serviceName) %>
<% if (hasParams) { %>...<% } %>
```

### Helper Functions
Hygen includes the `change-case` library by default via `h.changeCase`:
- `h.changeCase.camelCase(str)` - converts to camelCase
- `h.changeCase.pascalCase(str)` - converts to PascalCase
- `h.changeCase.constantCase(str)` - converts to CONSTANT_CASE

Custom helper functions from `generators/helpers/` have been integrated into the `prompt.js` files.

## Migration Guide for Users

### For Interactive Usage
The workflow is similar, just use the new commands:

**Before:**
```bash
bun run plop
# Select "backend-service" or "api-action"
# Answer prompts
```

**After:**
```bash
bun run generate:backend-service
# Answer prompts (same questions)
```

### For Automated Usage (NEW)
You can now pass all parameters as command-line arguments:

```bash
bun run generate backend-service --serviceName test --port 4000 --description "Test"
bun run generate api-action --serviceName test --route /api/test --method get --functionName test
```

## Testing

Test the generators:

```bash
# Test backend-service generator
hygen backend-service new --serviceName test-service --port 4099 --description "Test service"

# Test api-action generator
hygen api-action new --serviceName test-service --route /api/test --method get --functionName testFunc

# Clean up test files
rm -rf apps/backend-test-service
```

## Troubleshooting

### Command not found: hygen
Make sure dependencies are installed:
```bash
bun install
```

### Validation errors
Check that your arguments match the expected format:
- Service names: kebab-case (e.g., `my-service`)
- Routes: must start with `/api/` (e.g., `/api/resource`)
- Function names: camelCase (e.g., `myFunction`)
- Port: number between 1-65535

### Template syntax errors
EJS syntax is different from Handlebars. Common conversions:
- `{{var}}` → `<%= var %>`
- `{{#if cond}}` → `<% if (cond) { %>`
- `{{/if}}` → `<% } %>`
- `{{#each items}}` → `<% items.forEach(item => { %>`
- `{{/each}}` → `<% }) %>`

## References

- [Hygen Documentation](https://www.hygen.io/)
- [Hygen Examples](./HYGEN_EXAMPLES.md)
- [EJS Documentation](https://ejs.co/)
