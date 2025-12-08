# Guideline: Extending the Codebase with Backend API Functionality

## Overview
This document provides a comprehensive guide for extending the Magik monorepo with new backend API services. The codebase follows a consistent architectural pattern across all backend services, making it straightforward to add new functionality.

## Architecture Overview

### Discovering Existing Backend Services

Before adding a new backend service, you should first understand what services already exist in the codebase:

1. **Explore the `apps/` directory**: All backend services follow the naming pattern `backend-*`
   ```bash
   ls apps/ | grep "^backend-"
   ```

2. **Check the central service configuration**: `config/config.json` contains all backend service configuration
   ```bash
   cat config/config.json
   ```

3. **Check the root `package.json`**: Look for development scripts with the pattern `dev:backend:*`
   ```bash
   grep "dev:backend:" package.json
   ```

4. **Review `docker-compose.prod.yml`**: All production backend services are defined here with their configurations

5. **Check the gateway configuration**: `apps/gateway/nginx.conf` contains routing for all backend services

### Technology Stack
- **Runtime**: Bun 1.3.3
- **Framework**: Fastify 5.2.0
- **Language**: TypeScript (ES modules)
- **Gateway**: Nginx (reverse proxy)
- **Testing**: Schemathesis + Pytest (property-based testing)
- **Containerization**: Docker + Docker Compose

### Architectural Patterns
- **Layered Architecture**: routes → actions → services
- **Health Checks**: Required on all services
- **CORS**: Enabled with `origin: true`
- **Logging**: Fastify logger enabled
- **Error Handling**: Consistent try-catch in action handlers

## Step-by-Step Guide to Add a New Backend Service

### Example: Adding `backend-analytics` on port 3004

### Step 1: Create Directory Structure

Create the following structure under `apps/backend-analytics/`:

```
apps/backend-analytics/
├── Dockerfile
├── package.json
├── tsconfig.json
├── eslint.config.js
├── openapi.yaml
└── src/
    ├── index.ts          # Server initialization
    ├── config.ts         # Environment configuration
    ├── routes.ts         # Route registration
    ├── types.ts          # TypeScript interfaces
    ├── actions/          # HTTP request handlers
    │   └── analytics.ts
    └── services/         # Business logic
        └── analytics.ts
```

### Step 2: Create package.json

**File**: `apps/backend-analytics/package.json`

```json
{
  "name": "backend-analytics",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "start": "bun run src/index.ts",
    "lint": "eslint src --max-warnings 0",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write src",
    "format:check": "prettier --check src"
  },
  "dependencies": {
    "@fastify/cors": "^10.0.1",
    "fastify": "^5.2.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2"
  }
}
```

**Note**: If your service needs workspace dependencies (e.g., `packages/agents`), add them to dependencies:
```json
"dependencies": {
  "@magik/agents": "workspace:*"
}
```

### Step 3: Create Dockerfile

**For simple services (no workspace dependencies)**:

**File**: `apps/backend-analytics/Dockerfile`

```dockerfile
FROM oven/bun:1.3.3

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY apps/backend-analytics/package.json ./

# Install dependencies
RUN bun install --production

# Copy source code
COPY apps/backend-analytics/src ./src
COPY apps/backend-analytics/openapi.yaml ./

# Create data directory (if needed for file storage)
RUN mkdir -p /data/analytics

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD curl -f http://localhost:3004/health || exit 1

# Start the application
CMD ["bun", "run", "start"]
```

**For services with workspace dependencies** (e.g., using `packages/agents`):

```dockerfile
FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

# Copy workspace package files
COPY package.json bun.lock ./
COPY packages/agents ./packages/agents/
COPY apps/backend-analytics ./apps/backend-analytics/

# Install dependencies
RUN cd apps/backend-analytics && bun install

# Production stage
FROM oven/bun:1.3.3

WORKDIR /workspace

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy workspace structure
COPY package.json ./
COPY --from=builder /workspace/packages ./packages
COPY apps/backend-analytics/package.json ./apps/backend-analytics/package.json
COPY apps/backend-analytics/src ./apps/backend-analytics/src
COPY apps/backend-analytics/openapi.yaml ./apps/backend-analytics/openapi.yaml

# Install production dependencies
WORKDIR /workspace/apps/backend-analytics
RUN bun install --production

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD curl -f http://localhost:3004/health || exit 1

# Start the application
CMD ["bun", "run", "start"]
```

