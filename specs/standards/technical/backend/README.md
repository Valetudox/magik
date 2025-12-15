# Backend Technical Standards

This directory contains the standardized patterns and conventions for backend services in the Magik monorepo.

## Standards Organization

### Project Structure
- [Structure](./project-structure/structure.md) - Directory structure and required files
- [Source Code](./project-structure/source-code.md) - Source code structure and naming conventions

### Infrastructure
- [Docker](./infrastructure/docker.md) - Dockerfile patterns and requirements
- [Health Checks](./infrastructure/health-checks.md) - HTTP and Docker health check patterns

### API Contracts
- [OpenAPI](./api-contracts/openapi.md) - OpenAPI specification requirements

### Code Style
- [Code Patterns](./code-style/code-patterns.md) - Standard code patterns for index.ts, config.ts, routes.ts, actions, and types

### Tooling
- [Configuration](./tooling/configuration.md) - Configuration file patterns (eslint, tsconfig, package.json)
- [Validation Tools](./tooling/validation-tools.md) - ESLint, structure validator, and route-action alignment validator

### Quick Reference
- [Checklist](./checklist.md) - Checklist for creating a new backend service

## Quick Start

All backend services MUST:
- Be located in `apps/backend-{service-name}/`
- Include: Dockerfile, eslint.config.js, package.json, tsconfig.json, src/
- Have their OpenAPI spec in `specs/domains/{domain}/openapi.yaml`
- Have mandatory `src/` files: index.ts, config.ts, routes.ts, types.ts, actions/
- Use Fastify as the web framework
- Implement a `/health` endpoint
- Use centralized port configuration via `getPort('BACKEND_{SERVICE}')`
- Organize actions using folder-based routing with `[param]` folders (Next.js-style)
- **Access `process.env` ONLY in `config.ts`** - all other files must import from config.ts
