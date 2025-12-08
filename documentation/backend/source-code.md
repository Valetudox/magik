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

Actions MUST be organized in a grouped structure by resource:

```
src/
└── actions/
    └── {resource-name}/
        ├── create{Resource}.action.ts
        ├── delete{Resource}.action.ts
        ├── get{Resource}.action.ts
        ├── index.ts
        ├── list{Resources}.action.ts
        └── update{Resource}.action.ts
```

Example:

```
src/
└── actions/
    └── decisions/
        ├── createDecision.action.ts
        ├── deleteDecision.action.ts
        ├── getDecision.action.ts
        ├── index.ts
        ├── listDecisions.action.ts
        └── updateDecision.action.ts
```

The `index.ts` file MUST export all actions from the resource directory:

```typescript
export { createDecision } from './createDecision.action'
export { deleteDecision } from './deleteDecision.action'
export { getDecision } from './getDecision.action'
export { listDecisions } from './listDecisions.action'
export { updateDecision } from './updateDecision.action'
```