### Step 4: Create TypeScript Configuration

**File**: `apps/backend-analytics/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Step 5: Create ESLint Configuration

**File**: `apps/backend-analytics/eslint.config.js`

```javascript
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: ['node_modules/', 'dist/'],
  }
)
```

### Step 6: Create Source Files

#### src/config.ts
```typescript
import { getPort } from '../../../config/config'

export const ANALYTICS_DIR =
  process.env.ANALYTICS_DIR ?? '/home/magic/Documents/analytics'
export const PORT = getPort('BACKEND_ANALYTICS')
export const NODE_ENV = process.env.NODE_ENV || 'development'
```

#### src/types.ts
```typescript
export interface AnalyticsData {
  id: string
  metric: string
  value: number
  timestamp: string
}

export interface AnalyticsResponse {
  data: AnalyticsData[]
  total: number
}
```

#### src/services/analytics.ts
```typescript
import type { AnalyticsData } from '../types'

export async function getAnalytics(): Promise<AnalyticsData[]> {
  // Implement your business logic here
  return []
}
```

#### src/actions/analytics.ts
```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'
import { getAnalytics } from '../services/analytics'
import type { AnalyticsResponse } from '../types'

export async function listAnalyticsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  try {
    const data = await getAnalytics()
    const response: AnalyticsResponse = {
      data,
      total: data.length,
    }
    return reply.send(response)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return reply.status(500).send({
      error: 'Failed to fetch analytics',
      message,
    })
  }
}

export async function healthHandler(): Promise<{ status: string }> {
  return { status: 'ok' }
}
```

#### src/routes.ts
```typescript
import type { FastifyInstance } from 'fastify'
import { healthHandler, listAnalyticsHandler } from './actions/analytics'

export function registerRoutes(fastify: FastifyInstance): void {
  // Health check endpoint (required)
  fastify.get('/health', healthHandler)

  // API endpoints
  fastify.get('/api/analytics', listAnalyticsHandler)
}
```

#### src/index.ts
```typescript
import cors from '@fastify/cors'
import Fastify from 'fastify'
import { PORT } from './config'
import { registerRoutes } from './routes'

