# CLI Performance Optimization Opportunities

Based on trace analysis from a typical watch mode file change in `reference-docs/src/components/DocLayout/DocSidebar.tsx`.

## Current Timeline (Incremental Build)

```
07:39:01.441 - watch:change event
07:39:01.442 - virtual:fs:change (copy complete, ~1ms)
07:39:01.442 - Vite HMR triggers
07:39:01.531 - Panda extracts CSS (89ms)
07:39:01.743 - system:worker starts config rebuild (~302ms from watch:change)
07:39:01.841 - Eval completes (54 fragments from 31 files, ~98ms)
07:39:01.854 - Config bundled and written (~13ms)
07:39:02.009 - Panda codegen completes (~155ms)
07:39:02.377 - Panda CSS generation completes (~368ms)
07:39:02.778 - Packager starts (~401ms after CSS)
07:39:02.794 - Packager completes (16ms)

Total: ~1.35 seconds (watch:change → packager:complete)
```

## Problem 1: Unnecessary Config Recompilation

**Finding**: Every file change triggers full config recompilation (eval → bundle → write).

**Evidence**:

```
[07:39:01.841] Collected 54 config fragments from 31 files
[createPandaConfig] Found 31 config files
[createPandaConfig] Bundling with esbuild...
```

**Impact**: ~400ms of wasted work for non-config files.

**Root Cause**: `system:worker` listens to ALL `virtual:fs:change` events, not just `src/styled/` changes.

**Solution**:

```typescript
// In system/worker.ts
on('virtual:fs:change', async payload => {
  const { path } = payload

  // Only rebuild config if it's a styled file
  if (path.includes('/src/styled/') || path.includes('/tokens.ts')) {
    log.debug('[system:worker] styled file changed, rebuilding config')
    await createPandaConfig(coreDir)
  } else {
    log.debug('[system:worker] non-styled file, skipping config rebuild')
  }

  // Panda codegen/CSS still runs (handles its own incremental updates)
})
```

**Expected Improvement**: ~400ms saved on non-styled file changes (70% faster).

## Problem 2: Packager Waits for Full Pipeline

**Finding**: Packager starts 401ms after CSS generation completes.

**Evidence**:

```
07:39:02.377 - system:compiled (CSS done)
07:39:02.778 - packager starts
```

**Root Cause**: Packager worker listens to `system:compiled` and rebundles everything, even when only virtual files changed.

**Potential Solution**: Skip packager if only virtual files changed (no system/styled changes).

```typescript
// In packager/worker.ts
on('system:compiled', async () => {
  // Check if system files actually changed
  // For now, packager always runs (safe but slow)
})
```

**Alternative**: Make packager watch-mode aware and only rebundle changed entries.

**Expected Improvement**: TBD (needs measurement).

## Problem 3: Panda Codegen Double Rebuild

**Finding**: Panda rebuilds config twice after config file write.

**Evidence**:

```
🐼 info [ctx:change] config changed, rebuilding...
🐼 info [ctx:updated] config rebuilt ✅
🐼 info [ctx:change] config changed, rebuilding...  ← duplicate
🐼 info [ctx:updated] config rebuilt ✅
```

**Root Cause**: Panda's watch mode detects the config write and rebuilds, but then something triggers a second rebuild.

**Investigation Needed**: Why does Panda rebuild twice?

**Expected Improvement**: ~100ms (eliminate redundant rebuild).

## Problem 4: Serial System Pipeline

**Finding**: Eval → Config → Codegen → CSS runs serially (~523ms total).

**Current Flow**:

```
Eval (98ms) → Config (13ms) → Codegen (155ms) → CSS (368ms)
```

**Potential Optimization**: If config unchanged, skip eval and config bundling entirely.

```typescript
// Cache config hash
let lastConfigHash = ''

on('virtual:fs:change', async payload => {
  if (isStyledFile(payload.path)) {
    const fragments = await runEval(...)
    const configHash = hashFragments(fragments)

    if (configHash !== lastConfigHash) {
      await createPandaConfig(...)
      lastConfigHash = configHash
    } else {
      log.debug('[system:worker] config unchanged, skipping bundle')
    }
  }

  // Panda codegen/CSS still runs (it's incremental)
})
```

**Expected Improvement**: Skip 111ms (eval + config) when config unchanged.

## Optimization Priority

### High Priority (Quick Wins)

1. **Skip config rebuild for non-styled files** (Problem 1)
   - Complexity: Low (simple path check)
   - Impact: ~400ms saved on 90% of file changes
   - Risk: Low (covered by existing tests)

2. **Investigate Panda double rebuild** (Problem 3)
   - Complexity: Medium (requires debugging Panda watch mode)
   - Impact: ~100ms
   - Risk: Low (Panda-internal issue)

### Medium Priority

3. **Config hash caching** (Problem 4)
   - Complexity: Medium (hashing, cache management)
   - Impact: 111ms when config stable
   - Risk: Medium (cache invalidation bugs)

### Low Priority (Needs More Data)

4. **Smart packager triggering** (Problem 2)
   - Complexity: High (complex dependency tracking)
   - Impact: TBD (might be necessary for HMR)
   - Risk: High (could break hot reload)

## Target Performance

**Current**: 1.35s (watch:change → packager:complete)

**After Quick Wins**: ~850ms (37% faster)

- Skip config rebuild: -400ms
- Fix Panda double rebuild: -100ms

**Ideal**: <500ms for typical file changes

- Requires config hash caching + smarter packager

## Testing Strategy

Before optimizing:

1. Add performance benchmarks (log timestamps for each phase)
2. Create test suite that exercises:
   - Non-styled file changes (should skip config)
   - Styled file changes (should rebuild config)
   - Config-only changes (tokens.ts)
3. Measure 10 file changes in each category
4. Compare before/after timings

## Next Steps

1. Implement Problem 1 fix (skip config rebuild)
2. Add debug timing logs to system/worker.ts
3. Create benchmark script for watch mode performance
4. Measure improvement
5. Move to Problem 3 if significant gains achieved
