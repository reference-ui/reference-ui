# Build Plan: Portable Reference-Core via CLI

## Goal

Make `reference-ui/core` fully portable and self-building by replacing `build-cli.mjs` with the CLI itself. The CLI will compile itself (reference-core CLI), reference-system, and reference-react as part of the `ref sync` pipeline on initial startup.

**Why**: Eliminates external build dependency, creates a single, unified build entry point, and enables the CLI to dogfood its own infrastructure.

---

## Current State

### Dependency Chain

```
build-cli.mjs (esbuild script)
    │
    ├─ Bundles src/cli → dist/cli/index.mjs
    ├─ Bundles workers → dist/cli/{watch,virtual,system,packager,packager-ts}/worker.mjs
    └─ Creates shebang + chmod 755

ref sync (uses dist/cli)
    │
    ├─ Virtual: Copies user files
    ├─ System: Compiles Panda config
    ├─ Packager: Bundles @reference-ui/react
    └─ Packager-TS: Emits .d.ts
```

### Current `sync` Command Flow

```
1. Load user config
2. Init event bus + logging
3. Watch (if --watch)
4. Virtual → System → Packager → Packager-TS
```

### Problem

- `build-cli.mjs` is a separate script; requires esbuild to be available
- CLI can't rebuild itself
- Two entry points: build script + CLI command
- No way to version-control the build process

---

## Proposed Solution

### New Execution Model

Extend the **packager** to bundle the CLI itself as its first responsibility. Reorder the pipeline:

```
Sync (main thread, unbundled CLI from src/)
    │
    ├─ Load config
    ├─ Init event bus + logging
    │
    ├─ [1] Packager (includes CLI bundling)
    │   ├─ Bundle CLI → dist/cli/
    │   └─ Bundle @reference-ui/react → node_modules/
    │
    ├─ [2] Packager-TS (uses bundled outputs)
    │   └─ Generate .d.ts
    │
    ├─ [3] Virtual → System → (rest of pipeline)
    │
    └─ Watch (if --watch)
```

### Key Insight: Packager as Universal Bundler

The packager becomes responsible for bundling **all outputs**:

- CLI (source → dist/)
- Packages (react, system, etc. → node_modules/)

No separate cli-bundler worker needed. The unbundled CLI (from src/) runs once to bundle itself via the packager, then everything else follows.

**Why this is cleaner**:

- Single bundler for all artifacts
- No duplicate bundling logic
- Follows the single-responsibility principle (packager = bundler)

---

## Execution Plan

### Phase 1: Extend Packager for CLI Bundling

**File**: `packager/bundler.ts` (extend existing class)

Add CLI bundling to the `Bundler` class:

```typescript
export class Bundler {
  async bundle() {
    // NEW: Bundle CLI first
    await this.bundleCli()

    // EXISTING: Bundle packages
    for (const pkg of PACKAGES) {
      await this.bundlePackage(pkg)
    }
  }

  private async bundleCli() {
    // Bundle src/cli/index.ts → dist/cli/index.mjs
    // Bundle each worker → dist/cli/{worker}/worker.mjs
    // Add shebang + chmod
  }
}
```

### Phase 2: Reorder Sync Pipeline

**File**: `sync/index.ts`

```typescript
export const syncCommand = async (cwd: string, options: { watch?: boolean }) => {
  const config = await loadUserConfig(cwd)

  initEventBus(config)
  initLog(config)

  log('🔄 Syncing Reference UI...')

  // NEW ORDER: Packager first (bundles CLI + packages)
  log('📦 Bundling...')
  await initPackager(cwd, config)

  // Then packager-ts (uses bundled outputs)
  log('📝 Generating types...')
  await initTsPackager(cwd, config)

  // EXISTING: Virtual filesystem + system
  log('📂 Virtual filesystem...')
  initVirtual(cwd, config, { virtualDir: config.virtualDir })

  log('🎨 Panda system...')
  initSystem(cwd, config)

  // Watch last (if needed)
  if (options.watch) {
    initWatch(cwd, config)
  }

  log('✨ Done!')
}
```

### Phase 3: Update Packager Configuration

**File**: `packager/packages.ts`

Add CLI to the packages list or create a separate bundling step:

```typescript
const CLI_BUNDLE: BundleDefinition = {
  name: 'reference-ui-cli',
  entries: {
    index: 'src/cli/index.ts',
    'watch/worker': 'src/cli/watch/worker.ts',
    'virtual/worker': 'src/cli/virtual/worker.ts',
    'system/worker': 'src/cli/system/worker.ts',
    'packager/worker': 'src/cli/packager/worker.ts',
    'packager-ts/worker': 'src/cli/packager-ts/worker.ts',
  },
  outdir: 'dist/cli',
  shebang: true, // Add #!/usr/bin/env node to index
}

export const PACKAGES = [CLI_BUNDLE, REACT_PACKAGE, SYSTEM_PACKAGE]
```

### Phase 4: No Detection Logic Needed

Since packager runs first, bundling always happens. The `build-cli.mjs` script can be removed immediately—there's no need for a separate bootstrap phase or detection logic.

---

## Workers Involved

### Existing Workers (No Changes)

- `watch` - Monitors files, emits events
- `virtual` - Copies user files
- `system` - Panda config compilation
- `packager` - **Extended to bundle CLI + packages**
- `packager-ts` - Emits .d.ts

**Key change**: The packager worker now bundles the CLI in addition to user packages. This replaces the need for a separate cli-bundler.

---

## Implementation Steps

### Step 1: Extend Packager Bundler

**File**: `src/cli/packager/bundler.ts`

Add CLI bundling as the first step:

```typescript
export class Bundler {
  async bundle() {
    log.debug('[packager] Starting bundler')

    // NEW: Bundle CLI first (it will bundle the rest of the system)
    await this.bundleCli()

    // EXISTING: Bundle packages
    for (const pkg of PACKAGES) {
      await this.bundlePackage(pkg)
    }
  }

  private async bundleCli() {
    log.debug('[packager] Bundling CLI')

    const coreDir = resolveCorePackageDir()
    const distDir = resolve(coreDir, 'dist', 'cli')

    // Entry points: main + each worker
    const entryPoints = {
      index: resolve(coreDir, 'src/cli/index.ts'),
      'watch/worker': resolve(coreDir, 'src/cli/watch/worker.ts'),
      'virtual/worker': resolve(coreDir, 'src/cli/virtual/worker.ts'),
      'system/worker': resolve(coreDir, 'src/cli/system/worker.ts'),
      'packager/worker': resolve(coreDir, 'src/cli/packager/worker.ts'),
      'packager-ts/worker': resolve(coreDir, 'src/cli/packager-ts/worker.ts'),
    }

    // Build each entry point
    for (const [name, entry] of Object.entries(entryPoints)) {
      const outfile = resolve(distDir, `${name}.mjs`)
      await build({
        entryPoints: [entry],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node18',
        external: ['esbuild', 'typescript', 'commander', ...EXTERNAL_DEPS],
        outfile,
      })
    }

    // Add shebang to main entry
    const mainEntry = resolve(distDir, 'index.mjs')
    const content = readFileSync(mainEntry, 'utf-8')
    if (!content.startsWith('#!/usr/bin/env node')) {
      writeFileSync(mainEntry, '#!/usr/bin/env node\n' + content)
    }
    chmodSync(mainEntry, 0o755)

    log.debug('[packager] CLI bundled')
  }
}
```

### Step 2: Reorder Sync Pipeline

**File**: `src/cli/sync/index.ts`

Move packager to run first:

```typescript
export const syncCommand = async (cwd: string, options: { watch?: boolean }) => {
  const config = await loadUserConfig(cwd)

  initEventBus(config)
  initLog(config)

  log('🔄 Syncing Reference UI...')

  // NEW ORDER
  log('📦 Bundling CLI and packages...')
  await initPackager(cwd, config)

  log('📝 Generating TypeScript declarations...')
  await initTsPackager(cwd, config)

  log('📂 Setting up virtual filesystem...')
  initVirtual(cwd, config, { virtualDir: config.virtualDir })

  log('🎨 Compiling Panda system...')
  initSystem(cwd, config)

  if (options.watch) {
    log('👀 Watching for changes...')
    initWatch(cwd, config)
  }

  log('✨ Done!')
}
```

