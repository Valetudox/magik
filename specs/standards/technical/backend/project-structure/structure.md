# Backend Service Structure

## Directory Structure

All backend services MUST be located in the `apps/` directory with the naming convention `backend-{service-name}`.

### Examples
- `apps/backend-audio/`
- `apps/backend-decision/`
- `apps/backend-specification/`
- `apps/backend-socket/`

## Required Files and Folders

### Root Level Files

Every backend service MUST include the following files at the root level:

1. **Dockerfile** - Container configuration for the service
2. **eslint.config.js** - ESLint configuration that extends the base config
3. **package.json** - Node.js package configuration
4. **tsconfig.json** - TypeScript configuration that extends the base config
5. **src/** - Source code directory

### OpenAPI Specification

The OpenAPI specification MUST be located in:
- `specs/domains/{domain}/openapi.yaml`

Where `{domain}` matches the service name without the `backend-` prefix.
For example: `backend-decision` → `specs/domains/decision/openapi.yaml`

### Optional Root Level Files

- **.dockerignore** - Files to exclude from Docker builds

## Source Code Structure

### Required src/ Files

Every backend service MUST have the following files in the `src/` directory:

1. **index.ts** - Application entry point
2. **config.ts** - Configuration and environment variables (ONLY place to access `process.env`)
3. **routes.ts** - Route registration
4. **types.ts** - TypeScript type definitions
5. **actions/** - Action handlers directory

**IMPORTANT**: The `config.ts` file is the ONLY file allowed to access `process.env`. All other files MUST import configuration values from `config.ts`.

### Optional src/ Folders

- **services/** - Business logic services
- **utils/** - Utility functions

## File Naming Conventions

### Action Files

All action files MUST use the `.action.ts` postfix:

- `createDecision.action.ts`
- `deleteDecision.action.ts`
- `getDecision.action.ts`
- `listDecisions.action.ts`
- `updateDecision.action.ts`

### Service Files

Service files SHOULD use the `.service.ts` postfix:

- `decision.service.ts`
- `specification.service.ts`

## Actions Directory Structure

Actions MUST be organized using **folder-based routing** (Next.js-style conventions):

### Routing Convention Rules

1. **Static segments** → Regular folders (kebab-case)
   - `/api/decisions` → `actions/decisions/`
   - `/api/decisions/:id/push-to-confluence` → `actions/decisions/[id]/push-to-confluence/`

2. **Dynamic segments** → Folders with brackets
   - `:id` → `[id]/`
   - `:optionId` → `[optionId]/`
   - `:driverId` → `[driverId]/`

3. **Action files** → Named by HTTP method only
   - `GET` → `get.action.ts`
   - `POST` → `post.action.ts`
   - `PATCH` → `patch.action.ts`
   - `DELETE` → `delete.action.ts`

### Simple Example

```
src/
└── actions/
    └── specifications/
        ├── get.action.ts              (GET /api/specifications)
        ├── post.action.ts             (POST /api/specifications)
        └── [id]/
            └── get.action.ts          (GET /api/specifications/:id)
```

### Complex Example (Nested Resources)

```
src/
└── actions/
    └── decisions/
        ├── get.action.ts                              (GET /api/decisions)
        ├── post.action.ts                             (POST /api/decisions)
        └── [id]/
            ├── get.action.ts                          (GET /api/decisions/:id)
            ├── patch.action.ts                        (PATCH /api/decisions/:id)
            ├── delete.action.ts                       (DELETE /api/decisions/:id)
            ├── push-to-confluence/
            │   └── post.action.ts                     (POST /api/decisions/:id/push-to-confluence)
            ├── evaluations/
            │   ├── patch.action.ts                    (PATCH /api/decisions/:id/evaluations)
            │   └── details/
            │       └── patch.action.ts                (PATCH /api/decisions/:id/evaluations/details)
            └── options/
                ├── post.action.ts                     (POST /api/decisions/:id/options)
                └── [optionId]/
                    ├── patch.action.ts                (PATCH /api/decisions/:id/options/:optionId)
                    └── delete.action.ts               (DELETE /api/decisions/:id/options/:optionId)
```

### Route to File Path Mapping

| Route | File Path |
|-------|-----------|
| `GET /api/decisions` | `actions/decisions/get.action.ts` |
| `GET /api/decisions/:id` | `actions/decisions/[id]/get.action.ts` |
| `PATCH /api/decisions/:id` | `actions/decisions/[id]/patch.action.ts` |
| `POST /api/decisions/:id/options` | `actions/decisions/[id]/options/post.action.ts` |
| `PATCH /api/decisions/:id/options/:optionId` | `actions/decisions/[id]/options/[optionId]/patch.action.ts` |

### Import Pattern in routes.ts

Actions are imported directly from their file paths (no index.ts):

```typescript
import { listDecisions } from './actions/decisions/get.action'
import { createDecision } from './actions/decisions/post.action'
import { getDecision } from './actions/decisions/[id]/get.action'
import { updateDecision } from './actions/decisions/[id]/patch.action'
import { deleteDecision } from './actions/decisions/[id]/delete.action'
```

**Note:** `index.ts` files are NOT allowed in action folders. Import directly from action files.

### Benefits of Folder-Based Routing

✅ **Industry standard**: Matches Next.js/Nuxt conventions
✅ **Visual hierarchy**: Folder structure shows route nesting
✅ **Cleaner filenames**: Just HTTP method instead of `get_id_optionId`
✅ **Easier navigation**: Clear separation of static vs dynamic segments
