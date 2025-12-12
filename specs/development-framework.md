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

| Layer | Guard | Enforces |
|-------|-------|----------|
| Spec | Schema validators | OpenAPI/JSON Schema validity |
| Spec | Contract linters | API conventions from Technical Standards |
| Design | Dependency scanners | Only allowed libraries |
| Design | Architecture tests | No forbidden imports, layer boundaries |
| Tasks | Task validators | Required fields, dependency graph validity |
| Code | ESLint/Biome rules | Code style, patterns |
| Code | Custom linters | Allowed technologies only |
| Code | Type checking | Component contracts (TypeScript) |
| Code | API tests | Request/response matches OpenAPI schema |
| Code | Contract tests | Integration points match contracts |

**Principle:** If it can be automated, it's a guard. If it can't, it stays in Standards as human-reviewed guidance.