### Step 3: Update Watch Mode Behavior

When a user edits src/cli/\*, the watch mode will re-run the entire sync pipeline, including packager (which will rebundle the CLI). This is automatic and requires no additional changes.

### Step 4: Remove build-cli.mjs

Delete `scripts/build-cli.mjs` and update `package.json`:

```json
{
  "scripts": {
    "build": "ref sync",
    "watch": "ref sync --watch"
  }
}
```

Update CI/CD to use `ref sync` instead of `npm run build-cli`.

---

## Migration Path

### Phase A: Extend Packager (No Breaking Changes)

1. Add `bundleCli()` method to packager's `Bundler` class
2. Reorder sync pipeline to call packager first
3. Test: `ref sync` now rebuilds CLI + packages

### Phase B: Update CI/Scripts

1. Delete `scripts/build-cli.mjs`
2. Update `package.json` to remove build-cli script
3. Update CI to use `ref sync` instead of npm scripts
4. Test in monorepo environment

### Phase C: Full Adoption

1. Watch mode now auto-rebuilds CLI on src/cli changes
2. No external build dependency
3. All bundling goes through packager

---

## Benefits

| Aspect           | Before                           | After                           |
| ---------------- | -------------------------------- | ------------------------------- |
| **Build entry**  | `npm run build-cli` + `ref sync` | Single: `ref sync`              |
| **Self-reliant** | Depends on esbuild script        | CLI is self-hosting             |
| **Versioning**   | External script                  | Part of CLI, version-controlled |
| **Watch mode**   | Can't rebuild CLI on edit        | Auto-rebuilds via watch thread  |
| **Portability**  | Tied to build script             | Fully autonomous                |
| **Setup**        | Two steps                        | One step                        |

---

## Watch Mode Behavior

When developing the CLI:

```
User edits src/cli/sync/index.ts
         │
         ▼
   @parcel/watcher emits watch:change
         │
         ▼
   Watch worker: emit('watch:change')
         │
         ▼
   Sync (main): on('watch:change') → re-run pipeline
         │
         ▼
   Packager (bundles CLI + packages)
         │
         ▼
   CLI rebuilt in dist/
         │
         ▼
   Continue with PackagerTS, Virtual, System
```

Result: Live rebuilding of the CLI as you edit.

**No need for separate detection or bootstrap logic**—the packager always runs and will rebundle everything including the newly-edited CLI.

---

## Performance Notes

- **Cold start**: +500ms-1s for CLI bundling (one-time, or on src/cli changes)
- **Incremental**: esbuild handles incremental bundling if we add caching
- **Watch mode**: Bootstrap only runs on file change, minimal overhead

---

## Open Questions

1. **Where should CLI be installed?**
   - Option A: `dist/cli/index.mjs` (current)
   - Option B: `node_modules/.bin/ref` (standard)
   - → Recommend: Both (symlink or copy)

2. **Should packager-ts cache?**
   - Currently full recompile each time
   - Could benefit from TypeScript compiler caching
   - See `packager-ts/TODO`

3. **Do we need a separate bootstrap phase?**
   - Could merge into first worker call
   - Current approach is explicit and clear
   - → Keep separate for now

---

## Success Criteria

- [ ] Packager extends to bundle CLI as first step
- [ ] Sync pipeline reordered: Packager → Packager-TS → Virtual → System → Watch
- [ ] `ref sync` rebuilds CLI on every run (or cached if using esbuild caching)
- [ ] Watch mode auto-rebuilds CLI on src/cli changes
- [ ] No external `build-cli.mjs` script needed
- [ ] CLI can be invoked from dist/cli/index.mjs with shebang 755
- [ ] All existing tests pass
- [ ] Performance remains <15s cold start, <1s incremental
- [ ] `build-cli.mjs` deleted and removed from CI
- [ ] No separate detection/bootstrap logic needed

---

## Timeline

- **Week 1**: Extend packager bundler to handle CLI, reorder sync pipeline
- **Week 2**: Test CLI self-bundling, verify watch mode
- **Week 3**: Delete build-cli.mjs, update CI, document changes
- **Week 4**: Verification, performance testing, release notes
