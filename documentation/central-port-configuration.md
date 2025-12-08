# Central Service Configuration

## Overview

All backend service configuration (ports, API routes, container names) is centrally managed in `config/config.json` and accessed through helper functions in `config/config.ts`. This provides a single source of truth for service configuration across development and production environments.

## Configuration Files

- **`config/config.json`** - Service configuration data (ports, routes, container names)
- **`config/config.ts`** - TypeScript helper functions to access the configuration

## Quick Reference

```json
// config/config.json
{
  "services": {
    "BACKEND_DECISION": {
      "dev": 4000,
      "prod": 3000,
      "apiRoute": "/api/decisions",
      "containerName": "backend-decision"
    },
    "BACKEND_SOCKET": {
      "dev": 4001,
      "prod": 3001,
      "apiRoute": "/socket.io/",
      "containerName": "backend-socket"
    },
    "BACKEND_AUDIO": {
      "dev": 4002,
      "prod": 3002,
      "apiRoute": "/api/recordings",
      "containerName": "backend-audio"
    },
    "BACKEND_SPECIFICATION": {
      "dev": 4003,
      "prod": 3003,
      "apiRoute": "/api/specifications",
      "containerName": "backend-specification"
    }
  }
}
```

## Port Ranges

| Environment | Range | Purpose |
|-------------|-------|---------|
| Development | 4000-4999 | Services run directly on host for debugging |
| Production | 3000-3999 | Services run in Docker containers |

## Usage

### Getting Port

```typescript
// Option 1: In index.ts
import { getPort } from '../../../config/config.js'

const port = getPort('BACKEND_YOUR_SERVICE')
await fastify.listen({ port, host: '0.0.0.0' })
```

```typescript
// Option 2: In config.ts
import { getPort } from '../../../config/config'

export const PORT = getPort('BACKEND_YOUR_SERVICE')
```

### Getting API Route

```typescript
import { getApiRoute } from '../../../config/config.js'

// Get the API route/slug for the service
const route = getApiRoute('BACKEND_AUDIO')
// Returns: '/api/recordings'

// Use in client code or documentation
const apiUrl = `${baseUrl}${route}`
```

### Getting Container Name

```typescript
import { getContainerName } from '../../../config/config.js'

// Get the Docker container name
const containerName = getContainerName('BACKEND_DECISION')
// Returns: 'backend-decision'
```

### Getting Full Service Config

```typescript
import { getServiceConfig } from '../../../config/config.js'

// Get all configuration for a service
const config = getServiceConfig('BACKEND_AUDIO')
// Returns: { dev: 4002, prod: 3002, apiRoute: '/api/recordings', containerName: 'backend-audio' }
```

### Environment Variable Override

You can still override the port using the `PORT` environment variable:

```bash
# Development
PORT=5000 bun run dev:backend:audio

# Production (docker-compose.prod.yml)
environment:
  - PORT=3002  # This will override the default
```

### Getting All Ports

```typescript
import { getAllPorts } from '@magik/config'

// Get all development ports
const devPorts = getAllPorts('dev')
// { BACKEND_DECISION: 4000, BACKEND_SOCKET: 4001, ... }

// Get all production ports
const prodPorts = getAllPorts('prod')
// { BACKEND_DECISION: 3000, BACKEND_SOCKET: 3001, ... }
```

### Getting All API Routes

```typescript
import { getAllApiRoutes } from '@magik/config'

// Get all API routes
const routes = getAllApiRoutes()
// { BACKEND_DECISION: '/api/decisions', BACKEND_AUDIO: '/api/recordings', ... }
```

## Adding a New Service

1. **Add to `config/config.json`**:
   ```json
   {
     "services": {
       // ... existing services
       "BACKEND_ANALYTICS": {
         "dev": 4004,
         "prod": 3004,
         "apiRoute": "/api/analytics",
         "containerName": "backend-analytics"
       }
     }
   }
   ```

2. **Use in your service**:
   ```typescript
   import { getPort, getApiRoute } from '../../../config/config'

   export const PORT = getPort('BACKEND_ANALYTICS')
   export const API_ROUTE = getApiRoute('BACKEND_ANALYTICS')
   ```

3. **Update `docker-compose.prod.yml`**:
   ```yaml
   backend-analytics:
     container_name: magik-backend-analytics  # Prefixed with 'magik-'
     environment:
       - PORT=3004  # Must match prod port in config/config.json
   ```

4. **Update `apps/gateway/nginx.conf`**:
   ```nginx
   # Add upstream
   upstream backend_analytics {
       server backend-analytics:3004;  # Use containerName from config
   }

   # Add location block
   location /api/analytics {  # Use apiRoute from config
       proxy_pass http://backend_analytics;
       # ... proxy settings
   }
   ```

## Benefits

### Single Source of Truth
All service configuration is visible in one file, making it easy to:
- See all backend services at a glance
- Avoid port conflicts
- Understand the port and route allocation scheme
- Know the API routes without checking nginx config
- See container names without checking docker-compose

### Environment-Aware
Ports automatically adapt based on `NODE_ENV`:
- `development` → uses dev port (4000-4999)
- `production` → uses prod port (3000-3999)

### Type Safety
TypeScript provides autocomplete and validation:
```typescript
// ✅ Valid - TypeScript knows this service exists
getPort('BACKEND_AUDIO')

// ❌ Error - TypeScript catches typos
getPort('BACKEND_AUDIOS')
```

### Flexibility
Environment variable override support allows:
- Testing on different ports without code changes
- Handling port conflicts in local development
- Deploying to environments with port restrictions

### Documentation
The central config file serves as living documentation of all backend services and their port assignments.

## Migration Notes

All existing backend services have been updated to use the central configuration:
- ✅ backend-audio
- ✅ backend-decision
- ✅ backend-socket
- ✅ backend-specification

New services should follow this pattern from the start.

## Troubleshooting

### Port Already in Use

```bash
# Check what's using a port
lsof -i :4000

# Kill the process
kill -9 <PID>
```

### Service Won't Start

1. Verify the service name in `config/config.json` matches your import
2. Check that `NODE_ENV` is set correctly
3. Ensure no `PORT` environment variable is overriding unexpectedly
4. Verify `config/config.json` has valid JSON syntax

### TypeScript Errors

If you see type errors with `getPort()`:
1. Ensure `config` is in the workspace (`package.json` workspaces array)
2. Run `bun install` to update workspace links
3. Restart your TypeScript language server

## Related Documentation

- [Extending Backend API Functionality](./extending-backend-api-functionality.md) - Complete guide for adding new services
- [config/README.md](../config/README.md) - Config directory overview
