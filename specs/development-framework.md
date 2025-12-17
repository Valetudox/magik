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

Human authored short and compact description of the goal.

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

Automated enforcement mechanisms that validate each layer. Standards define what to follow — guards verify compliance.

**See [guards.md](./guards.md) for complete guard documentation, tools, and execution commands.**
