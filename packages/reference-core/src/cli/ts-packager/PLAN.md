# TypeScript Declaration (.d.ts) Generation Plan

## Overview

Add TypeScript declaration generation using the TypeScript Compiler API to emit `.d.ts` files for `@reference-ui/system` and `@reference-ui/react` packages. All heavy TypeScript work runs in a dedicated worker thread for non-blocking performance.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Sync Command                             │
│                                                                   │
│  initVirtual → initSystem → initTsPackager → initPackager       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TS Packager Worker                           │
│                                                                   │
│  VirtualCompilerHost (reads .virtual/ files)                     │
│         │                                                         │
│         ▼                                                         │
│    Cold Build                     Watch Mode                     │
│    ├─ createProgram()             ├─ createWatchCompilerHost()   │
│    ├─ emit()                      ├─ createWatchProgram()        │
│    └─ collect .d.ts               └─ incremental builder         │
│         │                                   │                     │
│         └───────────────┬───────────────────┘                    │
│                         ▼                                         │
│              Write .d.ts to disk                                 │
│              Emit 'ts:complete' event                            │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Packager Worker                             │
│                                                                   │
│  Bundle .js + .d.ts → node_modules/@reference-ui/*              │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Thread Pool Setup

**File**: `src/cli/thread-pool/manifest.json`

```json
{
  "virtual": "src/cli/virtual/worker.ts",
  "system": "src/cli/system/worker.ts",
  "packager": "src/cli/packager/worker.ts",
  "ts-packager": "src/cli/ts-packager/worker.ts"
}
```

### 2. Event Bus Extensions

**File**: `src/cli/event-bus/events.ts`

```typescript
export type Events = {
  // ... existing events
  'ts:start': { mode: 'cold' | 'watch' }
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
  'ts:files-updated': {
    files: Array<{ path: string; size: number }>
  }
  'virtual:change': {
    path: string
    event: 'add' | 'change' | 'unlink'
  }
}
```

### 3. TS Packager Worker

**File**: `src/cli/ts-packager/worker.ts`

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

**File**: `src/cli/ts-packager/types.ts`

```typescript
import type { ReferenceUIConfig } from '../config'

export interface TsPackagerWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
  mode: 'cold' | 'watch'
  virtualDir: string
}

export interface VirtualFileMap {
  [path: string]: string
}

export interface EmittedFile {
  path: string
  content: string
  size: number
}
```

**File**: `src/cli/ts-packager/index.ts`

```typescript
import ts from 'typescript'
import { resolveCorePackageDir } from '../lib/resolve-core'
import { log } from '../lib/log'
import { emit, on } from '../event-bus'
import { createVirtualCompilerHost } from './compiler-host'
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
  const { cwd, config, mode, virtualDir } = payload
  const coreDir = resolveCorePackageDir()

  log('')
  log('🔷 TypeScript Declaration Generation...')
  log('')

  emit('ts:start', { mode })

  try {
    if (mode === 'watch') {
      // Watch mode: incremental compilation with builder program
      await runWatchBuild(coreDir, virtualDir, config)
    } else {
      // Cold build: one-shot compilation
      await runColdBuild(coreDir, virtualDir, config)
    }
  } catch (error) {
    log('[ts-packager] Error:', error)
    throw error
  }
}

/**
 * Initialize ts-packager from main thread
 */
export async function initTsPackager(
  cwd: string,
  config: ReferenceUIConfig,
  options: { watch?: boolean }
): Promise<void> {
  const { runWorker } = await import('../thread-pool')

  await runWorker('ts-packager', {
    cwd,
    config,
    mode: options.watch ? 'watch' : 'cold',
    virtualDir: config.virtualDir,
  })
}
```

### 4. Virtual Compiler Host

**File**: `src/cli/ts-packager/compiler-host.ts`

```typescript
import ts from 'typescript'
import { join, dirname, resolve } from 'node:path'
import { existsSync, readFileSync, statSync } from 'node:fs'
import type { VirtualFileMap } from './types'

/**
 * Custom CompilerHost that reads from virtual filesystem
 *
 * This allows TypeScript to compile files from .virtual/ directory
 * which contains transformed versions of user files (MDX → JSX, etc.)
 */
