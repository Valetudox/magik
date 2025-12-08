# Backend Validation Tools

Three complementary tools validate backend service structure:

## 1. Bash Script (`scripts/lints/backend/validate-structure.sh`)

**Purpose:** Project structure validation (existence checks)

**What it validates:**
- ✅ Required files in backend root exist:
  - `Dockerfile`
  - `eslint.config.js`
  - `openapi.yaml`
  - `package.json`
  - `tsconfig.json`
- ✅ Required directories exist:
  - `src/`
  - `src/actions/` (required)
- ✅ Required files in src exist:
  - `config.ts`
  - `index.ts`
  - `routes.ts`
  - `types.ts`
- ✅ Invalid folders in src/ (only `actions/`, `services/`, `utils/` allowed)

**Usage:**
```bash
./scripts/lints/backend/validate-structure.sh
```

**When to run:**
- CI/CD pipelines
- Pre-commit hooks
- Project setup verification

---

## 2. ESLint (`eslint.config.backend.js`)

**Purpose:** Real-time development feedback (naming & location patterns)

**What it validates:**
- ✅ File naming in `src/` root:
  - Only `config.ts`, `index.ts`, `routes.ts`, `types.ts` allowed
- ✅ File naming in `src/actions/`:
  - Must be `*.action.ts` (index.ts NOT allowed)
- ✅ File naming in `src/services/`:
  - Must be `*.service.ts` or `index.ts`
- ✅ File naming in `src/utils/`:
  - Must use kebab-case
- ✅ Folder naming:
  - Kebab-case: `decisions`, `use-cases`, `push-to-confluence`
  - Bracket notation for params: `[id]`, `[optionId]`, `[driverId]`
  - Pattern: `'+([a-z-]|\\[[a-zA-Z0-9]+\\])'`
- ✅ process.env access restriction:
  - Only `config.ts` can access `process.env` directly
  - All other files must import from `config.ts`

**Usage:**
```bash
# Lint specific backend service
cd apps/backend-audio
bun run lint

# Lint all workspaces
bun run lint
```

**When to run:**
- During development (IDE integration)
- Pre-commit hooks
- CI/CD pipelines

---

## 3. Route-Action Alignment Validator (`scripts/lints/backend/validate-route-actions.ts`)

**Purpose:** Ensures routes defined in `routes.ts` have matching action files in the correct folder structure

**What it validates:**
- ✅ Every route has a corresponding action file
- ✅ Action files are in correct folder structure matching routes
- ✅ No orphaned action files without matching routes
- ✅ Folder-based routing with `[param]` folders

**Route mapping algorithm:**

1. **Static segments** → Regular folders
   - `/api/decisions` → `actions/decisions/`
   - `/api/decisions/:id/options` → `actions/decisions/[id]/options/`

2. **Dynamic segments** → Bracket folders
   - `:id` → `[id]/`
   - `:optionId` → `[optionId]/`

3. **HTTP method** → Filename
   - `GET` → `get.action.ts`
   - `POST` → `post.action.ts`
   - `PATCH` → `patch.action.ts`
   - `DELETE` → `delete.action.ts`

**Examples:**

| Route | Expected File Path |
|-------|-------------------|
| `GET /api/decisions` | `actions/decisions/get.action.ts` |
| `GET /api/decisions/:id` | `actions/decisions/[id]/get.action.ts` |
| `PATCH /api/decisions/:id` | `actions/decisions/[id]/patch.action.ts` |
| `POST /api/decisions/:id/options` | `actions/decisions/[id]/options/post.action.ts` |
| `PATCH /api/decisions/:id/options/:optionId` | `actions/decisions/[id]/options/[optionId]/patch.action.ts` |
| `DELETE /api/decisions/:id/drivers/:driverId` | `actions/decisions/[id]/drivers/[driverId]/delete.action.ts` |

**Usage:**
```bash
bun run scripts/lints/backend/validate-route-actions.ts
```

**When to run:**
- During development (when adding new routes)
- Pre-commit hooks
- CI/CD pipelines

**Error detection:**
- Missing action files: Route defined but no handler exists
- Extra action files: Handler exists but no matching route
- Wrong folder structure: Action file in incorrect location

---

## Summary: Division of Responsibility

| Validation | Bash Script | ESLint | Route-Action Validator |
|------------|-------------|--------|------------------------|
| Required files exist | ✅ | ❌ | ❌ |
| Required directories exist | ✅ | ❌ | ❌ |
| Invalid folders in src/ | ✅ | ❌ | ❌ |
| File naming conventions | ❌ | ✅ | ❌ |
| Folder naming conventions | ❌ | ✅ | ❌ |
| process.env access | ❌ | ✅ | ❌ |
| Route-to-file mapping | ❌ | ❌ | ✅ |
| Missing action files | ❌ | ❌ | ✅ |
| Orphaned action files | ❌ | ❌ | ✅ |
| Non-TS files (Dockerfile, etc.) | ✅ | ❌ | ❌ |

**All three tools are needed:**
- **Bash script** ensures the project structure exists and only allowed folders are present
- **ESLint** ensures developers follow naming conventions in real-time
- **Route-Action validator** ensures routes and action files stay in sync
