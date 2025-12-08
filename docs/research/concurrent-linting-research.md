# Concurrent Linting Research

## Executive Summary
This document contains research findings on implementing concurrent linting per project for the Magik monorepo.

## Current State Analysis

### Sequential Linting Process
Currently, `scripts/lints/lint-backend.sh` runs linting in the following sequential order:

1. **ESLint per backend service** (sequential loop)
   - backend-audio
   - backend-decision
   - backend-socket
   - backend-specification
   - Each runs: `bun run lint` (which executes `eslint src --max-warnings 0`)

2. **Structure validation** (all services at once)
   - Script: `scripts/lints/backend/validate-structure.sh`
   - Validates required files and directory structure
   - Processes all backend-* services in a single run

3. **Route-action alignment validation** (all services at once)
   - Script: `scripts/lints/backend/validate-route-actions.ts`
   - Validates that routes match action file structure
   - Processes all backend-* services in a single run

### Bottlenecks Identified

1. **Sequential ESLint execution**: Each backend service waits for the previous one to complete
2. **Monolithic validators**: Custom validators process all services but can't run until ESLint finishes
3. **No ESLint caching**: Current lint scripts don't use `--cache` flag
4. **No parallelization**: All operations are strictly sequential

### Current Dependencies
- `concurrently` is already installed (version ^9.2.1)
- Used for running dev servers in parallel
- Not currently used for linting

## Research Areas

### 1. Concurrent Execution Tools

#### Tool Comparison Matrix

| Tool | Installed | Pros | Cons | Best For |
|------|-----------|------|------|----------|
| **concurrently** | ✅ Yes (^9.2.1) | Already in use, simple, aggregates output, colored output | Basic parallel execution, no caching | Simple parallel scripts |
| **npm-run-all** | ❌ No | Simple, sequential & parallel modes, glob patterns | Less features than modern tools | Simple use cases |
| **turbo** | ❌ No | Smart caching, dependency graph, remote caching | More complex setup, overkill for linting | Full monorepo builds |
| **nx** | ❌ No | Powerful caching, task dependencies, affected detection | Heavy, complex configuration | Large monorepos |

#### Recommendation: concurrently
- **Already installed and working** in the project
- Used successfully for parallel dev servers (line 22, 26, 28 in package.json)
- Perfect for running parallel linting tasks
- Supports named processes with colors
- Can aggregate exit codes
- Minimal additional complexity

### 2. Per-Project Custom Validators

#### Current Implementation Analysis

**validate-structure.sh**
- Currently validates ALL services in a single pass
- Uses bash associative arrays to collect errors by service
- Already structured to process services individually (lines 124-126)
- **Easy to refactor**: Accept service name as argument

**validate-route-actions.ts**
- Currently validates ALL services in a single pass
- Has `validateService()` function that works per-service (lines 183-240)
- **Already modular**: Can be refactored to accept service name as CLI argument

#### Refactoring Strategy
Both validators are already internally structured to validate per-service. We can:
1. Add CLI argument support to accept specific service name
2. Keep the "validate all" mode as default
3. Enable parallel execution when service name is provided

### 3. ESLint Optimization

#### Cache Analysis
- **Current status**: ESLint `--cache` flag is NOT being used
- Each backend service runs: `eslint src --max-warnings 0`
- No `.eslintcache` files found in any backend-* directories

#### Optimization Opportunities
1. **Add --cache flag**: Modify lint scripts in each backend package.json
2. **Cache location**: ESLint stores cache in `.eslintcache` by default
3. **Cache benefits**: Only re-lint changed files
4. **Parallel safety**: Each service has its own cache file (no conflicts)

#### Performance Gains Expected
- First run: No improvement (cache is cold)
- Subsequent runs: 50-90% faster for unchanged files
- Parallel execution: Linear speedup (4 services = ~4x faster)

## Performance Benchmarking

### Test Methodology
We will measure:
1. Sequential baseline (current implementation)
2. Parallel ESLint only
3. Parallel ESLint + validators
4. With and without ESLint cache

### Expected Results
- **Sequential (baseline)**: ~X seconds
- **Parallel without cache**: ~X/4 seconds (4 services)
- **Parallel with cache**: ~X/10 seconds (for unchanged files)

(Benchmarks to be run next)

## Proposed Solution Architecture

### Phase 1: Add ESLint Caching
```bash
# Update each backend package.json lint script to:
"lint": "eslint src --max-warnings 0 --cache"
```

### Phase 2: Refactor Validators for Per-Project Mode
```bash
# validate-structure.sh - Add service argument support
./validate-structure.sh [service-name]

# validate-route-actions.ts - Add service argument support
bun run validate-route-actions.ts [service-name]
```

### Phase 3: Create Parallel Lint Script
```bash
# New script using concurrently
concurrently \
  --names "audio,decision,socket,spec" \
  --prefix-colors "cyan,blue,yellow,green" \
  "bun run lint:service backend-audio" \
  "bun run lint:service backend-decision" \
  "bun run lint:service backend-socket" \
  "bun run lint:service backend-specification"
```

### Phase 4: Integrate into CI/CD
- Update GitHub Actions workflows
- Update pre-commit hooks if applicable
- Maintain backward compatibility

## Migration Plan

### Step 1: Enable ESLint Caching (Non-Breaking)
- Update package.json lint scripts
- Test to ensure no regressions
- Commit and push

### Step 2: Refactor Validators (Non-Breaking)
- Add optional service argument to both validators
- Maintain backward compatibility (run all services if no arg)
- Add tests for per-service mode
- Commit and push

### Step 3: Create Parallel Lint Scripts (Additive)
- Create new script: `lint-backend-parallel.sh`
- Keep existing `lint-backend.sh` for compatibility
- Add npm script: `lint:backend:parallel`
- Test thoroughly
- Commit and push

### Step 4: Switch Default (After Validation)
- Update `lint:backend` to use parallel version
- Remove old sequential script
- Update documentation

## Next Steps

1. Run performance benchmarks
2. Implement Phase 1 (ESLint caching)
3. Implement Phase 2 (refactor validators)
4. Implement Phase 3 (parallel script)
5. Create example implementation
6. Document final recommendations

## Questions & Considerations

### Q: Will parallel linting affect error reporting?
**A:** No. concurrently aggregates output and preserves exit codes. All errors will still be visible.

### Q: What about cross-service validation?
**A:** Route-action and structure validators are already service-isolated. No cross-service validation exists currently.

### Q: Cache invalidation concerns?
**A:** ESLint handles cache invalidation automatically based on file changes and config changes.

### Q: CI/CD impact?
**A:** Faster builds. May need to adjust timeout values if they're too short.

