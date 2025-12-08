# Checklist for New Backend Service

Use this checklist when creating a new backend service to ensure all requirements are met.

## Directory and Files

- [ ] Create directory in `apps/backend-{service-name}/`
- [ ] Add `Dockerfile` (choose appropriate pattern from [docker.md](./docker.md))
- [ ] Add `eslint.config.js` extending base config
- [ ] Add `tsconfig.json` extending base config
- [ ] Add `package.json` with required scripts
- [ ] Add `openapi.yaml` with API specification
- [ ] Create `src/` directory

## Source Code

- [ ] Add `src/index.ts` with server setup
- [ ] Add `src/config.ts` with configuration
- [ ] Add `src/routes.ts` with route registration
- [ ] Add `src/types.ts` with type definitions
- [ ] Create `src/actions/` directory with resource-grouped structure
- [ ] Add action files with `.action.ts` postfix

## Implementation

- [ ] Implement `/health` endpoint
- [ ] Configure port using `getPort('BACKEND_{SERVICE}')`
- [ ] Add service to Docker Compose (if applicable)

## Testing and Quality

- [ ] Test locally with `bun run dev`
- [ ] Test Docker build
- [ ] Run linting: `bun run lint`
- [ ] Run formatting: `bun run format:check`
