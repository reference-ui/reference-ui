# TypeScript Declaration (.d.ts) Generation Plan

## Overview

Add TypeScript declaration generation that runs **after** the packager bundles JavaScript. The ts-packager reads the bundled `.js` files from `node_modules/@reference-ui/*` and generates `.d.ts` files alongside them. All heavy TypeScript work runs in a dedicated worker thread for non-blocking performance.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Sync Command                             │
│                                                                   │
│  initVirtual → initSystem → initPackager → initTsPackager       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Packager Worker                             │
│                                                                   │
│  Bundle .js → node_modules/@reference-ui/system                  │
│  Bundle .js → node_modules/@reference-ui/react                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TS Packager Worker                           │
│                                                                   │
│  Read bundled .js from node_modules                              │
│         │                                                         │
│         ▼                                                         │
│    Cold Build                     Watch Mode                     │
│    ├─ createProgram()             ├─ createWatchCompilerHost()   │
│    ├─ emit()                      ├─ createWatchProgram()        │
│    └─ write .d.ts                 └─ incremental builder         │
│         │                                   │                     │
│         └───────────────┬───────────────────┘                    │
│                         ▼                                         │
│       Write .d.ts next to .js files                              │
│       (node_modules/@reference-ui/*/index.d.ts)                  │
│              Emit 'ts:complete' event                            │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

## Key Insight

The ts-packager operates on **bundled outputs**, not source files. It reads the `.js` files that the packager already created in `node_modules/@reference-ui/*` and generates corresponding `.d.ts` files.

**No virtual FS involvement.** It just generates types for the final bundled JavaScript.

## Implementation Steps

### 1. Thread Pool Setup

**File**: `src/cli/thread-pool/manifest.json`

```json
{
  "virtual": "src/cli/virtual/worker.ts",
  "system": "src/cli/system/worker.ts",
  "packager": "src/cli/packager/worker.ts",
  "packager-ts": "src/cli/packager-ts/worker.ts"
}
```

### 2. Event Bus Extensions

**File**: `src/cli/event-bus/events.ts`

```typescript
export type Events = {
  // ... existing events
  'ts:start': { mode: 'cold' | 'watch'; packages: string[] }
  'ts:complete': {
    emittedFiles: number
    diagnostics: number
    duration: number
  }
  'ts:diagnostics': {
    file: string
    line: number
    message: string
    severity: 'error' | 'warning'
  }
}
```

### 3. TS Packager Worker

**File**: `src/cli/packager-ts/worker.ts`

```typescript
import { runTsPackager } from './index'
import type { TsPackagerWorkerPayload } from './types'

/**
 * Worker entry point for TypeScript declaration generation
 *
 * Runs in a dedicated thread to avoid blocking the main CLI process
 */
export default async function worker(payload: TsPackagerWorkerPayload) {
  return runTsPackager(payload)
}
```

**File**: `src/cli/packager-ts/types.ts`

```typescript
import type { ReferenceUIConfig } from '../config'

export interface TsPackagerWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  mode: 'cold' | 'watch'
  packages: Array<{ name: string; entry: string }>
}

export interface EmittedFile {
  path: string
  content: string
  size: number
}
```

**File**: `src/cli/packager-ts/index.ts`

```typescript
import { log } from '../lib/log'
import { emit } from '../event-bus'
import { runColdBuild } from './cold-build'
import { runWatchBuild } from './watch-build'
import type { TsPackagerWorkerPayload } from './types'

/**
 * Main entry point for TypeScript declaration generation
 *
 * Coordinates between cold build and watch mode, manages the
 * TypeScript compiler lifecycle, and emits events for coordination.
 */
export async function runTsPackager(payload: TsPackagerWorkerPayload): Promise<void> {
  const { cwd, config, mode, packages } = payload

  log('')
  log('🔷 TypeScript Declaration Generation...')
  log('')

  emit('ts:start', { mode, packages: packages.map(p => p.name) })

  try {
    if (mode === 'watch') {
      // Watch mode: incremental compilation with builder program
      await runWatchBuild(cwd, packages, config)
    } else {
      // Cold build: one-shot compilation
      await runColdBuild(cwd, packages, config)
    }
  } catch (error) {
    log('[packager-ts] Error:', error)
    throw error
  }
}

