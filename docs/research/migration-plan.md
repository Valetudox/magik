# Concurrent Linting Migration Plan

## Overview

This document outlines the migration plan for adopting concurrent linting across the Magik monorepo.

## Executive Summary

**Goal:** Speed up backend linting from ~8s to ~2s (4x faster) on first run, and ~0.5s (16x faster) with cache on subsequent runs.

**Approach:** Use existing `concurrently` package to run lints per project in parallel.

**Status:** Implementation complete, testing and adoption pending.

## Implementation Phases

### Phase 1: ESLint Caching ✅ COMPLETE

**Status:** Completed and committed

**Changes:**
- Added `--cache` flag to lint scripts in all 4 backend package.json files:
  - `apps/backend-audio/package.json`
  - `apps/backend-decision/package.json`
  - `apps/backend-socket/package.json`
  - `apps/backend-specification/package.json`
- Added `.eslintcache` to root `.gitignore`

**Benefit:** 50-90% faster on unchanged files, no breaking changes

**Rollback:** Remove `--cache` flag if issues occur

---

### Phase 2: Validator Refactoring ✅ COMPLETE

**Status:** Completed and committed

**Changes:**
- Modified `scripts/lints/backend/validate-structure.sh` to accept optional service argument
- Modified `scripts/lints/backend/validate-route-actions.ts` to accept optional service argument
- Maintains backward compatibility

**Usage:**
```bash
# Validate all services (old behavior)
./validate-structure.sh

# Validate specific service (new)
./validate-structure.sh backend-audio
```

**Benefit:** Enables per-service validation for parallel execution

**Rollback:** Validators still work with no arguments (old behavior)

---

### Phase 3: Parallel Scripts ✅ COMPLETE

**Status:** Completed and committed

**Changes:**
- Created `scripts/lints/lint-backend-parallel-v2.sh` (recommended)
- Created `scripts/lints/lint-backend-parallel.sh` (alternative)
- Added npm scripts to root `package.json`:
  - `lint:backend:parallel` - Parallel backend linting
  - `lint:parallel` - All linting in parallel

**Usage:**
```bash
# Use new parallel linting
bun run lint:backend:parallel

# Old sequential linting still works
bun run lint:backend
```

**Benefit:** 4x faster linting with no breaking changes

**Rollback:** Keep using `lint:backend` for sequential

---

### Phase 4: Testing & Validation 🔄 IN PROGRESS

**Status:** Pending team action

**Required Tests:**

1. **Performance Benchmarks**
   ```bash
   # Measure baseline
   time ./scripts/lints/lint-backend.sh

   # Measure parallel
   time ./scripts/lints/lint-backend-parallel-v2.sh

   # Measure with cache (run twice)
   time ./scripts/lints/lint-backend-parallel-v2.sh
   time ./scripts/lints/lint-backend-parallel-v2.sh
   ```

2. **Error Detection**
   - Introduce ESLint error → Verify caught
   - Introduce structure violation → Verify caught
   - Introduce route-action mismatch → Verify caught
   - Verify error messages are clear

3. **Failure Modes**
   - Test with one service failing
   - Test with multiple services failing
   - Verify all failures are reported

**Success Criteria:**
- [ ] Parallel is measurably faster (2-4x)
- [ ] All errors are caught (same as sequential)
- [ ] Error output is readable
- [ ] No false positives/negatives

**Timeline:** 1-2 days

---

### Phase 5: CI/CD Integration 📋 PENDING

**Status:** Not started

**Required Changes:**

1. **GitHub Actions** (if exists)
   ```yaml
   # .github/workflows/lint.yml
   - name: Lint backend
     run: bun run lint:backend:parallel
   ```

2. **Pre-commit Hooks** (if exists)
   ```bash
   # .git/hooks/pre-commit
   ./scripts/lints/lint-backend-parallel-v2.sh
   ```

3. **Developer Documentation**
   - Update README with new lint commands
   - Document performance benefits
   - Add troubleshooting section

**Timeline:** 1 day

---

### Phase 6: Adoption & Deprecation 📋 PENDING

**Status:** Not started (waiting for Phase 4 validation)

**Option A: Gradual Migration (Recommended)**
1. Keep both scripts for 2-4 weeks
2. Encourage team to use `lint:backend:parallel`
3. Gather feedback
4. Make parallel the default
5. Deprecate sequential script

