# Specifications

This directory contains all project specifications following the [Human+AI Hybrid Development Framework](./development-framework.md).

## Structure

```
specs/
├── projects/           # Project-specific specifications
│   └── {project}/
│       └── domains/    # Domain-driven organization
│           ├── {domain}/
│           │   ├── intent.md              # What we're building and why
│           │   ├── behavioral-spec.md     # System behavior from user perspective
│           │   ├── architecture-spec/     # Components, APIs, schemas
│           │   ├── ui-spec/              # Screens, navigation, components
│           │   ├── design.md             # Implementation decisions
│           │   ├── tasks.md              # Ordered implementation tasks
│           │   └── src/                  # Implementation code
│           └── shared/                   # Cross-domain shared modules
│               ├── socket-gateway/
│               └── auth/
├── standards/          # Static constraints (tech stack, design system)
└── guards/            # Automated validation rules
```

## Specification Layers

Each domain follows a top-down derivation flow:

1. **Intent** - Problem statement, goals, success criteria
2. **Behavioral Spec** - User stories, what happens (not how)
3. **Spec** - Structural decomposition with formal contracts
   - Architecture Spec: OpenAPI, event schemas, DB schemas
   - UI Spec: TypeScript interfaces, component contracts
4. **Design** - Implementation patterns and decisions
5. **Tasks** - Ordered work items with dependencies

## Standards & Guards

- **Standards** (`standards/`) - Reference documents that rarely change
  - Technical: Tech stack, infrastructure, API conventions
  - Design: Design system, accessibility rules
- **Guards** (`guards/`) - Automated enforcement
  - Schema validators, linters, type checkers, contract tests

See the [Development Framework](./development-framework.md) for the complete methodology.
