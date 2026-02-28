# CLI Cleanup & Finalization Plan

Comprehensive plan for finalizing the CLI. Combines complexity reduction, architectural improvements, performance optimizations, and test coverage validation.

---

## Status Overview

**Current State**: ✅ Functionally complete, well-tested happy path  
**Goal**: Clean, maintainable, production-ready CLI

---

## Phase 1: Critical Complexity Reduction

### 1.1 `lib/resolve-core.ts` — Cyclomatic Complexity: 11

**Issue**: Dense branching with nested while loops and try/catch blocks.

**Action**:

```typescript
// Extract helpers (reduce CC from 11 → 4):
- findPackageDirUpward(startDir: string, maxDepth: number): string | null
- detectMonorepoRoot(dir: string): string | null
- isWithinNodeModules(dir: string): boolean

// Add early returns to flatten nesting
```

**Impact**: Maintainability 92 → 110+

**Files**: `lib/resolve-core.ts`  
**Estimate**: 45 minutes

---

### 1.2 `packager/bundler.ts` — Cyclomatic Complexity: 15, Physical LOC: 261

**Issue**: Large module with multiple responsibilities (bundle, copy, emit).

**Action**:

```
Split into:
- packager/bundler.ts      — Main orchestration, bundleAllPackages()
- packager/emit.ts         — writeIfChanged(), createPackageContent()
- packager/copy.ts         — copyDirRecursive(), copyDirectories()
- packager/transform.ts    — transformTypeScriptFile()
```

**Impact**: Maintainability 124 → 140+, easier to navigate

**Files**: `packager/bundler.ts`, new modules  
**Estimate**: 1.5 hours

---


### 1.4 `config/load-config.ts` — Cyclomatic Complexity: 8

**Issue**: Dense loader callback with many branches.

**Action**:

```typescript
// Extract:
- resolveConfigFile(cwd: string): string | null
- bundleConfig(configPath: string): Promise<string>
- evaluateConfig(bundledCode: string): Promise<ReferenceUIConfig>
- validateConfig(config: unknown): ReferenceUIConfig

// Current loadUserConfig() becomes orchestration:
export async function loadUserConfig(cwd: string): Promise<ReferenceUIConfig> {
  const configPath = resolveConfigFile(cwd)
  if (!configPath) throw new ConfigNotFoundError(cwd)

  const bundled = await bundleConfig(configPath)
  const config = await evaluateConfig(bundled)
  return validateConfig(config)
}
```

**Impact**: CC 8 → 2, maintainability 111 → 130+

**Files**: `config/load-config.ts`  
**Estimate**: 45 minutes

---



## Phase 3: Performance Optimizations

### 3.1 Skip Config Recompilation on Non-Styled File Changes (from `optimise.md`)

**Issue**: Every file change triggers config rebuild (~121ms wasted).

**Action**:

```typescript
// In system/worker.ts:
on('virtual:fs:change', async payload => {
  const { path } = payload

  // Only rebuild config for styled files
  if (path.includes('/src/styled/') || path.includes('/tokens.ts')) {
    await createPandaConfig(coreDir)
  }
  // Panda CSS still runs (handles its own incremental updates)
})
```

**Expected Improvement**: ~400ms saved on non-styled file changes (70% faster).

**Files**: `system/worker.ts`  
**Estimate**: 15 minutes

---

### 3.2 Deduplicate Packager Runs (from `optimise.md`)

**Issue**: Packager runs twice per change (~460ms wasted).

**Root Cause**: Both Panda codegen + CSS emit `system:compiled` → both trigger packager.

**Action**:

```typescript
// In packager/index.ts:
let debounceTimer: NodeJS.Timeout | null = null

on('system:compiled', async () => {
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(async () => {
    await runPackager()
  }, 50) // Wait 50ms for dual events to settle
})
```

**Expected Improvement**: ~500ms saved (eliminate duplicate packager + packager-ts).

**Files**: `packager/index.ts`  
**Estimate**: 15 minutes

---

### 3.3 Cache `packager-ts` Outputs (from `todo.md`)

**Issue**: Type generation runs every time (~441ms), even if inputs unchanged.

**Action**:

```typescript
// In packager-ts/index.ts:
const outputHash = hashFiles(outputDir)
const inputHash = hashFiles(bundledPackages)

if (outputHash === lastKnownHash && inputHash === lastInputHash) {
  log.debug('[packager-ts] skipping, no changes')
  return
}
```

**Expected Improvement**: ~440ms saved on incremental builds with no TS changes.

**Files**: `packager-ts/index.ts`, `lib/hash.ts` (new)  
**Estimate**: 45 minutes

---

### 3.4 Graceful Shutdown (from `todo.md`)

