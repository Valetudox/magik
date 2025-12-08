# Source Code Structure

## Required src/ Files

Every backend service MUST have the following files in the `src/` directory:

1. **index.ts** - Application entry point
2. **config.ts** - Configuration and environment variables (ONLY place to access `process.env`)
3. **routes.ts** - Route registration
4. **types.ts** - TypeScript type definitions
5. **actions/** - Action handlers directory

**IMPORTANT**: The `config.ts` file is the ONLY file allowed to access `process.env`. All other files MUST import configuration values from `config.ts`.

## Optional src/ Folders

- **services/** - Business logic services
- **utils/** - Utility functions

## File Naming Conventions

### Action Files

All action files MUST use the `.action.ts` postfix and be named by HTTP method:

- `get.action.ts` - For GET requests (list or single resource)
- `post.action.ts` - For POST requests (create)
- `patch.action.ts` - For PATCH requests (update)
- `delete.action.ts` - For DELETE requests (delete)

### Service Files

Service files SHOULD use the `.service.ts` postfix:

- `decision.service.ts`
- `specification.service.ts`

## Actions Directory Structure

Actions MUST be organized using **folder-based routing** where:
- Static route segments → Regular folders (kebab-case)
- Dynamic route segments → Folders with brackets: `[id]`, `[optionId]`, etc.
- Action files → Named by HTTP method: `get.action.ts`, `post.action.ts`, etc.

See [structure.md](./structure.md) for detailed examples and routing rules.

### Quick Example

```
src/
└── actions/
    └── decisions/
        ├── get.action.ts              (GET /api/decisions)
        ├── post.action.ts             (POST /api/decisions)
        └── [id]/
            ├── get.action.ts          (GET /api/decisions/:id)
            ├── patch.action.ts        (PATCH /api/decisions/:id)
            └── delete.action.ts       (DELETE /api/decisions/:id)
```

**Important:** `index.ts` files are NOT allowed in action folders. Actions are imported directly from their file paths in `routes.ts`:

```typescript
import { listDecisions } from './actions/decisions/get.action'
import { getDecision } from './actions/decisions/[id]/get.action'
```
