# Plop.js Code Generation Examples

This document provides practical examples of using the plop.js code generators in the Magik repository.

## Quick Start

Run the code generator:
```bash
bun run generate
# or
bun run plop
```

## Example 1: Creating a New Backend Service

Generate a complete backend service for managing notifications:

```bash
bun run plop backend-service
```

**Input:**
- Service name: `notification`
- Port number: `4003`
- Service description: `Notification management service`

**Generated Structure:**
```
apps/backend-notification/
├── src/
│   ├── index.ts
│   ├── routes.ts
│   ├── actions/
│   └── services/
├── package.json
├── tsconfig.json
├── eslint.config.js
├── Dockerfile
├── openapi.yaml
└── .gitignore
```

**Next Steps:**
1. Update `config/config.js` to add `BACKEND_NOTIFICATION` port configuration
2. Add route handlers in `src/routes.ts`
3. Implement business logic in `src/services/`
4. Update docker-compose files if needed

## Example 2: Creating API Actions

### Simple GET Endpoint

Generate a list endpoint for notifications:

```bash
bun run plop api-action
```

**Input:**
- Backend service name: `notification`
- API route: `/api/notifications`
- HTTP method: `get`
- Function name: `listNotifications`

**Generated File:** `apps/backend-notification/src/actions/notifications/get.action.ts`

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'

