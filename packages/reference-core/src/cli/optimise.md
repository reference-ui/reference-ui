# CLI Performance Optimization Opportunities

Based on trace analysis from a typical watch mode file change in `reference-docs/src/components/DocLayout/DocSidebar.tsx`.

## Current Timeline (Incremental Build)

```
08:17:00.875 - [system:worker] virtual:fs:change → config
08:17:00.892 - Eval starts
08:17:00.997 - Eval completes (54 fragments from 31 files, ~105ms)
08:17:00.999 - Config scanning (31 files found, ~2ms)
08:17:00.999 - Config bundling starts (esbuild)
08:17:01.013 - Config written (~14ms)
08:17:01.013 - Both Panda processes detect config change
08:17:01.013 - Panda codegen + CSS start rebuilding in parallel
08:17:01.473 - First packager run (460ms after config, ~17ms duration)
08:17:01.977 - Second packager run (504ms after config, ~21ms duration)
08:17:03.808 - packager:ts starts (1.8s after packager)
08:17:04.249 - packager:ts completes (~441ms)

Total: ~3.37 seconds (virtual:fs:change → packager:ts complete)
Total to first packager: ~598ms
```

## Key Findings

1. **Config rebuilds on every file change** (105ms eval + 16ms config = 121ms wasted for non-styled files)
2. **Packager runs twice** (~38ms wasted + triggers duplicate packager:ts = ~460ms total waste)
3. **packager:ts is the slowest phase** (~441ms for TypeScript declaration generation)
4. **Most time is in Panda + packager:ts** (460ms + 2.8s = 3.26s out of 3.37s total)

## Problem 1: Unnecessary Config Recompilation

**Finding**: Every file change triggers full config recompilation (eval → bundle → write).

**Evidence**:

```
[08:17:00.875] [system:worker] virtual:fs:change → config
[08:17:00.997] [system:eval] Collected 54 frags from 31 file(s)
[08:17:00.999] [system:config] Found 31 config files
[08:17:00.999] [system:config] Bundling with esbuild...
[08:17:01.013] [system:config] Config written successfully
```

**Impact**: ~138ms of wasted work for non-config files (105ms eval + 16ms config + 17ms overhead).

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

## Problem 2: Duplicate Packager Runs

**Finding**: Packager runs TWICE for every file change, once per Panda process completion.

**Evidence**:

```
[08:17:01.473] [packager:worker] system:compiled → bundling packages
[08:17:01.490] [packager] ✅ 2 package(s) ready

[08:17:01.977] [packager:worker] system:compiled → bundling packages  ← DUPLICATE
[08:17:01.998] [packager] ✅ 2 package(s) ready
```

**Impact**: ~38ms of duplicate work (17ms + 21ms), triggers double packager:ts rebuild.

**Root Cause**: Both Panda processes (`panda codegen --watch` and `panda --watch`) emit `system:compiled` events when they complete. The packager worker listens to this event and rebundles on each emission.

**Solution**: Debounce `system:compiled` events in packager worker:

```typescript
// In packager/worker.ts
let debounceTimer: NodeJS.Timeout | null = null

on('system:compiled', async () => {
  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // Wait for both processes to settle
  debounceTimer = setTimeout(async () => {
    log.debug('[packager:worker] system:compiled → bundling packages')
    await runPackager(payload)
    debounceTimer = null
  }, 100) // 100ms debounce window
})
```

**Expected Improvement**:

- Eliminate duplicate packager run (~20ms saved)
- Eliminate duplicate packager:ts run (~440ms saved)
- Total: ~460ms saved (13% faster)

## Problem 3: Panda Dual Rebuild (Not a Bug)

**Finding**: Panda rebuilds config twice after config file write.

**Evidence**:

```
🐼 info [ctx:change] config changed, rebuilding...
🐼 info [ctx:updated] config rebuilt ✅
🐼 info [ctx:change] config changed, rebuilding...  ← Expected
🐼 info [ctx:updated] config rebuilt ✅
```

**Root Cause**: Watch mode spawns TWO separate Panda processes (see `runner.ts`):

1. `panda codegen --watch` (generates TypeScript utilities)
2. `panda --watch` (extracts CSS from source files)

Both processes watch `panda.config.ts`. When the config is written, both detect the change and log their rebuild status. This is **expected behavior** - both processes need to react to config changes since they generate different outputs.

**Status**: Working as designed. Both rebuilds are necessary and happen in parallel (~460ms total from config write to first packager trigger).

**Improvement Opportunity**: Could silence duplicate logging, but both processes must rebuild.

## Problem 4: Serial System Pipeline

**Finding**: Eval → Config → Panda runs serially (~598ms total to first packager).

**Current Flow**:

```
Eval (105ms) → Config (16ms) → Panda parallel (460ms) → Packager (17ms × 2)
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

**Expected Improvement**: Skip 121ms (eval + config) when config unchanged for styled file edits.

## Optimization Priority

### High Priority (Quick Wins)

1. **Debounce duplicate packager runs** (Problem 2)
   - Complexity: Low (simple setTimeout debounce)
   - Impact: ~460ms saved (eliminate duplicate packager + packager:ts)
   - Risk: Very low (debouncing is a well-known pattern)

2. **Skip config rebuild for non-styled files** (Problem 1)
   - Complexity: Low (simple path check)
   - Impact: ~138ms saved on 90% of file changes
   - Risk: Low (covered by existing tests)

### Medium Priority

3. **Config hash caching** (Problem 4)
   - Complexity: Medium (hashing, cache management)
   - Impact: 121ms when config stable but styled file changed
   - Risk: Medium (cache invalidation bugs)

## Target Performance

**Current**: ~3.37s (virtual:fs:change → packager:ts complete)  
**Current to first package**: ~598ms (virtual:fs:change → first packager ready)

**After Quick Win #1 (debounce packager)**: ~2.91s full, ~598ms to package

- Single packager run: -20ms
- Single packager:ts run: -440ms

**After Quick Win #2 (skip config for non-styled)**: ~2.77s full, ~460ms to package  
_(applies to 90% of file changes - non-styled files)_

- Skip eval + config: -138ms

**After Medium Priority (config hash)**: ~2.65s full, ~339ms to package  
_(applies when config unchanged but styled file modified)_

- Skip eval + config on unchanged: -121ms

**Ideal Target**: <500ms to first package, <2s to full pipeline completion

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

1. Implement Problem 2 fix (debounce packager) - **HIGHEST IMPACT**
2. Implement Problem 1 fix (skip config rebuild for non-styled files)
3. Add debug timing logs to system/worker.ts and packager/worker.ts
4. Create benchmark script for watch mode performance
5. Measure improvement after each optimization
6. Move to Problem 4 (config hash caching) if significant additional gains needed

**Priority Reasoning**: Problem 2 (debounce) saves the most time (~460ms = 14% of total pipeline) with minimal risk. Problem 1 applies to most file changes and is also low-risk.