**Issue**: Process may not clean up workers properly on exit.

**Action**:

```typescript
// In thread-pool/index.ts:
process.on('SIGINT', async () => {
  log.info('[pool] shutting down gracefully...')
  await shutdown()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await shutdown()
  process.exit(0)
})
```

**Files**: `thread-pool/index.ts`  
**Estimate**: 15 minutes

---

**Phase 3 Total**: ~1.5 hours  
**Result**: Faster watch mode, incremental builds properly cached

---

## Phase 4: Test Coverage & Validation

### 4.1 Validate All Existing Tests Pass

**Action**: Run full test matrix (react17/18/19 × vite5).

**Command**:

```bash
cd packages/reference-test
pnpm run test:prepare
pnpm run test:matrix
```

**Acceptance**: All tests green.

**Estimate**: 10 minutes (automated)

---

### 4.2 Test CLI Directly (Not Just via `prepare.ts`)

**Issue**: Tests currently invoke CLI indirectly via prepare script.

**Action**: Add one test that runs `ref sync` in a sandbox and checks exit code.

**File**: `packages/reference-test/src/tests/cli-direct.spec.ts`

```typescript
test('ref sync exits 0 on success', async () => {
  const sandbox = getSandboxDir()
  const result = await execa('ref', ['sync'], { cwd: sandbox, reject: false })
  expect(result.exitCode).toBe(0)
})

test('ref sync is executable', async () => {
  const cliPath = join(CORE_PATH, 'dist/cli/index.mjs')
  const stat = statSync(cliPath)
  expect(stat.mode & 0o111).not.toBe(0) // Has execute bit
})
```

**Estimate**: 20 minutes

---

### 4.3 Error Handling (Future Polish, Not Blocking)

From `cli-pretest.md`, these are noted as **future polish**, not required now:

- Missing `ui.config.ts` error
- Invalid config syntax error
- Config schema validation

**Status**: Deferred to post-launch.

---

**Phase 4 Total**: ~30 minutes  
**Result**: Confidence that refactoring didn't break anything

---

## Phase 5: Documentation & Polish

### 5.1 Update `structure.md`

After splits (bundler → emit/copy/transform, config/load-config → extract), update structure map.

**Estimate**: 15 minutes

---

### 5.2 Add Inline JSDoc for Exported Functions

**Action**: Ensure all exported functions in `lib/`, `config/`, `system/` have JSDoc.

**Example**:

```typescript
/**
 * Resolves the @reference-ui/core package directory from the current working directory.
 * Searches upward through node_modules and monorepo package structure.
 *
 * @param fromCwd - Starting directory (user's project root)
 * @returns Absolute path to @reference-ui/core package
 * @throws {Error} If package not found after exhaustive search
 */
export function resolveCorePackageDir(fromCwd: string): string
```

**Estimate**: 30 minutes

---

### 5.3 Clean Up `todo.md`

Move completed items to `CHANGELOG.md` or mark as done.

**Estimate**: 5 minutes

---

**Phase 5 Total**: ~50 minutes  
**Result**: Well-documented, navigable codebase

---

## Comprehensive Checklist: Stones Unturned?

### ✅ Covered

- [x] Complexity hotspots (resolve-core, bundler, load-config, packages, child-process)
- [x] Architectural improvements (self-building CLI, public API)
- [x] Performance optimizations (config skipping, deduplication, caching, graceful shutdown)
- [x] Test coverage validation (existing tests = sufficient)
- [x] Documentation structure

### 🔍 Double-Check Areas

#### Event Bus Thread Safety

**Current**: Uses `BroadcastChannel` for cross-thread communication.

**Q**: Are there race conditions in rapid file changes?

**A**: No known issues. Events are async, workers handle at their own pace. Debouncing (Phase 3.2) handles duplicate events.

**Status**: ✅ No action needed

---

#### Worker Error Propagation

**Current**: Workers emit errors via event bus, main thread logs them.

**Q**: Do worker crashes kill the process or just log?

**A**: `piscina` handles worker crashes, restarts pool. Main thread does NOT exit. Watch mode continues.

**Status**: ✅ Robust, no action needed

---

#### Temp File Cleanup

**Current**: `mkdtempSync()` used in multiple places (packager-ts, microbundle, MDX transform).

**Q**: Are temp files cleaned up on error?

**A**:

- `packager-ts/compiler.ts` — ❌ No cleanup on error
- `lib/microbundle.ts` — ❌ No cleanup on error
- `system/eval/runner.ts` — ❌ No cleanup on error

**Action**: Wrap temp file operations in try/finally:

```typescript
const tmpDir = mkdtempSync(join(tmpdir(), 'ref-'))
try {
  // work
} finally {
  rmSync(tmpDir, { recursive: true, force: true })
}
```

**Files**: `packager-ts/compiler.ts`, `lib/microbundle.ts`, `system/eval/runner.ts`, `system/collectors/runCollectScript.ts`

**Estimate**: 20 minutes

**Status**: 🔴 **Should fix**

---

#### Config Hot Reload

**Q**: Does watch mode pick up `ui.config.ts` changes?

**A**: `watch/worker.ts` watches user's `include` paths. If `ui.config.ts` is in `include`, yes. Otherwise, no.

**Action**: Always watch `ui.config.ts` (add to watcher explicitly).

```typescript
// In watch/worker.ts:
const watchPaths = [
  ...config.include,
  join(sourceDir, 'ui.config.{ts,js,mjs}'), // NEW
]
```

**Files**: `watch/worker.ts`  
**Estimate**: 10 minutes

**Status**: 🟡 **Nice to have** (users can work around by including it)

---

#### CLI Version Flag

**Q**: Does `ref --version` work?

**A**: Yes, defined in `index.ts`: `.version('0.0.1', '-v, --version')`

**Q**: Is version hardcoded?

**A**: Yes (currently `0.0.1`). Should read from `package.json`.

**Action**:

```typescript
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'))

program.version(pkg.version, '-v, --version')
```

**Files**: `index.ts`  
**Estimate**: 10 minutes

**Status**: 🟡 **Nice to have**

---

#### Worker Memory Usage

**Q**: Is memory usage monitored/reported?

**A**: Yes, `thread-pool/index.ts` has `logProcessMemory` and `initMemoryLogging`.

**Q**: Is it enabled by default?

**A**: Only if `config.debug === true`.

**Status**: ✅ Already handled

---

#### Native Module (Rust) in `virtual/native/`

**Q**: Is this used? Stable?

**A**: `virtual/native/loader.ts` loads optional Rust rewriter for CSS/CVA imports.

**Q**: Does it fallback gracefully if missing?

**A**: Yes, `loadVirtualNative()` returns `null` if not found. JS fallback used.

**Status**: ✅ No action needed

---

#### Windows Compatibility

**Q**: Does CLI work on Windows?

**A**: Not explicitly tested. Potential issues:

- Path separators (`/` vs `\\`)
- Executable permissions (no `chmod` on Windows)
- Shebang ignored on Windows

**Action**:

- Use `path.join()`, `path.resolve()` everywhere (avoid string concat)
- Skip `chmod` on Windows (`process.platform === 'win32'`)
- Document: Windows users run `node dist/cli/index.mjs` (shebang doesn't work)

**Files**: Various (audit needed)  
**Estimate**: 1 hour

**Status**: 🟡 **Future** (document limitation for now)

---

### 📋 Additional Nice-to-Haves (Non-Blocking)

- [ ] `ref init` command (scaffold `ui.config.ts`)
- [ ] `ref doctor` command (validate setup)
- [ ] `ref clean` command (remove `.virtual`, `node_modules/@reference-ui`)
- [ ] Better error messages (colorize, suggest fixes)
- [ ] Progress indicators (spinners for long operations)
- [ ] Benchmark command (measure build time)

---

## Summary: What Must Be Done

### 🔴 Must Fix (Blocking)

1. **Temp file cleanup** (20 min) — Memory leak risk
2. **Phase 1: Complexity reduction** (4.5 hrs) — Maintainability

### 🟡 Should Do (High Value)

3. **Phase 2: Self-building CLI** (4 hrs) — Portability goal
4. **Phase 3: Performance** (1.5 hrs) — User experience

### 🟢 Nice to Have

5. **Config hot reload** (10 min)
6. **CLI version from package.json** (10 min)
7. **Windows compatibility** (1 hr, or document)

---

## Execution Order

```
Day 1 (AM): Phase 1.1-1.3 — resolve-core, bundler split, packages cleanup
Day 1 (PM): Phase 1.4-1.5 — load-config, child-process
Day 2 (AM): Temp file cleanup + Phase 3 (performance)
Day 2 (PM): Phase 2 (self-building CLI)
Day 3 (AM): Phase 4 (test validation)
Day 3 (PM): Phase 5 (docs + polish)

Total: ~12 hours over 3 days
```

---

## Final Confidence Check

**Before starting**: ✅  
**After Phase 1**: 🟢 Complexity under control  
**After Phase 2**: 🟢 CLI is portable  
**After Phase 3**: 🟢 Performance optimized  
**After Phase 4**: 🟢 Tests validate correctness  
**After Phase 5**: 🟢 Production-ready

**Ship it.** 🚀
