# Backend Service Guidelines

This directory contains the standardized patterns and conventions for backend services in the Magik monorepo.

## Documentation Index

- [Structure](./structure.md) - Directory structure and required files
- [Docker](./docker.md) - Dockerfile patterns and requirements
- [Configuration](./configuration.md) - Configuration file patterns (eslint, tsconfig, package.json)
- [Source Code](./source-code.md) - Source code structure and naming conventions
- [Code Patterns](./code-patterns.md) - Standard code patterns for index.ts, config.ts, routes.ts, actions, and types
- [OpenAPI](./openapi.md) - OpenAPI specification requirements
- [Health Checks](./health-checks.md) - HTTP and Docker health check patterns
- [Validation Tools](./validation-tools.md) - ESLint, structure validator, and route-action alignment validator
- [Checklist](./checklist.md) - Checklist for creating a new backend service

## Quick Start

All backend services MUST:
- Be located in `apps/backend-{service-name}/`
- Include: Dockerfile, eslint.config.js, openapi.yaml, package.json, tsconfig.json, src/
- Have mandatory `src/` files: index.ts, config.ts, routes.ts, types.ts, actions/
- Use Fastify as the web framework
- Implement a `/health` endpoint
- Use centralized port configuration via `getPort('BACKEND_{SERVICE}')`
- Organize actions using folder-based routing with `[param]` folders (Next.js-style)
- **Access `process.env` ONLY in `config.ts`** - all other files must import from config.ts
