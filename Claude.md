# Magik Repository Architecture

## Overview

Magik is a monorepo organized around a clear separation of concerns between user interfaces, orchestration, data storage, and reusable components. The architecture follows a layered approach where each directory serves a specific purpose in the system.

## High-Level Architecture

```
magik/
├── apps/          # User-facing interfaces
├── dags/          # Workflow orchestration
├── documents/     # Structured data storage
└── packages/      # Reusable components
```

## Directory Structure & Theory

### `apps/` - Interface Layer

**Purpose**: Expose functionality to users through various interface types.

**Theory**: Applications are the entry points to the system. They provide different ways for users to interact with the underlying functionality, whether through command-line interfaces, web APIs, or graphical frontends. Each app is self-contained and focuses on delivering a specific user experience.

**Types of interfaces**:

- **CLIs** (Command-Line Interfaces) - For terminal-based interaction
- **Backend APIs** - For programmatic access and integration
- **Frontends** - For graphical user interfaces

**Examples**:

- `apps/cli-audio/` - Audio recording and transcription CLI tool

**Key principle**: Apps consume packages but don't contain business logic themselves. They orchestrate and present functionality.

---

### `dags/` - Orchestration Layer

**Purpose**: Define and manage workflow automation using Apache Airflow.

**Theory**: DAGs (Directed Acyclic Graphs) represent automated workflows that coordinate multiple tasks in a specific order. This layer handles the "when" and "how" of executing long-running processes, batch operations, and scheduled tasks. It bridges the gap between user actions and automated system behavior.

**Use cases**:

- Batch processing pipelines
- Scheduled automation
- Multi-step workflows with dependencies
- Background job orchestration

**Examples**:

- `dags/process_batch_recordings.py` - Automated audio processing pipeline
- `dags/deploy_multi_AI.py` - Scheduled deployment workflows

**Key principle**: DAGs coordinate execution but delegate actual work to packages. They define the flow, not the implementation.

---

### `documents/` - Data Storage Layer

**Purpose**: Store structured documents and data in an organized, queryable format.

**Theory**: Documents represent the system's knowledge base and persistent state. This layer provides a file-based approach to storing structured information that needs to be versioned, reviewed, and accessed across different parts of the system. Unlike traditional databases, this approach keeps data in human-readable formats alongside code.

**Structure**:

- Organized by topic or project (e.g., `documents/decisions/2025-11-21_BMW-design-sprint/`)
- Uses structured formats (JSON, Markdown)
- Supports versioning through git

**Examples**:

- `documents/decisions/` - Architectural decision records (ADRs)

**Key principle**: Documents are the source of truth for structured data. They should be machine-readable yet human-friendly.

---

### `packages/` - Component Library

**Purpose**: Provide reusable, composable functionality that can be used by apps, DAGs, or other packages.

**Theory**: Packages contain the actual implementation of features. They are the building blocks of the system - small, focused modules that do one thing well. By organizing code into packages, we achieve:

- **Reusability**: Same functionality used across multiple interfaces
- **Maintainability**: Changes in one place propagate everywhere
- **Composability**: Complex features built from simple components
- **Testability**: Isolated units that can be tested independently

**Types of packages**:

- **Scripts**: Shell scripts for system operations
- **Libraries**: TypeScript/Python modules with business logic
- **Tools**: Standalone utilities and CLIs
- **Types**: Shared type definitions and schemas

**Examples**:

- `packages/decisions/` - Decision management types and tools
- `packages/audio/` - Audio recording and conversion scripts
- `packages/gemini/` - AI integration library
- `packages/transcription/` - Transcription processing utilities
- `packages/obsidian/` - Note-taking integration
- `packages/meeting/` - Meeting management tools

**Key principle**: Packages are framework-agnostic and focused. They should work independently and have clear, single responsibilities.

---

## Architectural Principles

### 1. Separation of Concerns

Each layer has a distinct responsibility:

- **Apps** → Present (UI/UX)
- **DAGs** → Orchestrate (Workflow)
- **Documents** → Persist (Data)
- **Packages** → Implement (Logic)

### 2. Dependency Flow

Dependencies flow in one direction:

```
apps → packages
dags → packages
documents ← packages (read/write)
packages → packages (composition)
```

Apps and DAGs depend on packages, but packages never depend on apps or DAGs.

### 3. Workspace Protocol

All packages are managed through Bun workspaces using the `@magik/*` namespace, enabling:

- Consistent versioning
- Easy cross-package imports
- Unified dependency management
- Efficient local development

### 4. Single Source of Truth

- Business logic lives in packages
- Data structure definitions live in packages (types)
- Configuration is centralized
- Documentation is co-located with code

## Benefits of This Architecture

1. **Modularity**: Each component can be developed, tested, and deployed independently
2. **Reusability**: Packages can be used across different interfaces without duplication
3. **Scalability**: New apps or DAGs can be added without touching existing packages
4. **Maintainability**: Changes are isolated to specific layers
5. **Discoverability**: Clear structure makes it easy to find relevant code
6. **Flexibility**: Multiple ways to interact with the same underlying functionality

## Development Workflow

1. **Business Logic** → Implement in `packages/`
2. **User Interface** → Expose through `apps/`
3. **Automation** → Orchestrate with `dags/`
4. **Data** → Store in `documents/`

## Example Flow

```
User runs CLI command (apps/cli-audio)
    ↓
CLI uses audio package (packages/audio)
    ↓
Package processes audio
    ↓
DAG picks up result (dags/process_batch_recordings.py)
    ↓
DAG uses multiple packages (transcription, obsidian, gemini)
    ↓
Results stored (documents/)
```

---

This architecture enables the system to grow organically while maintaining clear boundaries and responsibilities between different parts of the codebase.
