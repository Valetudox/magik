# Repository Structure

## Directory Layout

```
magik/
├── apps/          # User-facing interfaces
├── dags/          # Workflow orchestration
├── packages/      # Reusable components
├── scripts/       # Development tooling
├── specs/         # System specifications
├── commands/      # Custom slash commands
├── skills/        # Claude Code skills
├── config/        # Shared configuration
└── _templates/    # Code generation templates
```

## Directory Purposes

### `apps/` - Interface Layer
Entry points to the system. CLIs, backend APIs, and frontends that expose functionality to users.

**Naming**: `cli-*`, `backend-*`, `ui-*`

### `dags/` - Orchestration Layer
Apache Airflow DAGs for automated workflows, batch processing, and scheduled tasks.

### `packages/` - Component Library
Reusable business logic, scripts, libraries, types, and generated API clients. Framework-agnostic modules used by apps and DAGs.

### `scripts/` - Development Tooling
Development automation: generators, linters, Docker scripts, E2E testing, API docs.

### `specs/` - System Specifications
Standards, conventions, API specs, and domain models. Prescriptive definitions that drive code generation.

### `commands/` - Custom Slash Commands
Claude Code slash commands for common development workflows (commits, PRs, code generation).

### `skills/` - Claude Code Skills
Specialized agents for complex tasks (document management, integrations, async workflows).

### `config/` - Shared Configuration
Centralized configuration and type definitions used across the monorepo.

### `_templates/` - Code Generation Templates
Hygen templates for scaffolding new services, API actions, components, and tests. Used by `scripts/generate.js` and the code generation system.

## Architectural Principles

**Dependency Flow**:
```
apps → packages
dags → packages
packages → packages
scripts → packages
```

**Key Rules**:
- Apps/DAGs/scripts depend on packages
- Packages never depend on apps/DAGs/scripts
- All packages use `@magik/*` namespace
- Specs drive code generation
- Business logic lives in packages only
