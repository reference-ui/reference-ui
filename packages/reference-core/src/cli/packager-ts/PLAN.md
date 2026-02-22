# TypeScript Declaration (.d.ts) Generation Plan

## Overview

Generate TypeScript declarations using the **tsc CLI** (not programmatic API) for maximum reliability. The packager-ts runs **after** the packager bundles JavaScript, reading TypeScript **source files** to generate `.d.ts` files in `node_modules/@reference-ui/*`. Uses child process execution within a worker thread for non-blocking performance.

## Why tsc CLI?

**Previous approach**: Used TypeScript's programmatic API (`ts.createProgram()`)

- Complex to configure correctly
- Unreliable with edge cases
- Difficult to debug
- Required manual handling of compiler options

**Current approach**: Use `tsc` command-line tool via child process

- Battle-tested and designed for library packaging
- Handles all edge cases automatically
- Same tool developers use directly
- Clear error messages and diagnostics
- Simpler implementation

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
│  Read TypeScript source from reference-core                      │
│         │                                                         │
│         ▼                                                         │
│    Cold Build                     Watch Mode (future)            │
│    ├─ Generate tsconfig.json     ├─ tsc --watch                 │
│    ├─ Spawn tsc child process    └─ Monitor changes             │
│    ├─ Wait for completion                                        │
│    └─ Update package.json types                                  │
│         │                                   │                     │
│         └───────────────┬───────────────────┘                    │
│                         ▼                                         │
│       Write .d.ts to node_modules/@reference-ui/*                │
│              Update package.json exports                         │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation

### Key Files

1. **`cold-build.ts`** - One-shot compilation using tsc CLI
2. **`run-tsc.ts`** - Child process wrapper for tsc
3. **`tsconfig-generator.ts`** - Generate tsconfig.json for declarations
4. **`worker.ts`** - Worker thread entry point
5. **`index.ts`** - Main orchestration and initialization
6. **`types.ts`** - TypeScript types

### Core Flow

```typescript
// 1. Generate tsconfig for declaration generation
const tsconfigContent = createTsConfig({
  rootDir: coreDir,
  outDir: packageDir,
  entryFiles: [entryPath],
})

// 2. Write temporary tsconfig
writeFileSync('tsconfig.declarations.json', JSON.stringify(tsconfigContent))

// 3. Run tsc via child process
await runTsc(coreDir, ['-p', 'tsconfig.declarations.json'])

// 4. Update package.json types field
pkgJson.types = './src/entry/react.d.ts'
```

### run-tsc.ts

Uses `spawn` to execute tsc as a child process:

```typescript
export async function runTsc(cwd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tscPath = findTscBinary(cwd)
    const child = spawn('node', [tscPath, ...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    // Capture stdout/stderr
    // Resolve/reject based on exit code
  })
}
```

**Benefits:**

- Standard tsc execution (same as developers use)
- Automatic error handling and diagnostics
- Colored output preserved
- No complex compiler API configuration

### tsconfig-generator.ts

Creates optimized tsconfig for declaration generation:

```typescript
export function createTsConfig(options: TsConfigOptions) {
  return {
    compilerOptions: {
      declaration: true,
      emitDeclarationOnly: true,
      outDir: options.outDir,
      rootDir: options.rootDir,
      moduleResolution: 'NodeNext',
      module: 'ESNext',
      jsx: 'react-jsx',
      skipLibCheck: true,
      strict: true,
    },
    include: options.entryFiles,
    exclude: ['node_modules', '**/*.test.*'],
  }
}
```

**Key Settings:**

- `emitDeclarationOnly: true` - Only generate .d.ts files
- `skipLibCheck: true` - Skip checking node_modules (faster)
- `strict: true` - Better type generation
- Dynamic include based on entry files

### Thread Pool Setup

**File**: `src/cli/thread-pool/manifest.json`

```json
{
  "packager-ts": "src/cli/packager-ts/worker.ts"
}
```

### Worker Entry Point

**File**: `src/cli/packager-ts/worker.ts`

```typescript
import { runTsPackager } from './index'
import type { TsPackagerWorkerPayload } from './types'

export default async function worker(payload: TsPackagerWorkerPayload) {
  return runTsPackager(payload)
}
```

### Main Orchestrator

**File**: `src/cli/packager-ts/index.ts`

```typescript
export async function runTsPackager(payload: TsPackagerWorkerPayload): Promise<void> {
  const { cwd, config, packages } = payload

  log('🔷 Generating TypeScript declarations...')

  try {
    await runColdBuild(cwd, packages, config)
  } catch (error) {
    log('[packager-ts] Error:', error)
    throw error
  }
}
```

## Performance

### Cold Build

| Step                  | Time      |
| --------------------- | --------- |
| Generate tsconfig     | <10ms     |
| Run tsc               | 200-500ms |
| Update package.json   | <10ms     |
| **Total per package** | ~250ms    |

**Benefits over programmatic API:**

- Simpler code (~70% less LOC)
- More reliable (uses battle-tested tsc)
- Better error messages
- Easier to debug

## Future Enhancements

### Watch Mode

Use `tsc --watch` for incremental compilation:

```typescript
export async function runWatchBuild(
  cwd: string,
  packages: Array<{ name: string; sourceEntry: string }>,
  config: ReferenceUIConfig
): Promise<void> {
  for (const pkg of packages) {
    // Generate tsconfig
    const tsconfigPath = generateTsConfig(pkg)

    // Spawn tsc --watch as background process
    spawn('node', [tscPath, '-p', tsconfigPath, '--watch'], {
      cwd,
      stdio: 'inherit',
    })
  }
}
```

## Troubleshooting

### TypeScript Not Found

**Error**: `TypeScript compiler not found`

**Solution**:

```bash
pnpm add -D typescript
# or
npm install --save-dev typescript
```

### Declaration Generation Fails

**Error**: `tsc exited with code 1`

**Debug**:

1. Check the generated tsconfig: `node_modules/@reference-ui/*/tsconfig.declarations.json`
2. Run tsc manually:
   ```bash
   cd packages/reference-core
   pnpm exec tsc -p node_modules/@reference-ui/react/tsconfig.declarations.json
   ```
3. Check for TypeScript errors in source files

### Types Not Found in Consumer

**Error**: `Cannot find module '@reference-ui/react'`

**Check**:

1. Verify .d.ts exists: `ls node_modules/@reference-ui/react/src/entry/react.d.ts`
2. Check package.json exports:
   ```json
   {
     "exports": {
       ".": {
         "types": "./src/entry/react.d.ts",
         "import": "./react.js"
       }
     }
   }
   ```

## Summary

The packager-ts system provides reliable TypeScript declaration generation using:

1. **tsc CLI** - Battle-tested tool for library packaging
2. **Child process** - Non-blocking execution via spawn
3. **Worker thread** - Offload heavy compilation work
4. **Dynamic tsconfig** - Generated per-package for optimal settings

**Result**: Robust, maintainable type generation that "just works."

log('')
log(`✅ TypeScript: Emitted ${emittedFiles.length} declaration(s) in ${duration}ms`)

// Emit completion event
emit('ts:complete', {
emittedFiles: emittedFiles.length,
diagnostics: totalDiagnostics,
duration,
})
}

````

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
````

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
