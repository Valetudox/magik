# Async Task: Add max concurrency settings to linting tasks

## Issue
https://github.com/Valetudox/magik/issues/70

## Description
Introduce a max concurrency settings in the @scripts/lints/ directory so we can set a number and run the tasks concurrently. The p-all npm package can help with this.

## Implementation Requirements

1. **Install p-all package**
   - Add p-all as a dev dependency to the root package.json

2. **Add concurrency configuration**
   - Add a concurrency option to the lint command in `/home/magic/repositories/magik/scripts/lints/lint-all.ts`
   - Make it configurable via CLI option (e.g., `--concurrency <number>`)
   - Set a sensible default (e.g., 5)

3. **Update TaskExecutor**
   - Modify `/home/magic/repositories/magik/scripts/lints/executor/task-executor.ts` to use p-all for concurrent task execution
   - Replace the current `Promise.all()` approach with p-all to control concurrency
   - Ensure the concurrency setting is respected when running tasks

4. **Update types if needed**
   - Update `/home/magic/repositories/magik/scripts/lints/types.ts` if any new types are needed for concurrency settings

5. **Testing**
   - Test that the concurrency setting works correctly
   - Verify that tasks still execute properly with different concurrency values
   - Ensure progress reporting still works correctly

## Files to Modify
- `/home/magic/repositories/magik/package.json` - Add p-all dependency
- `/home/magic/repositories/magik/scripts/lints/lint-all.ts` - Add CLI option for concurrency
- `/home/magic/repositories/magik/scripts/lints/executor/task-executor.ts` - Implement p-all for concurrency control
- `/home/magic/repositories/magik/scripts/lints/types.ts` - Update types if needed

## Technical Notes
- Currently, tasks run with unlimited concurrency via `Promise.all()`
- The p-all package allows controlling how many promises run concurrently
- This will help prevent resource exhaustion when linting many services