export async function listNotifications(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // TODO: Implement your logic here
    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
```

### POST Endpoint with Body

Generate a create endpoint:

```bash
bun run plop api-action
```

**Input:**
- Backend service name: `notification`
- API route: `/api/notifications`
- HTTP method: `post`
- Function name: `createNotification`

**Generated File:** `apps/backend-notification/src/actions/notifications/post.action.ts`

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'

interface CreateNotificationBody {
  // TODO: Define your request body interface
}

export async function createNotification(
  request: FastifyRequest<{ Body: CreateNotificationBody }>,
  reply: FastifyReply
) {
  try {
    const body = request.body
    // TODO: Implement your logic here
    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
```

### Nested Route with Parameters

Generate an update endpoint for a specific notification:

```bash
bun run plop api-action
```

**Input:**
- Backend service name: `notification`
- API route: `/api/notifications/:id`
- HTTP method: `patch`
- Function name: `updateNotification`

**Generated File:** `apps/backend-notification/src/actions/notifications/[id]/patch.action.ts`

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'

interface UpdateNotificationParams {
  id: string
}

interface UpdateNotificationBody {
  // TODO: Define your request body interface
}

export async function updateNotification(
  request: FastifyRequest<{ Params: UpdateNotificationParams; Body: UpdateNotificationBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const body = request.body
    // TODO: Implement your logic here
    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
```

### Complex Nested Route

Generate an endpoint for managing notification preferences:

```bash
bun run plop api-action
```

**Input:**
- Backend service name: `notification`
- API route: `/api/notifications/:id/preferences/:preferenceId`
- HTTP method: `patch`
- Function name: `updateNotificationPreference`

**Generated File:** `apps/backend-notification/src/actions/notifications/[id]/preferences/[preferenceId]/patch.action.ts`

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'

interface UpdateNotificationPreferenceParams {
  id: string
  preferenceId: string
}

interface UpdateNotificationPreferenceBody {
  // TODO: Define your request body interface
}

export async function updateNotificationPreference(
  request: FastifyRequest<{ Params: UpdateNotificationPreferenceParams; Body: UpdateNotificationPreferenceBody }>,
  reply: FastifyReply
) {
  try {
    const { id, preferenceId } = request.params
    const body = request.body
    // TODO: Implement your logic here
    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
```

**After Generating Actions:**

Update `src/routes.ts` to register the new routes:

```typescript
import { listNotifications } from './actions/notifications/get.action'
import { createNotification } from './actions/notifications/post.action'
import { updateNotification } from './actions/notifications/[id]/patch.action'
import { updateNotificationPreference } from './actions/notifications/[id]/preferences/[preferenceId]/patch.action'

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/health', () => ({ status: 'ok' }))

  // Notification routes
  fastify.get('/api/notifications', listNotifications)
  fastify.post('/api/notifications', createNotification)
  fastify.patch('/api/notifications/:id', updateNotification)
  fastify.patch('/api/notifications/:id/preferences/:preferenceId', updateNotificationPreference)
}
```

## Example 3: Creating an ESLint Rule

Generate a custom ESLint rule to enforce naming conventions:

```bash
bun run plop eslint-rule
```

**Input:**
- Rule name: `enforce-action-naming`
- Rule description: `Enforce that action files follow the naming pattern`

**Generated Files:**
- `eslint-rules/enforce-action-naming.js`
- `eslint-rules/tests/enforce-action-naming.test.js`

**Implementation Example:**

```javascript
// eslint-rules/enforce-action-naming.js
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce that action files follow the naming pattern',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      enforceActionNaming: 'Action files must be named {method}.action.ts',
    },
  },

  create(context) {
    const filename = context.getFilename()

    return {
      Program(node) {
        if (filename.includes('/actions/') && !filename.match(/\/(get|post|patch|delete|put)\.action\.ts$/)) {
          context.report({
            node,
            messageId: 'enforceActionNaming',
          })
        }
      },
    }
  },
}
```

## Example 4: Creating Documentation

Generate documentation for the notification service:

```bash
bun run plop documentation
```

**Input:**
- Documentation type: `backend`
- Document title: `Notification Service Architecture`
- Filename: `notification-service`

**Generated File:** `documentation/backend/notification-service.md`

## Example 5: Creating a Validation Script

Generate a script to validate OpenAPI specifications:

```bash
bun run plop validation-script
```

**Input:**
- Script name: `validate-openapi`
- Script description: `Validate all OpenAPI specification files`

**Generated File:** `scripts/lints/validate-openapi.sh`

**Implementation Example:**

```bash
#!/usr/bin/env bash

# Validate all OpenAPI specification files

set -e

echo "Running validate-openapi..."

# Check all backend services for openapi.yaml files
for service in apps/backend-*/openapi.yaml; do
  if [ -f "$service" ]; then
    echo "Validating $service..."
    # Add validation logic here
    # Example: npx @redocly/cli lint "$service"
  fi
done

echo "✓ validate-openapi completed successfully"
```

## Tips and Best Practices

1. **Service Names**: Use kebab-case (lowercase with hyphens)
   - ✅ `notification`, `user-management`, `email-service`
   - ❌ `Notification`, `userManagement`, `email_service`

2. **Route Patterns**: Always start with `/api/`
   - ✅ `/api/notifications/:id`
   - ❌ `/notifications/:id`, `api/notifications/:id`

3. **Function Names**: Use camelCase and be descriptive
   - ✅ `listNotifications`, `createUser`, `updatePreference`
   - ❌ `list`, `create`, `update`

4. **After Generation**:
   - Fill in TODO comments
   - Update routes.ts with new imports
   - Run linters: `bun run lint`
   - Test the generated code

5. **Port Numbers**: Use a consistent range
   - Backend services: 4000-4099
   - Socket services: 4100-4199
   - UI services: 5000-5099

## Common Workflows

### Adding a New Resource to Existing Service

1. Generate GET (list) action
2. Generate GET (single) action with `:id` parameter
3. Generate POST (create) action
4. Generate PATCH (update) action with `:id` parameter
5. Generate DELETE action with `:id` parameter
6. Update routes.ts to register all routes
7. Implement service layer logic
8. Update OpenAPI specification

### Creating a Complete New Service

1. Generate backend service
2. Update config/config.js with port
3. Generate basic CRUD actions
4. Implement business logic in services/
5. Update routes.ts
6. Generate documentation
7. Test with E2E tests
8. Update docker-compose if needed

## Troubleshooting

### Generator Fails with Validation Error

Check that your inputs match the expected format:
- Service names must be kebab-case
- Routes must start with `/api/`
- Function names must be camelCase

### File Already Exists

Use the `--force` flag:
```bash
bun run plop api-action --force
```

### Generated Code Has Linting Errors

Run the linter to see specific issues:
```bash
cd apps/backend-{service}
bun run lint
```

Most issues can be auto-fixed:
```bash
bun run lint:fix
```

---

*For more information, see [CODE_GENERATION.md](./documentation/CODE_GENERATION.md)*
