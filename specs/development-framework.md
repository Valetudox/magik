# Human+AI Hybrid Development Framework

```
             │           │      System       │        UI         │           │
─────────────┤           ├───────────────────┴───────────────────┤           │
Intent       │           │                Intent                 │           │
─────────────┤           ├───────────────────────────────────────┤           │
Behavior     │           │          Behavioral Spec              │           │
─────────────┤ Technical ├───────────────────┬───────────────────┤  Design   │
Spec         │ Standards │   Architecture    │        UI         │ Standards │
─────────────┤     │     ├───────────────────┼───────────────────┤     │     │
Design       │     ↓     │  System Design    │    UI Design      │     ↓     │
─────────────┤           ├───────────────────┴───────────────────┤           │
Tasks        │           │        Implementation Plan            │           │
─────────────┴───────────┴───────────────────────────────────────┴───────────┘
```

**Reading the diagram:**
- **Vertical flow** (top to bottom) = derivation — each layer is generated from the one above
- **Horizontal split** (System | UI) = parallel tracks that reunify at Design
- **Side columns** (Standards) = static constraints that influence Spec → Design

---

## Layers

### Intent
What we're building and why. Problem statement, goals, success criteria, scope. Human-authored.

### Behavioral Spec
System behavior from user perspective. User stories or EARS notation. What happens, not how.

### Standards (static input)
Reference documents that constrain generation. Rarely change.
- **Technical Standards:** Allowed tech stack, infrastructure rules, API conventions, security policies
- **Design Standards:** Design system, tokens, component library, accessibility rules

### Spec
Structural decomposition of Behavioral Spec. Contains both textual descriptions and formal contracts.
- **Architecture Spec:** Components, boundaries, data flows, integrations + OpenAPI, event schemas, DB schemas
- **UI Spec:** Screens, navigation, states, component mapping + TypeScript interfaces, prop types

### Design
How to build what Specs describe. Internal implementation decisions.
- **System Design:** Patterns, libraries, data access, error handling, folder structure
- **UI Design:** State management, routing, data fetching, component composition

### Implementation Plan
Ordered tasks with dependencies. Each task has inputs, outputs, and verification criteria.

---

## Guards

Automated enforcement at each layer. Standards say what to follow — guards verify it.

### Specification Layer

| Guard | Tool | Enforces |
|-------|------|----------|
| OpenAPI schema validation | Spectral CLI | OpenAPI spec validity, structure, best practices |
| OpenAPI spec existence | Custom validator | Each backend has corresponding OpenAPI spec |

### Code Layer - Backend Services

| Guard | Tool | Enforces |
|-------|------|----------|
| ESLint | eslint + typescript-eslint | Code style, patterns, TypeScript best practices |
| Structure validation | Custom validator | Required folders (actions, services, utils, generated), forbidden patterns |
| Dockerfile validation | Custom validator | Dockerfile matches approved template |
| Index structure validation | Custom validator | Proper server setup, route registration, exports |
| Config validation | Custom validator | Config extends base config correctly |
| Route-action alignment | Custom validator | All routes have corresponding action files, all actions are registered |
| Type safety | TypeScript + Zod | Request/response types match OpenAPI via generated Zod schemas |

### Code Layer - Frontend Services

| Guard | Tool | Enforces |
|-------|------|----------|
| ESLint | eslint + eslint-plugin-vue | Code style, patterns, Vue best practices |
| Type checking | vue-tsc | TypeScript type safety in Vue components |
| Build validation | Vite | Production build succeeds, no build errors |
| Dockerfile validation | Custom validator | Dockerfile matches approved template |

### Code Layer - Global

| Guard | Tool | Enforces |
|-------|------|----------|
| Code formatting | Prettier | Consistent code formatting across all files |

### Integration Layer

| Guard | Tool | Enforces |
|-------|------|----------|
| E2E test existence | Custom validator | Each backend has corresponding E2E test project |
| Contract testing | Schemathesis | API responses match OpenAPI schema via property-based testing |

### Execution

**Linting (per-service validation):**
```bash
# Lint all backends and frontends
bun run lint

# Lint specific backends
bun run lint --backends backend-decision backend-audio

# Lint specific frontends
bun run lint --frontends ui-decision

# CI mode (streaming output)
bun run lint:ci
```

**E2E Testing (integration validation):**
```bash
# Run all E2E tests
bun run test:e2e

# List available E2E projects
bun run test:e2e:list

# Run specific E2E tests
bun run test:e2e --projects backend-socket-e2e

# Run with concurrency control
bun run test:e2e --concurrency 3
```

**Formatting:**
```bash
# Check formatting
bun run format:check

# Fix formatting
bun run format
```

---

## Guard Coverage

### ✅ Implemented

- OpenAPI schema validation (Spectral)
- OpenAPI spec existence check
- Code style enforcement (ESLint + Prettier)
- TypeScript type checking
- Folder structure validation
- Template compliance (Dockerfiles, config, index.ts)
- Route-action alignment
- Contract testing (Schemathesis validates responses match OpenAPI)
- E2E test existence check
- Build validation (Vite for frontends)

### 🚧 Partially Implemented

- **Architecture boundaries:** Folder structure enforced, but no import boundary checking
- **Type safety:** Full coverage for backends (Zod schemas from OpenAPI), partial for frontends

### ❌ Not Implemented

- **Dependency scanners:** No automated check for allowed/forbidden libraries
- **API convention linters:** OpenAPI validated for syntax, but not for custom conventions beyond Spectral rules
- **Task validators:** No automated validation of implementation plan structure

---

## Principle

**If it can be automated, it's a guard. If it can't, it stays in Standards as human-reviewed guidance.**

Guards run automatically on every lint/test cycle. They fail fast and provide clear error messages pointing to what needs fixing.