/**
 * Initialize packager-ts from main thread
 */
export async function initTsPackager(
  cwd: string,
  config: ReferenceUIConfig,
  options: { watch?: boolean }
): Promise<void> {
  const { runWorker } = await import('../thread-pool')

  // Packages to generate types for
  const packages = [
    { name: '@reference-ui/system', entry: 'index.js' },
    { name: '@reference-ui/react', entry: 'index.js' },
  ]

  await runWorker('packager-ts', {
    cwd,
    config,
    mode: options.watch ? 'watch' : 'cold',
    packages,
  })
}
```

### 4. Cold Build Implementation

**File**: `src/cli/packager-ts/cold-build.ts`

```typescript
import ts from 'typescript'
import { join, dirname } from 'node:path'
import { writeFileSync, mkdirSync } from 'node:fs'
import { log } from '../lib/log'
import { emit } from '../event-bus'
import type { ReferenceUIConfig } from '../config'
import type { EmittedFile } from './types'

/**
 * Run one-shot TypeScript compilation (cold build)
 *
 * Creates a TypeScript program for bundled .js files, emits .d.ts declarations
 */
export async function runColdBuild(
  cwd: string,
  packages: Array<{ name: string; entry: string }>,
  config: ReferenceUIConfig
): Promise<void> {
  const startTime = Date.now()

  const emittedFiles: EmittedFile[] = []
  let totalDiagnostics = 0

  for (const pkg of packages) {
    const packageDir = join(cwd, 'node_modules', pkg.name)
    const entryPath = join(packageDir, pkg.entry)

    log(`[packager-ts] Generating types for ${pkg.name}...`)

    // Compiler options for declaration generation from JS
    const options: ts.CompilerOptions = {
      allowJs: true,
      declaration: true,
      emitDeclarationOnly: true,
      outDir: packageDir,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      skipLibCheck: true,
    }

    // Create program from the bundled JS file
    const program = ts.createProgram([entryPath], options)

    // Get diagnostics
    const diagnostics = [
      ...program.getConfigFileParsingDiagnostics(),
      ...program.getSyntacticDiagnostics(),
      ...program.getSemanticDiagnostics(),
    ]

    totalDiagnostics += diagnostics.length

    // Report diagnostics
    if (diagnostics.length > 0) {
      diagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
          const { line, character } = ts.getLineAndCharacterOfPosition(
            diagnostic.file,
            diagnostic.start!
          )
          const message = ts.flattenDiagnosticMessageText(diagnostic.message, '\n')

          emit('ts:diagnostics', {
            file: diagnostic.file.fileName,
            line: line + 1,
            message,
            severity:
              diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
          })

          log(
            `[packager-ts]   ${diagnostic.file.fileName}:${line + 1}:${character + 1} - ${message}`
          )
        } else {
          log(
            `[packager-ts]   ${ts.flattenDiagnosticMessageText(diagnostic.message, '\n')}`
          )
        }
      })
    }

    // Emit declarations
    const emitResult = program.emit(
      undefined, // All files
      (fileName, data) => {
        // Write .d.ts file next to .js file
        mkdirSync(dirname(fileName), { recursive: true })
        writeFileSync(fileName, data, 'utf-8')

        emittedFiles.push({
          path: fileName,
          content: data,
          size: Buffer.byteLength(data, 'utf-8'),
        })
      },
      undefined, // No cancellation token
      true, // Emit only .d.ts files
      undefined // No custom transformers
    )

    if (emitResult.emitSkipped) {
      log(`[packager-ts]   ⚠️  Emit skipped for ${pkg.name}`)
    }
  }

  const duration = Date.now() - startTime

  log('')
  log(`✅ TypeScript: Emitted ${emittedFiles.length} declaration(s) in ${duration}ms`)

  // Emit completion event
  emit('ts:complete', {
    emittedFiles: emittedFiles.length,
    diagnostics: totalDiagnostics,
    duration,
  })
}
```

### 5. Watch Build Implementation

**File**: `src/cli/packager-ts/watch-build.ts`

```typescript
import ts from 'typescript'
import { join, dirname } from 'node:path'
import { writeFileSync, mkdirSync } from 'node:fs'
import { log } from '../lib/log'
import { emit, on } from '../event-bus'
import type { ReferenceUIConfig } from '../config'

