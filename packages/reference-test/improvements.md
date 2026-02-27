# reference-test Improvements

Logged issues and ideas for future work.

---

## pnpm test always does full sandbox rebuild (2025-02-27)

**Symptom:** Running `pnpm test` from the workspace root triggers a full sandbox rebuild every time instead of using the cache (cached / sync-only).

**Cause:** The root `package.json` test script runs `pnpm --filter @reference-ui/core run build` before `pnpm --filter @reference-ui/reference-test run test`. The core build runs first, which:
1. Rebuilds `dist/cli/index.mjs` → changes its mtime
2. `coreHash` is derived from mtime+size, so it changes every build
3. Prepare sees `state.coreHash !== coreHash` → does sync-only (or full when other factors apply)

Additional factors observed: `coreSourceHash` can differ between sandboxes (investigate); react18 state file sometimes missing. `pnpm run test:prepare` alone caches correctly on the second run; the issue appears when running the full `pnpm test` flow.

**Workaround:** `rm -rf packages/reference-test/.sandbox` then `pnpm run test:prepare` twice—second run should cache. Or run `pnpm run test:prepare` directly for iterative work without the upfront core rebuild.

**Potential fixes:**
- Use content hash for `coreHash` instead of mtime+size so identical rebuilds cache
- Run core build only when core source changed (e.g. via Nx inputs)
- Or accept sync-only on each test run as acceptable (still faster than full)
