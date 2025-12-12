# Backend Validation Tools

Four tools validate backend service structure and OpenAPI specs:

## 1. Bash Script (`scripts/lints/backend/validate-structure.sh`)

Validates required files/directories exist (Dockerfile, openapi.yaml, src/, etc.) and no invalid folders in src/.

```bash
./scripts/lints/backend/validate-structure.sh
```

## 2. ESLint (`eslint.config.backend.js`)

Validates naming conventions:
- File naming: `*.action.ts` in actions/, `*.service.ts` in services/
- Folder naming: kebab-case or `[param]` for dynamic routes
- Restricts `process.env` access to `config.ts` only

```bash
cd apps/backend-audio && bun run lint
```

## 3. Route-Action Validator (`scripts/lints/backend/validate-route-actions.ts`)

Ensures routes in `routes.ts` have matching action files in correct folder structure.

**Mapping:** `/api/decisions/:id` → `actions/decisions/[id]/get.action.ts`

```bash
bun run scripts/lints/backend/validate-route-actions.ts
```

## 4. Spectral (`.spectral.yaml`)

Validates OpenAPI specs for standards compliance and project requirements:
- `/health` endpoint required
- Standard `Error` schema
- All operations have `operationId` and summaries
- Error responses reference Error schema

```bash
bun run lint:openapi
```

## Division of Responsibility

| Tool | Validates |
|------|-----------|
| **Bash Script** | Required files/dirs exist, no invalid folders |
| **ESLint** | Naming conventions, process.env access |
| **Route-Action** | Route-to-file mapping, missing/orphaned actions |
| **Spectral** | OpenAPI schema, health endpoint, Error schema, operationIds |

All four tools are needed for complete validation.