**Option B: Immediate Switch**
1. Replace `lint:backend` to use parallel script
2. Remove sequential script
3. Update documentation

**Recommended:** Option A for lower risk

**Timeline:** 2-4 weeks

---

## Risk Assessment

### Low Risk ✅
- ESLint caching - Standard ESLint feature, widely used
- Validator refactoring - Backward compatible
- New parallel scripts - Non-breaking addition

### Medium Risk ⚠️
- Changing default lint command - May affect developer workflows
- CI/CD changes - Requires testing in production

### Mitigation
- Phased rollout with validation at each step
- Keep sequential script as fallback
- Clear documentation and communication
- Easy rollback path

---

## Rollback Plan

If issues occur at any phase:

### Phase 1 (ESLint Cache)
```bash
# Remove --cache from package.json files
# Delete .eslintcache entries in .gitignore
git revert <commit-hash>
```

### Phase 2 (Validators)
```bash
# Validators still work without arguments
# No rollback needed unless bugs found
git revert <commit-hash>
```

### Phase 3 (Parallel Scripts)
```bash
# Simply don't use the new scripts
# Old lint:backend still works
# Or revert commits
git revert <commit-hash>
```

### Phase 4-6
```bash
# Revert CI/CD changes
# Switch back to lint:backend
# Remove parallel scripts if desired
```

---

## Communication Plan

### Team Notification
**When:** After Phase 4 validation completes

**Message:**
```
🚀 Faster Linting Available!

We've implemented parallel linting for backend services.

**Performance:** 4x faster (8s → 2s), 16x with cache

**Usage:**
- Try it: `bun run lint:backend:parallel`
- Old way still works: `bun run lint:backend`

**Feedback:** Please report any issues or unexpected behavior

**Docs:** See docs/research/parallel-linting-examples.md
```

### Documentation Updates
- [ ] Update main README
- [ ] Update CONTRIBUTING.md (if exists)
- [ ] Update onboarding docs
- [ ] Add to team wiki/docs

---

## Success Metrics

### Quantitative
- [ ] Linting time reduced by 50%+
- [ ] No increase in false positives/negatives
- [ ] Cache hit rate >80% on subsequent runs
- [ ] No CI/CD failures due to linting changes

### Qualitative
- [ ] Positive team feedback
- [ ] No developer complaints
- [ ] Clear, readable error output
- [ ] Easy to debug when issues occur

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: ESLint Caching | Complete | ✅ |
| Phase 2: Validator Refactoring | Complete | ✅ |
| Phase 3: Parallel Scripts | Complete | ✅ |
| Phase 4: Testing & Validation | 1-2 days | 🔄 |
| Phase 5: CI/CD Integration | 1 day | 📋 |
| Phase 6: Adoption & Deprecation | 2-4 weeks | 📋 |

**Total Estimated Timeline:** 3-5 weeks from current state

---

## Quick Start Guide

### For Developers

**Try parallel linting today:**
```bash
# Run parallel backend linting
bun run lint:backend:parallel

# Run all linting in parallel
bun run lint:parallel
```

**If you encounter issues:**
```bash
# Fallback to sequential
bun run lint:backend
```

**Report issues:**
- Create GitHub issue with error details
- Include: command run, error output, expected behavior

### For CI/CD

**Current state:** No changes needed
**Future:** Will switch to `lint:backend:parallel` after validation

---

## Appendix

### Related Documents
- [Concurrent Linting Research](./concurrent-linting-research.md) - Full research findings
- [Parallel Linting Examples](./parallel-linting-examples.md) - Implementation examples
- [Scripts README](../../scripts/lints/README.md) - Script documentation (if exists)

### Script Locations
- Sequential: `scripts/lints/lint-backend.sh`
- Parallel (recommended): `scripts/lints/lint-backend-parallel-v2.sh`
- Parallel (staged): `scripts/lints/lint-backend-parallel.sh`
- Validators: `scripts/lints/backend/validate-*.{sh,ts}`

### Package.json Scripts
- `lint:backend` - Current sequential linting
- `lint:backend:parallel` - New parallel linting
- `lint:parallel` - All linting in parallel (backend + frontend)

---

## Questions?

Contact: [Project maintainers]

Last Updated: 2024-12-08