export function createVirtualCompilerHost(
  virtualDir: string,
  options: ts.CompilerOptions,
  virtualFiles?: VirtualFileMap
): ts.CompilerHost {
  const host = ts.createCompilerHost(options)

  /**
   * Check if a file exists - try virtual FS first, then real filesystem
   */
  const fileExists = (fileName: string): boolean => {
    // Check in-memory virtual files first
    if (virtualFiles && fileName in virtualFiles) {
      return true
    }

    // Check physical virtual directory
    if (fileName.includes(virtualDir)) {
      return existsSync(fileName)
    }

    // Fall back to default behavior for node_modules, lib.d.ts, etc.
    return host.fileExists(fileName)
  }

  /**
   * Read file - try virtual FS first, then real filesystem
   */
  const readFile = (fileName: string): string | undefined => {
    // Check in-memory virtual files first
    if (virtualFiles && fileName in virtualFiles) {
      return virtualFiles[fileName]
    }

    // Check physical virtual directory
    if (fileName.includes(virtualDir)) {
      if (existsSync(fileName)) {
        return readFileSync(fileName, 'utf-8')
      }
      return undefined
    }

    // Fall back to default behavior
    return host.readFile(fileName)
  }

  /**
   * Get source file - ensures TypeScript can parse virtual files
   */
  const getSourceFile = (
    fileName: string,
    languageVersion: ts.ScriptTarget,
    onError?: (message: string) => void,
    shouldCreateNewSourceFile?: boolean
  ): ts.SourceFile | undefined => {
    const sourceText = readFile(fileName)

    if (sourceText === undefined) {
      return undefined
    }

    return ts.createSourceFile(fileName, sourceText, languageVersion, true)
  }

  return {
    ...host,
    fileExists,
    readFile,
    getSourceFile,

    // Override these for proper resolution
    getCurrentDirectory: () => virtualDir,
    getCanonicalFileName: fileName => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
  }
}
```

### 5. Cold Build Implementation

**File**: `src/cli/ts-packager/cold-build.ts`

```typescript
import ts from 'typescript'
import { join, relative } from 'node:path'
import { writeFileSync, mkdirSync } from 'node:fs'
import { log } from '../lib/log'
import { emit } from '../event-bus'
import { createVirtualCompilerHost } from './compiler-host'
import { loadTsConfig } from './tsconfig'
import type { ReferenceUIConfig } from '../config'
import type { EmittedFile } from './types'

/**
 * Run one-shot TypeScript compilation (cold build)
 *
 * Creates a TypeScript program, emits declarations, and writes to disk
 */
export async function runColdBuild(
  coreDir: string,
  virtualDir: string,
  config: ReferenceUIConfig
): Promise<void> {
  const startTime = Date.now()

  // Load tsconfig.json
  const { compilerOptions, rootNames } = loadTsConfig(coreDir, virtualDir)

  // Override options for declaration-only emit
  const options: ts.CompilerOptions = {
    ...compilerOptions,
    declaration: true,
    emitDeclarationOnly: true,
    noEmit: false,
    outDir: join(coreDir, 'dist/types'),
  }

  log('[ts-packager] Creating TypeScript program...')
  log(`[ts-packager] Root files: ${rootNames.length}`)

  // Create custom compiler host
  const host = createVirtualCompilerHost(virtualDir, options)

  // Create program
  const program = ts.createProgram({
    rootNames,
    options,
    host,
  })

  // Get diagnostics
  const diagnostics = [
    ...program.getConfigFileParsingDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ]

  // Report diagnostics
  if (diagnostics.length > 0) {
    log(`[ts-packager] Found ${diagnostics.length} diagnostic(s)`)

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
          `[ts-packager]   ${diagnostic.file.fileName}:${line + 1}:${character + 1} - ${message}`
        )
      } else {
        log(
          `[ts-packager]   ${ts.flattenDiagnosticMessageText(diagnostic.message, '\n')}`
        )
      }
    })
  }

  // Emit declarations
  log('[ts-packager] Emitting declarations...')

  const emittedFiles: EmittedFile[] = []

  const emitResult = program.emit(
    undefined, // All files
    (fileName, data) => {
      // Write to disk
      mkdirSync(dirname(fileName), { recursive: true })
      writeFileSync(fileName, data, 'utf-8')

      emittedFiles.push({
        path: relative(coreDir, fileName),
        content: data,
        size: Buffer.byteLength(data, 'utf-8'),
      })
    },
    undefined, // No cancellation token
    true, // Emit only .d.ts files
    undefined // No custom transformers
  )

  const duration = Date.now() - startTime

  log(`[ts-packager] Emitted ${emittedFiles.length} declaration file(s) in ${duration}ms`)

  // Emit completion event
  emit('ts:complete', {
    emittedFiles: emittedFiles.length,
    diagnostics: diagnostics.length,
    duration,
  })

  emit('ts:files-updated', {
    files: emittedFiles.map(f => ({ path: f.path, size: f.size })),
  })

  // Check for emit errors
  const emitDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics)

  if (emitDiagnostics.length > 0 || emitResult.emitSkipped) {
    throw new Error('TypeScript emit failed with errors')
  }
}
```

### 6. Watch Build Implementation

**File**: `src/cli/ts-packager/watch-build.ts`

```typescript
import ts from 'typescript'
import { join, relative, dirname } from 'node:path'
import { writeFileSync, mkdirSync } from 'node:fs'
import { log } from '../lib/log'
import { emit, on } from '../event-bus'
import { createVirtualCompilerHost } from './compiler-host'
import { loadTsConfig } from './tsconfig'
import type { ReferenceUIConfig } from '../config'