async function start(): Promise<void> {
  const fastify = Fastify({
    logger: true,
  })

  await fastify.register(cors, {
    origin: true,
  })

  registerRoutes(fastify)

  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' })
    fastify.log.info(`Backend Analytics API running at http://localhost:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

void start()
```

### Step 7: Create OpenAPI Specification

**File**: `apps/backend-analytics/openapi.yaml`

```yaml
openapi: 3.0.0
info:
  title: Analytics API
  version: 1.0.0
  description: Analytics data management API

servers:
  - url: http://localhost:3004
    description: Development server

paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: ok

  /api/analytics:
    get:
      summary: List analytics data
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/AnalyticsData'
                  total:
                    type: integer
        '500':
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                  message:
                    type: string

components:
  schemas:
    AnalyticsData:
      type: object
      required:
        - id
        - metric
        - value
        - timestamp
      properties:
        id:
          type: string
        metric:
          type: string
        value:
          type: number
        timestamp:
          type: string
          format: date-time
```

### Step 8: Update Docker Compose Configuration

**File**: `docker-compose.prod.yml`

Add the new service after `backend-specification`:

```yaml
  # Backend Analytics API
  backend-analytics:
    image: ${DOCKER_REGISTRY:-localhost:5000}/magik-backend-analytics:latest
    build:
      context: .
      dockerfile: apps/backend-analytics/Dockerfile
    container_name: magik-backend-analytics
    environment:
      - PORT=3004
      - ANALYTICS_DIR=/data/analytics
      - NODE_ENV=production
    volumes:
      - ${ANALYTICS_DIR:-/home/magic/Documents/analytics}:/data/analytics
    networks:
      - magik-network
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3004/health']
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 15s
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'
```

### Step 9: Update Gateway Configuration

**File**: `apps/gateway/nginx.conf`

Add upstream definition (near the top with other upstreams):

```nginx
upstream backend_analytics {
    server backend-analytics:3004;
}
```

Add location block (in the server section):

```nginx
    # API endpoints - Analytics API
    location /api/analytics {
        proxy_pass http://backend_analytics;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
```

Update gateway's `depends_on` to include the new service:

```yaml
  gateway:
    depends_on:
      backend-socket:
        condition: service_healthy
      backend-decision:
        condition: service_healthy
      backend-audio:
        condition: service_healthy
      backend-specification:
        condition: service_healthy
      backend-analytics:
        condition: service_healthy
      # ... UI services
```

### Step 10: Update Environment Configuration

**File**: `.env.production`

Add environment variables for your service:

```bash
ANALYTICS_DIR=/home/magic/Documents/analytics
```

### Step 11: Update Root package.json

**File**: `package.json`

Add development script:

```json
"dev:backend:analytics": "bun run --cwd apps/backend-analytics dev",
```

Update combined backend script:

```json
"dev:backend": "concurrently -n backend-decision,backend-audio,backend-specification,backend-analytics -c blue,cyan,magenta,green \"bun run dev:backend:decision\" \"bun run dev:backend:audio\" \"bun run dev:backend:specification\" \"bun run dev:backend:analytics\""
```

### Step 12: Update Deployment Scripts

#### scripts/build-docker.sh

Add to the output list at the end:

```bash
echo "  - $DOCKER_REGISTRY/magik-backend-analytics:latest"
```

#### scripts/deploy-docker.sh

Add push command in the push section:

```bash
docker push "$DOCKER_REGISTRY/magik-backend-analytics:latest"
```

### Step 13: Create E2E Tests

Create test directory structure:

```
tests/e2e/backend-analytics-e2e/
├── docker-compose.yml
├── docker-compose.deployed.yml
├── package.json
└── schemathesis-tests/
    ├── conftest.py
    ├── __init__.py
    ├── pytest.ini
    ├── requirements.txt
    └── test_analytics_api.py
```

#### tests/e2e/backend-analytics-e2e/package.json

```json
{
  "name": "backend-analytics-e2e",
  "version": "1.0.0",
  "scripts": {
    "test": "npm run test:local",
    "test:local": "bash -c 'set -o pipefail && docker compose up --build --abort-on-container-exit 2>&1 | grep -v \"backend-analytics\"'",
    "test:deployed": "docker compose -f docker-compose.deployed.yml up --build --abort-on-container-exit"
  }
}
```

#### tests/e2e/backend-analytics-e2e/docker-compose.yml

```yaml
services:
  backend-analytics:
    build:
      context: ../../..
      dockerfile: apps/backend-analytics/Dockerfile
    container_name: backend-analytics-test
    ports:
      - '3004:3004'
    environment:
      - PORT=3004
      - ANALYTICS_DIR=/tmp/analytics
    networks:
      - test-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3004/health']
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s

  schemathesis:
    image: python:3.12-slim
    container_name: analytics-schemathesis
    depends_on:
      backend-analytics:
        condition: service_healthy
    volumes:
      - ../../../apps/backend-analytics:/schema:ro
      - ./schemathesis-tests:/tests:ro
    working_dir: /tests
    command: >
      sh -c "pip install -q -r requirements.txt &&
             pytest test_analytics_api.py
             --base-url=http://backend-analytics:3004
             -v --tb=line -rA
             --hypothesis-show-statistics"
    networks:
      - test-network

networks:
  test-network:
    driver: bridge
```

#### tests/e2e/backend-analytics-e2e/docker-compose.deployed.yml

```yaml
services:
  schemathesis:
    image: python:3.12-slim
    container_name: analytics-schemathesis-deployed
    volumes:
      - ./schemathesis-tests:/tests:ro
    working_dir: /tests
    environment:
      - TEST_BASE_URL=${TEST_BASE_URL}
    command: >
      sh -c "pip install -q -r requirements.txt &&
             pytest test_analytics_api.py
             --base-url=${TEST_BASE_URL}
             -v --tb=line -rA
             --hypothesis-show-statistics"
```

#### tests/e2e/backend-analytics-e2e/schemathesis-tests/requirements.txt

```
schemathesis>=3.19.0
pytest>=7.4.0
requests>=2.31.0
```

#### tests/e2e/backend-analytics-e2e/schemathesis-tests/pytest.ini

```ini
[pytest]
filterwarnings =
    ignore::DeprecationWarning:jsonschema
    ignore:jsonschema\.exceptions\.RefResolutionError is deprecated:DeprecationWarning
    ignore:jsonschema\.RefResolver is deprecated:DeprecationWarning
    ignore:The database setting is not configured.*
    ignore:could not create cache path.*
```

#### tests/e2e/backend-analytics-e2e/schemathesis-tests/conftest.py

```python
import pytest

def pytest_addoption(parser):
    parser.addoption(
        "--base-url",
        action="store",
        default="http://backend-analytics:3004",
        help="Base URL for the backend service (default: http://backend-analytics:3004)",
    )

@pytest.fixture(scope="session")
def base_url(request):
    return request.config.getoption("--base-url")
```

#### tests/e2e/backend-analytics-e2e/schemathesis-tests/__init__.py

(Empty file)

#### tests/e2e/backend-analytics-e2e/schemathesis-tests/test_analytics_api.py

```python
import schemathesis

schema = schemathesis.openapi.from_path("/schema/openapi.yaml")

@schema.parametrize()
def test_api_schema_validation(case, base_url):
    """Property-based test that validates all API endpoints against the OpenAPI schema."""
    response = case.call(base_url=base_url)
    case.validate_response(response)
```

### Step 14: Update Root Test Scripts

**File**: `package.json`

Add test scripts:

```json
"test:e2e:backend-analytics": "cd tests/e2e/backend-analytics-e2e && bun run test",
"test:e2e:backend-analytics:deployed": "cd tests/e2e/backend-analytics-e2e && TEST_BASE_URL=\"$TEST_BASE_URL\" bun run test:deployed",
```

Update combined test script:

```json
"test:e2e": "bun run test:e2e:backend-socket && bun run test:e2e:backend-audio && bun run test:e2e:backend-decision && bun run test:e2e:backend-specification && bun run test:e2e:backend-analytics",
```

## Development Workflow

### Local Development

1. **Start individual service**:
   ```bash
   bun run dev:backend:analytics
   ```

2. **Start all backend services**:
   ```bash
   bun run dev:backend
   ```

3. **Test the service locally**:
   ```bash
   curl http://localhost:3004/health
   curl http://localhost:3004/api/analytics
   ```

### Testing

1. **Run E2E tests locally**:
   ```bash
   bun run test:e2e:backend-analytics
   ```

2. **Run all E2E tests**:
   ```bash
   bun run test:e2e
   ```

### Production Deployment

1. **Build Docker images**:
   ```bash
   bun run docker:build
   ```

2. **Deploy to registry**:
   ```bash
   bun run docker:deploy
   ```

3. **Start production services**:
   ```bash
   bun run docker:start
   ```

4. **Refresh everything** (build + deploy + restart):
   ```bash
   bun run docker:refresh
   ```

5. **Test deployed services**:
   ```bash
   TEST_BASE_URL=http://your-server bun run test:e2e:backend-analytics:deployed
   ```

## Port Assignment Convention

All backend service configuration (ports, API routes, container names) is centrally managed in `config/config.json`. This ensures consistency across development and production environments.

### Port Ranges
- **Development**: 4000-4999 (services run directly on host for easier debugging)
- **Production**: 3000-3999 (services run in Docker containers)

### Adding Configuration for Your New Service

1. **Open `config/config.json`** and add your service to the `services` object:

   ```json
   {
     "services": {
       // ... existing services
       "BACKEND_YOUR_SERVICE": {
         "dev": 4004,
         "prod": 3004,
         "apiRoute": "/api/your-service",
         "containerName": "backend-your-service"
       }
     }
   }
   ```

2. **Update your service's code** to use the central configuration:

   ```typescript
   // In your service's index.ts
   import { getPort } from '../../../config/config.js'

   const port = getPort('BACKEND_YOUR_SERVICE')
   await fastify.listen({ port, host: '0.0.0.0' })
   ```

   Or if you have a `config.ts` file:

   ```typescript
   // In your service's config.ts
   import { getPort } from '../../../config/config'

   export const PORT = getPort('BACKEND_YOUR_SERVICE')
   ```

3. **Use the API route** in client code or documentation:

   ```typescript
   import { getApiRoute } from '../../../config/config.js'

   const apiRoute = getApiRoute('BACKEND_YOUR_SERVICE')
   // Returns: '/api/your-service'
   ```

### Benefits of Central Service Configuration

- **Single Source of Truth**: All service config (ports, routes, container names) in one place
- **Environment-Aware**: Automatically uses correct port based on `NODE_ENV`
- **Override Support**: Can still override via `PORT` environment variable
- **Type Safety**: TypeScript ensures service names are valid
- **Consistent Routing**: API routes defined centrally, not scattered across nginx config
- **Documentation**: Easy to see all service configuration at a glance

## Best Practices

### Code Organization
- **Routes**: Define endpoints and map to handlers
- **Actions**: Handle HTTP requests/responses, error handling
- **Services**: Implement business logic, data access
- **Types**: Define TypeScript interfaces for type safety

### Error Handling
Always wrap handlers in try-catch:

```typescript
export async function handler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await serviceFunction()
    return reply.send(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return reply.status(500).send({
      error: 'Operation failed',
      message,
    })
  }
}
```

### Health Checks
Always implement `/health` endpoint returning `{ status: 'ok' }` - this is required for Docker health checks.

### CORS Configuration
Enable CORS with `origin: true` for development. In production, restrict to specific origins if needed.

### Logging
Use Fastify's built-in logger:

```typescript
const fastify = Fastify({ logger: true })
fastify.log.info('Message')
fastify.log.error('Error')
```

### Environment Variables
Always provide defaults in `config.ts`:

```typescript
export const PORT = Number(process.env.PORT) || 3004
export const DATA_DIR = process.env.DATA_DIR ?? '/default/path'
```

### Docker Health Checks
- Start period: 15-20s for complex services
- Interval: 10s
- Timeout: 3s
- Retries: 5

### OpenAPI Documentation
- Keep `openapi.yaml` up-to-date
- Document all endpoints with request/response schemas
- Include error responses (400, 404, 500)
- Use components/schemas for reusable types

## Testing Strategy

### Schemathesis Property-Based Testing
- Tests automatically generated from OpenAPI spec
- Validates request/response schemas
- Finds edge cases through property-based testing (Hypothesis)
- Default 50 examples per test (`max_examples=50`)

### Test Levels
1. **Schema Validation**: Basic Schemathesis parametrize tests
2. **Integration Tests**: Test with actual dependencies (Socket.IO, databases)
3. **Deployed Tests**: Test against production/staging environments

## Common Issues and Solutions

### Issue: Service not starting
- Check health check endpoint is working
- Verify port is not in use
- Check environment variables are set
- Review Docker logs: `docker compose -f docker-compose.prod.yml logs backend-analytics`

### Issue: Tests failing
- Ensure OpenAPI spec matches implementation
- Check base URL is correct
- Verify service is healthy before tests run
- Review test output for specific failures

### Issue: Gateway routing not working
- Verify upstream name matches location block
- Check service name in docker-compose matches upstream
- Ensure gateway depends_on includes your service
- Test direct service access first (bypass gateway)

### Issue: Docker build failures
- Check all COPY paths are correct
- Verify workspace dependencies are included in build stage
- Ensure Dockerfile is in correct location
- Review build context in docker-compose.yml

## Summary Checklist

When adding a new backend service, ensure you have:

- [ ] Created service directory structure
- [ ] Implemented src files (index.ts, config.ts, routes.ts, actions/, services/)
- [ ] Added package.json with correct scripts
- [ ] Created Dockerfile (simple or multi-stage based on dependencies)
- [ ] Added TypeScript and ESLint configuration
- [ ] Created OpenAPI specification
- [ ] Updated docker-compose.prod.yml with new service
- [ ] Updated nginx.conf with upstream and location
- [ ] Updated .env.production with environment variables
- [ ] Updated root package.json dev scripts
- [ ] Updated deployment scripts (build-docker.sh, deploy-docker.sh)
- [ ] Created E2E test directory and files
- [ ] Updated root package.json test scripts
- [ ] Tested locally with `bun run dev:backend:<service>`
- [ ] Verified E2E tests pass with `bun run test:e2e:backend-<service>`
- [ ] Built and deployed Docker images
- [ ] Tested production deployment

## Critical Files Modified

When adding a new backend service, you will modify these files:

1. `docker-compose.prod.yml` - Add service definition
2. `apps/gateway/nginx.conf` - Add routing
3. `.env.production` - Add environment variables
4. `package.json` (root) - Add dev and test scripts
5. `scripts/build-docker.sh` - Add to build output
6. `scripts/deploy-docker.sh` - Add push command

## Conclusion

This architecture provides a scalable, maintainable pattern for extending the Magik monorepo with new backend API functionality. By following this guide, you ensure consistency across services, comprehensive testing, and production-ready deployment.
