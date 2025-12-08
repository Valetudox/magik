# Backend Validation Tools

Two complementary tools validate backend service structure:

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
  - Must be `*.action.ts` or `index.ts`
- ✅ File naming in `src/services/`:
  - Must be `*.service.ts` or `index.ts`
- ✅ File naming in `src/utils/`:
  - Must use kebab-case
- ✅ Folder restrictions in `src/`:
  - Only `actions/`, `services/`, `utils/` allowed
- ✅ Folder naming:
  - All folders must use kebab-case

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

## Summary: Division of Responsibility

| Validation | Bash Script | ESLint |
|------------|-------------|--------|
| Required files exist | ✅ | ❌ |
| Required directories exist | ✅ | ❌ |
| File naming conventions | ❌ | ✅ |
| Folder naming conventions | ❌ | ✅ |
| Unauthorized files/folders | ❌ | ✅ |
| Non-TS files (Dockerfile, etc.) | ✅ | ❌ |

**Both tools are needed:**
- Bash script ensures the project structure exists
- ESLint ensures developers follow naming conventions