/**
 * Run incremental TypeScript compilation (watch mode)
 *
 * Uses createWatchCompilerHost and createWatchProgram for
 * efficient incremental rebuilds with builder program
 */
export async function runWatchBuild(
  coreDir: string,
  virtualDir: string,
  config: ReferenceUIConfig
): Promise<void> {
  const { compilerOptions, rootNames } = loadTsConfig(coreDir, virtualDir)

  const options: ts.CompilerOptions = {
    ...compilerOptions,
    declaration: true,
    emitDeclarationOnly: true,
    noEmit: false,
    outDir: join(coreDir, 'dist/types'),
    incremental: true,
    tsBuildInfoFile: join(coreDir, 'dist/.tsbuildinfo'),
  }

  log('[ts-packager] Starting watch mode...')

  // Create watch compiler host
  const host = ts.createWatchCompilerHost(
    rootNames,
    options,
    ts.sys,
    ts.createSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    reportWatchStatusChanged
  )

  // Override file system operations to use virtual FS
  const virtualHost = createVirtualCompilerHost(virtualDir, options)
  host.readFile = virtualHost.readFile
  host.fileExists = virtualHost.fileExists

  // Track emitted files
  let emittedCount = 0
  const originalWriteFile = host.writeFile

  host.writeFile = (fileName, data, writeByteOrderMark, onError, sourceFiles) => {
    // Write to disk
    mkdirSync(dirname(fileName), { recursive: true })
    writeFileSync(fileName, data, 'utf-8')

    emittedCount++

    // Call original if needed
    if (originalWriteFile) {
      originalWriteFile(fileName, data, writeByteOrderMark, onError, sourceFiles)
    }
  }

  // Create watch program (keeps running, rebuilds on changes)
  const watchProgram = ts.createWatchProgram(host)

  // Listen for virtual FS changes
  on('virtual:change', payload => {
    log(`[ts-packager] Virtual file changed: ${payload.path}`)

    // TypeScript's watch program will automatically detect the change
    // if the file is in the program's scope. If we need manual triggering:
    // watchProgram.updateRootFileNames([...rootNames, newFilePath])
  })

  // Keep the worker alive
  return new Promise(() => {
    // Never resolves - watch mode runs indefinitely
  })
}

/**
 * Report TypeScript diagnostics
 */
function reportDiagnostic(diagnostic: ts.Diagnostic): void {
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
      severity: diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
    })

    log(`${diagnostic.file.fileName}:${line + 1}:${character + 1} - ${message}`)
  } else {
    log(ts.flattenDiagnosticMessageText(diagnostic.message, '\n'))
  }
}

/**
 * Report watch status changes
 */
function reportWatchStatusChanged(diagnostic: ts.Diagnostic): void {
  const message = ts.flattenDiagnosticMessageText(diagnostic.message, '\n')
  log(`[ts-packager] ${message}`)

  // Emit completion event when compilation is done
  if (diagnostic.code === 6193 || diagnostic.code === 6194) {
    // 6193: Found N errors. Watching for file changes.
    // 6194: Found 0 errors. Watching for file changes.
    emit('ts:complete', {
      emittedFiles: 0, // TODO: track this
      diagnostics: 0,
      duration: 0,
    })
  }
}
```

### 7. TSConfig Loader

**File**: `src/cli/ts-packager/tsconfig.ts`

```typescript
import ts from 'typescript'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { glob } from 'fast-glob'

/**
 * Load and parse tsconfig.json for the virtual directory
 */
