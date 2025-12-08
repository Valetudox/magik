# Parallel Linting Implementation Examples

This document provides concrete examples of different approaches to parallel linting.

## Approach 1: Per-Service Parallel Linting

Run all lints (ESLint + validators) for each service in parallel.

**Pros:**
- Simplest implementation
- Maximum parallelism (4 services = 4 parallel processes)
- Clear service-level failure reporting

**Cons:**
- May be overkill if only ESLint needs optimization
- Validators run redundantly on unchanged services

**Script:** `scripts/lints/lint-backend-parallel-v2.sh`

```bash
# Run ESLint + structure + route-action validators per service in parallel
concurrently \
  --names "audio,decision,socket,spec" \
  --prefix-colors "cyan,blue,yellow,green" \
  --kill-others-on-fail \
  "cd apps/backend-audio && bun run lint && ..." \
  "cd apps/backend-decision && bun run lint && ..." \
  "cd apps/backend-socket && bun run lint && ..." \
  "cd apps/backend-specification && bun run lint && ..."
```

**Usage:**
```bash
./scripts/lints/lint-backend-parallel-v2.sh
```

## Approach 2: Staged Parallel Linting

Run ESLint in parallel first, then validators in parallel.

**Pros:**
- Better control over execution stages
- Can optimize each stage independently
- Clear separation of concerns

**Cons:**
- More complex script
- Sequential stages reduce total parallelism

**Script:** `scripts/lints/lint-backend-parallel.sh`

```bash
# Stage 1: ESLint in parallel
concurrently \
  "cd apps/backend-audio && bun run lint" \
  "cd apps/backend-decision && bun run lint" \
  "cd apps/backend-socket && bun run lint" \
  "cd apps/backend-specification && bun run lint"

# Stage 2: Structure validation in parallel
concurrently \
  "./validate-structure.sh backend-audio" \
  "./validate-structure.sh backend-decision" \
  "./validate-structure.sh backend-socket" \
  "./validate-structure.sh backend-specification"

# Stage 3: Route-action validation in parallel
concurrently \
  "./validate-route-actions.sh backend-audio" \
  "./validate-route-actions.sh backend-decision" \
  "./validate-route-actions.sh backend-socket" \
  "./validate-route-actions.sh backend-specification"
```

**Usage:**
```bash
./scripts/lints/lint-backend-parallel.sh
```

## Approach 3: Using npm Scripts

Leverage package.json scripts for better integration with tooling.

**package.json additions:**
```json
{
  "scripts": {
    "lint:backend:audio": "cd apps/backend-audio && bun run lint",
    "lint:backend:decision": "cd apps/backend-decision && bun run lint",
    "lint:backend:socket": "cd apps/backend-socket && bun run lint",
    "lint:backend:specification": "cd apps/backend-specification && bun run lint",
    "lint:backend:eslint:parallel": "concurrently 'bun run lint:backend:audio' 'bun run lint:backend:decision' 'bun run lint:backend:socket' 'bun run lint:backend:specification'",
    "lint:backend:parallel": "./scripts/lints/lint-backend-parallel-v2.sh"
  }
}
```

**Usage:**
```bash
bun run lint:backend:parallel
# or just ESLint
bun run lint:backend:eslint:parallel
```

## Approach 4: Fail-Fast vs Collect-All

### Fail-Fast (Default)
Stops all processes when one fails.

```bash
concurrently --kill-others-on-fail \
  "command1" \
  "command2" \
  "command3"
```

**Best for:** CI/CD where you want to fail quickly

### Collect-All Errors
Runs all processes and collects all errors.

```bash
concurrently \
  --success first \
  "command1" \
  "command2" \
  "command3"
```

**Best for:** Development where you want to see all issues

## Performance Comparison

### Expected Performance (4 services, ~2s each)

| Approach | Time | Speedup |
|----------|------|---------|
| Sequential (current) | ~8s | 1x baseline |
| Parallel per-service | ~2s | 4x faster |
| Staged parallel | ~2.5s | 3.2x faster |
| Sequential + cache (2nd run) | ~2s | 4x faster |
| Parallel + cache (2nd run) | ~0.5s | 16x faster |

## Recommendation: Approach 1 (Per-Service Parallel)

**Why:**
1. **Simplest implementation** - Single concurrently command
2. **Maximum parallelism** - All services run simultaneously
3. **Best developer experience** - Fast feedback, clear errors
4. **Works with cache** - ESLint cache provides additional speedup
5. **Easy to maintain** - No complex staging logic

**Migration path:**
1. ✅ Enable ESLint caching (done)
2. ✅ Refactor validators for per-service mode (done)
3. ✅ Create parallel script (done)
4. Test thoroughly
5. Replace sequential script
6. Update CI/CD

## Testing the Parallel Scripts

```bash
# Test parallel v2 (recommended)
./scripts/lints/lint-backend-parallel-v2.sh

# Test staged parallel
./scripts/lints/lint-backend-parallel.sh

# Compare with sequential (baseline)
time ./scripts/lints/lint-backend.sh

# Test with intentional failure
# (modify a file to introduce an error and verify it's caught)
```

## Additional Optimizations

### 1. ESLint Cache Location
Each service creates `.eslintcache` in its own directory. This is optimal for parallel execution.

### 2. Concurrently Options

```bash
--kill-others-on-fail   # Stop all when one fails (fail-fast)
--names                 # Label each process
--prefix-colors         # Color output per process
--raw                   # No prefixes (cleaner CI output)
--success first         # Consider success when first completes
```

### 3. CI/CD Integration

For GitHub Actions:
```yaml
- name: Lint backend services
  run: bun run lint:backend:parallel
```

For pre-commit hooks:
```bash
# .git/hooks/pre-commit
./scripts/lints/lint-backend-parallel-v2.sh
```

## Troubleshooting

### Issue: concurrently not found
**Solution:** Already installed in package.json (^9.2.1)

### Issue: Permission denied
**Solution:** Make script executable
```bash
chmod +x scripts/lints/lint-backend-parallel-v2.sh
```

### Issue: Validators not found
**Solution:** Check that validator scripts are executable
```bash
chmod +x scripts/lints/backend/validate-structure.sh
chmod +x scripts/lints/backend/validate-route-actions.sh
```

### Issue: ESLint cache conflicts
**Solution:** Each service has its own cache file, no conflicts possible

## Next Steps

1. Run benchmarks to measure actual performance improvement
2. Test parallel scripts with all services
3. Update root package.json to add parallel lint commands
4. Update CI/CD workflows
5. Document for team
6. Deprecate sequential script after validation period