/**
 * Run incremental TypeScript compilation (watch mode)
 *
 * Uses createWatchCompilerHost and createWatchProgram for
 * efficient incremental rebuilds with builder program
 */
export async function runWatchBuild(
  cwd: string,
  packages: Array<{ name: string; entry: string }>,
  config: ReferenceUIConfig
): Promise<void> {
  log('[packager-ts] Starting watch mode...')

  // Listen for packager completion to trigger type generation
  on('packager:complete', async () => {
    log('[packager-ts] Packager completed, regenerating types...')

    // Re-run cold build (will be fast due to incremental compilation)
    const { runColdBuild } = await import('./cold-build')
    await runColdBuild(cwd, packages, config)
  })

  // Keep the worker alive
  return new Promise(() => {
    // Never resolves - watch mode runs indefinitely
  })
}
```

### 6. Sync Command Integration

**File**: `src/cli/sync/index.ts`

```typescript
import { log, initLog } from '../lib/log'
import { initEventBus, on } from '../event-bus'
import { loadUserConfig } from '../config'
import { initSystem } from '../system'
import { initVirtual } from '../virtual'
import { initPackager } from '../packager'
import { initTsPackager } from '../packager-ts'

export const syncCommand = async (cwd: string, options: { watch?: boolean }) => {
  const config = await loadUserConfig(cwd)

  initEventBus(config)
  initLog(config)

  // Listen for TS events
  on('ts:complete', payload => {
    log(
      `✅ TypeScript: Emitted ${payload.emittedFiles} declarations in ${payload.duration}ms`
    )
  })

  on('ts:diagnostics', payload => {
    const icon = payload.severity === 'error' ? '❌' : '⚠️'
    log(`${icon} ${payload.file}:${payload.line} - ${payload.message}`)
  })

  // 1. Copy user files to virtual FS
  initVirtual(cwd, config, {
    watch: options.watch,
    virtualDir: config.virtualDir,
  })

  // 2. Run Panda CSS codegen
  await initSystem(config)

  // 3. Package JavaScript into node_modules
  await initPackager(cwd, config)

  // 4. Generate TypeScript declarations for bundled packages
  await initTsPackager(cwd, config, { watch: options.watch })
}
```

## Watch Mode Flow

```
1. User saves App.tsx
         │
         ▼
2. Chokidar detects change
         │
         ▼
3. Virtual: Copy to .virtual/
         │
         ▼
4. System: Run panda codegen
         │
         ▼
5. Packager: Rebundle .js
         │
         ▼
6. Emit 'packager:complete' event
         │
         ▼
7. TS-Packager: Regenerate .d.ts from new .js
         │
         ▼
8. HMR update in browser
```

## Performance Expectations

### Cold Build

- TypeScript program creation: 50-200ms (simple JS → .d.ts)
- Declaration emit: 100-500ms (per package)
- Total: ~200-700ms additional to existing build

### Watch Mode (Incremental)

- Triggered after packager completes
- Re-runs cold build (200-700ms)
- Fast enough to feel instant

## Benefits

1. **No separate `tsc` process** - Everything runs in worker threads
2. **Simple architecture** - Just reads bundled .js and generates .d.ts
3. **No virtual FS complexity** - Works with final bundle outputs
4. **Non-blocking** - Doesn't slow down main CLI thread
5. **Type-safe events** - Full visibility into compilation status
6. **Proper TypeScript support** - Users get autocomplete and type checking

## Next Steps

1. ✅ Update plan to reflect correct architecture (reads from node_modules, not virtual FS)
2. Register worker in manifest.json
3. Add event types to events.ts
4. Implement cold-build.ts (core functionality)
5. Implement watch-build.ts (listens for packager completion)
6. Create worker.ts, index.ts, and types.ts
7. Update sync command to call initTsPackager after initPackager
8. Add packager:complete event emission in packager worker