export function loadTsConfig(coreDir: string, virtualDir: string) {
  const tsconfigPath = join(coreDir, 'tsconfig.json')

  if (!existsSync(tsconfigPath)) {
    throw new Error(`tsconfig.json not found at ${tsconfigPath}`)
  }

  // Parse tsconfig
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)

  if (configFile.error) {
    throw new Error(
      `Failed to read tsconfig.json: ${ts.flattenDiagnosticMessageText(
        configFile.error.messageText,
        '\n'
      )}`
    )
  }

  const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, coreDir)

  // Get root files from virtual directory
  const rootNames = glob.sync('**/*.{ts,tsx}', {
    cwd: virtualDir,
    absolute: true,
    ignore: ['**/*.d.ts', '**/node_modules/**'],
  })

  return {
    compilerOptions: parsedConfig.options,
    rootNames,
    errors: parsedConfig.errors,
  }
}
```

### 8. Sync Command Integration

**File**: `src/cli/sync/index.ts`

```typescript
import { log, initLog } from '../lib/log'
import { initEventBus, on } from '../event-bus'
import { loadUserConfig } from '../config'
import { initSystem } from '../system'
import { initVirtual } from '../virtual'
import { initPackager } from '../packager'
import { initTsPackager } from '../ts-packager'

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

  // 3. Generate TypeScript declarations
  await initTsPackager(cwd, config, { watch: options.watch })

  // 4. Package everything into node_modules
  await initPackager(cwd, config)
}
```

### 9. Packager Integration

The packager needs to include `.d.ts` files when bundling packages.

**File**: `src/cli/packager/packages.ts`

```typescript
export const SYSTEM_PACKAGE: PackageDefinition = {
  name: '@reference-ui/system',
  entry: 'src/system/index.ts',
  copy: [
    'src/system/styles.css',
    'dist/types/**/*.d.ts', // Include generated declarations
  ],
  external: [],
}

export const REACT_PACKAGE: PackageDefinition = {
  name: '@reference-ui/react',
  entries: {
    '.': 'src/entry/react.ts',
    './primitives': 'src/primitives/index.ts',
  },
  copy: [
    'dist/types/**/*.d.ts', // Include generated declarations
  ],
  external: ['react', 'react-dom', '@reference-ui/system'],
}
```

**File**: `src/cli/packager/bundler.ts`

Update to copy `.d.ts` files:

```typescript
// After bundling JavaScript
for (const file of pkg.copy || []) {
  if (file.includes('*')) {
    // Glob pattern - copy all matching files
    const matches = glob.sync(file, { cwd: coreDir })
    for (const match of matches) {
      const dest = join(targetDir, relative('dist/types', match))
      mkdirSync(dirname(dest), { recursive: true })
      cpSync(resolve(coreDir, match), dest)
    }
  } else {
    // Single file
    cpSync(resolve(coreDir, file), resolve(targetDir, basename(file)))
  }
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
4. Emit 'virtual:change' event ──────┐
         │                           │
         ▼                           ▼
5. System: Run panda codegen   TS-Packager: Rebuild declarations
         │                           │
         ▼                           ▼
6. Both complete ────────────────────┤
                                     │
                                     ▼
7. Packager: Rebundle .js + .d.ts
         │
         ▼
8. HMR update in browser
```

## Performance Expectations

### Cold Build

- TypeScript program creation: 200-800ms
- Declaration emit: 500-2s (depending on project size)
- Total: ~1-3s additional to existing ~5-15s build

### Watch Mode (Incremental)

- Incremental rebuild: 200-800ms (vs full 1-3s)
- Uses TypeScript's builder program for efficient recompilation
- Only recompiles changed files + dependents

## Benefits

1. **No separate `tsc` process** - Everything runs in worker threads
2. **Incremental compilation** - Fast rebuilds in watch mode
3. **Virtual FS integration** - Reads transformed files from .virtual/
4. **Non-blocking** - Doesn't slow down main CLI thread
5. **Type-safe events** - Full visibility into compilation status
6. **Proper .d.ts bundling** - Declarations included in final packages

## Testing Strategy

1. **Unit tests**: VirtualCompilerHost (mock FS, verify file reads)
2. **Integration tests**: End-to-end cold build + watch mode
3. **Performance tests**: Benchmark cold vs incremental compilation
4. **Smoke tests**: Verify .d.ts files exist in node_modules packages

## Next Steps

1. Create directory structure and worker registration
2. Implement VirtualCompilerHost with virtual FS reading
3. Implement cold build with ts.createProgram
4. Implement watch mode with createWatchProgram
5. Integrate into sync command
6. Update packager to include .d.ts files
7. Add tests
8. Document usage
