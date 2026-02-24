# Improve Packager: Roadmap

This document outlines improvements to the packager to support the build-plan (CLI bundling + package bundling) while maintaining current functionality.

## Design Philosophy

**Old approach**: Bundler knows about packages and executes them based on config

```
BundleDefinition (data) → Bundler.bundleAll() interprets → executes
```

**New approach**: Packages own their execution, bundler is just utilities

```
Package.bundle(bundler) → uses bundler utilities → executes itself
```

**Key insight**: Treat each package as a self-contained module with a `bundle()` method. The Bundler is a toolkit of utilities (esbuild, copyFile, writePackageJson) that packages use however they need. The worker just orchestrates by calling each package's `bundle()` method.

**Benefits**:

- **Decoupling**: Bundler doesn't know about packages
- **Ownership**: Each package controls its own build
- **Extensibility**: Add new packages without changing bundler
- **Clarity**: Simple loop instead of complex branching

## Current State

### Packager Responsibilities

```
packages.ts
  │
  ├─ REACT_PACKAGE (bundled → node_modules/@reference-ui/react)
  └─ SYSTEM_PACKAGE (bundled → node_modules/@reference-ui/system)

bundler.ts
  ├─ bundleWithEsbuild() - hardcoded for packages (React, esbuild externals)
  ├─ copyDirectories() - for non-bundled package content
  ├─ bundlePackage() - single package bundling
  └─ bundleAllPackages() - all packages to node_modules

worker.ts
  └─ runPackager() - orchestrate bundleAllPackages()
```

### Limitations

1. **Package-only focus** — assumes all outputs go to `node_modules/`
2. **Single output type** — no support for dist/ or other paths
3. **Hardcoded externals** — `bundleWithEsbuild()` hardcodes React/DOM externals
4. **Single entry point** — `pkg.entry` is a string, not flexible for multiple workers
5. **No shebang support** — can't add #!/usr/bin/env node
6. **No build ordering** — bundles all packages in sequence, no prioritization
7. **Monolithic bundling** — no separation of concerns (CLI vs packages)

## Required Improvements (for build-plan support)

### 1. Generic Bundle Definition

**Current**: `PackageDefinition` specific to npm packages

**Need**: `BundleDefinition` that works for both CLI and packages

```typescript
interface BundleDefinition {
  // Identity
  name: string
  displayName?: string

  // Output
  outputDir: 'node_modules' | 'dist' | string // Flexible path
  outputPath?: string // If different from name

  // Entry points
  entries: Record<string, string> | string
  // 'index' → 'src/cli/index.ts'
  // 'watch/worker' → 'src/cli/watch/worker.ts'

  // Bundling options
  bundle?: boolean
  bundleOptions?: {
    external?: string[]
    target?: string
    platform?: 'node' | 'browser' | 'neutral'
    format?: 'esm' | 'cjs'
  }

  // Post-bundle actions
  shebang?: boolean // Add #!/usr/bin/env node to first entry
  chmod?: number // e.g., 0o755

  // Package.json (optional, for npm packages)
  packageJson?: {
    version: string
    description: string
    main?: string
    types?: string
    exports?: Record<string, any>
  }

  // Additional files to copy
  additionalFiles?: Array<{ src: string; dest: string }>
}
```

### 2. Flexible Output Paths

**Current**: Hardcoded assumption that all outputs go to `node_modules/`

**Need**: Support for:

- `node_modules/@reference-ui/react` (packages)
- `dist/cli/` (CLI main + workers)
- `dist/cli/watch/` (worker subdirs)

```typescript
// Examples:
const CLIBundle: BundleDefinition = {
  name: 'reference-ui-cli',
  outputDir: 'dist/cli', // Custom output
  entries: { index: 'src/cli/index.ts' },
}

const ReactPackage: BundleDefinition = {
  name: '@reference-ui/react',
  outputDir: 'node_modules', // Standard npm
  entries: { index: 'src/entry/react.ts' },
}
```

### 3. Multi-Entry Point Support

**Current**: `entry: string` (single entry point)

**Need**: `entries: Record<string, string>` (multiple entry points with sub-paths)

```typescript
const CLIBundle: BundleDefinition = {
  entries: {
    index: 'src/cli/index.ts', // → index.mjs
    'watch/worker': 'src/cli/watch/worker.ts', // → watch/worker.mjs
    'virtual/worker': 'src/cli/virtual/worker.ts', // → virtual/worker.mjs
    // ... more workers
  },
}

// Generates structure:
// dist/cli/
//   ├─ index.mjs
//   ├─ watch/
//   │   └─ worker.mjs
//   ├─ virtual/
//   │   └─ worker.mjs
//   └─ ...
```

### 4. Configurable Externals & Bundle Options

**Current**: `bundleWithEsbuild()` hardcodes externals for React

**Need**: Per-bundle esbuild configuration

```typescript
const ReactPackage: BundleDefinition = {
  bundleOptions: {
    external: ['react', 'react-dom'],
    platform: 'neutral',
    target: 'es2020',
    format: 'esm',
  },
}

const CLIBundle: BundleDefinition = {
  bundleOptions: {
    external: ['esbuild', 'typescript', 'commander', 'picocolors'],
    platform: 'node',
    target: 'node18',
    format: 'esm',
  },
}
```

### 5. Shebang & Chmod Support

**Current**: No support for executable CLIs

**Need**: First-class shebang/chmod for specified entry points

```typescript
const CLIBundle: BundleDefinition = {
  entries: { index: 'src/cli/index.ts' },
  shebang: true, // Add #!/usr/bin/env node to index.mjs
  chmod: 0o755, // Make index.mjs executable
}
```

Post-bundle, the bundler should:

```typescript
if (def.shebang && entryName === 'index') {
  const content = readFileSync(filePath, 'utf-8')
  writeFileSync(filePath, '#!/usr/bin/env node\n' + content)
}
if (def.chmod) {
  chmodSync(filePath, def.chmod)
}
```

**Current**: No support for executable CLIs

**Need**: First-class shebang/chmod for specified entry points

```typescript
const CLIBundle: BundleDefinition = {
  entries: { index: 'src/cli/index.ts' },
  shebang: true, // Add #!/usr/bin/env node to index.mjs
  chmod: 0o755, // Make index.mjs executable
}
```

Post-bundle, the bundler should:

```typescript
if (def.shebang && entryName === 'index') {
  const content = readFileSync(filePath, 'utf-8')
  writeFileSync(filePath, '#!/usr/bin/env node\n' + content)
}
if (def.chmod) {
  chmodSync(filePath, def.chmod)
}
```

### 6. Build Ordering

**Current**: Sequential bundling in PACKAGES array order

**Need**: Explicit order with priorities

```typescript
enum BuildOrder {
  CLI = 0, // Bundle CLI first (unbundled CLI runs this)
  SYSTEM = 1, // Then system packages
  PACKAGES = 2, // Then user packages
}

interface BundleDefinition {
  order?: BuildOrder // Defaults to PACKAGES
}

// Usage:
const BUNDLES: BundleDefinition[] = [
  { name: 'cli', order: BuildOrder.CLI },
  { name: '@reference-ui/system', order: BuildOrder.SYSTEM },
  { name: '@reference-ui/react', order: BuildOrder.PACKAGES },
]

// Bundler sorts by order before executing
```

### 7. Modular Bundle Execution

**Current structure**: Bundler knows about all packages and executes them

**New structure**: Each package owns its execution, bundler provides utilities

```
// Bundler = toolkit of utilities
class Bundler {
  async esbuild(options)
  async copyFile(src, dest)
  async writePackageJson(dir, json)
}

// Each package defines its own bundle() method
interface PackageModule {
  bundle(bundler: Bundler, coreDir: string): Promise<void>
}

// Worker orchestrates
const packages = [cliPackage, reactPackage, systemPackage]
for (const pkg of packages) {
  await pkg.bundle(bundler, coreDir)
}
```

**Key insight**: Packages are self-contained modules, not just data definitions.

## Implementation Plan

### Folder Structure

```
packager/
  ├─ index.ts                    (public API)
  ├─ worker.ts                   (worker entry point, orchestrates packages)
  ├─ bundler.ts                  (toolkit: esbuild wrapper, copy, write utilities)
  ├─ packages/
  │   ├─ index.ts                (exports all package modules)
  │   ├─ cli.ts                  (CLI package with bundle() method)
  │   ├─ react.ts                (React package with bundle() method)
  │   └─ system.ts               (System package with bundle() method)
  └─ utils/
      ├─ shebang.ts              (addShebang, chmod operations)
      └─ paths.ts                (path resolution helpers)
```

**Key principle**: Each package is a self-contained module that knows how to build itself. Bundler provides utilities.

### Phase 1: Define Bundler Toolkit

**File**: `packager/bundler.ts` (refactored as utility toolkit)

```typescript
import { build, BuildOptions } from 'esbuild'
import { resolve, dirname } from 'node:path'
import { mkdirSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { log } from '../lib/log'

/**
 * Bundler provides utilities for building packages.
 * It's a toolkit, not an orchestrator.
 */
export class Bundler {
  constructor(public readonly coreDir: string) {}

  /**
   * Bundle a single entry point with esbuild
   */
  async esbuild(options: BuildOptions): Promise<void> {
    await build({
      jsx: 'automatic',
      jsxImportSource: 'react',
      treeShaking: true,
      logLevel: 'warning',
      ...options,
    })
  }

  /**
   * Copy a file from src to dest
   */
  async copyFile(src: string, dest: string): Promise<void> {
    const srcPath = resolve(this.coreDir, src)
    const destPath = resolve(this.coreDir, dest)

    if (existsSync(srcPath)) {
      mkdirSync(dirname(destPath), { recursive: true })
      cpSync(srcPath, destPath)
    } else {
      log.error(`⚠️  Source file not found: ${srcPath}`)
    }
  }

  /**
   * Write a package.json file
   */
  async writePackageJson(dir: string, json: Record<string, any>): Promise<void> {
    const packageJson = {
      type: 'module',
      ...json,
    }

    const destPath = resolve(this.coreDir, dir, 'package.json')
    mkdirSync(dirname(destPath), { recursive: true })
    writeFileSync(destPath, JSON.stringify(packageJson, null, 2), 'utf-8')
  }

  /**
   * Ensure a directory exists
   */
  ensureDir(dir: string): void {
    mkdirSync(resolve(this.coreDir, dir), { recursive: true })
  }

  /**
   * Resolve a path relative to coreDir
   */
  resolve(...paths: string[]): string {
    return resolve(this.coreDir, ...paths)
  }
}
```

### Phase 2: Define Package Modules

Each package exports:

1. Metadata (name, order)
2. `bundle()` method that uses Bundler utilities

**File**: `packager/packages/cli.ts` (new)

```typescript
import { Bundler } from '../bundler'
import { addShebangIfNeeded, makeExecutable } from '../utils/shebang'
import { log } from '../../lib/log'

// External dependencies that should NOT be bundled
const EXTERNAL = [
  'esbuild',
  'typescript',
  'commander',
  'picocolors',
  '@parcel/watcher',
  'picomatch',
  'fast-glob',
  'piscina',
]

// Worker entries from manifest
const WORKERS = {
  'virtual/worker': 'src/cli/virtual/worker.ts',
  'system/worker': 'src/cli/system/worker.ts',
  'packager/worker': 'src/cli/packager/worker.ts',
  'packager-ts/worker': 'src/cli/packager-ts/worker.ts',
}

export const CLI_PACKAGE = {
  name: 'reference-ui-cli',
  order: 0, // Bundle first

  async bundle(bundler: Bundler): Promise<void> {
    log('📦 Bundling CLI...')

    const outputDir = 'dist/cli'
    bundler.ensureDir(outputDir)

    // Bundle main entry
    await bundler.esbuild({
      entryPoints: [bundler.resolve('src/cli/index.ts')],
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node18',
      external: EXTERNAL,
      outfile: bundler.resolve(outputDir, 'index.mjs'),
    })

    // Add shebang to main entry
    const mainPath = bundler.resolve(outputDir, 'index.mjs')
    await addShebangIfNeeded(mainPath)
    makeExecutable(mainPath, 0o755)

    // Bundle each worker
    for (const [name, entry] of Object.entries(WORKERS)) {
      await bundler.esbuild({
        entryPoints: [bundler.resolve(entry)],
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'node18',
        external: EXTERNAL,
        outfile: bundler.resolve(outputDir, `${name}.mjs`),
      })
    }

    log('   ✓ CLI bundled')
  },
}
```

**File**: `packager/packages/react.ts` (new)

```typescript
import { Bundler } from '../bundler'
import { log } from '../../lib/log'

export const REACT_PACKAGE = {
  name: '@reference-ui/react',
  order: 2, // Bundle after system

  async bundle(bundler: Bundler): Promise<void> {
    log('📦 Bundling @reference-ui/react...')

    const outputDir = 'node_modules/@reference-ui/react'
    bundler.ensureDir(outputDir)

    // Bundle main entry
    await bundler.esbuild({
      entryPoints: [bundler.resolve('src/entry/react.ts')],
      bundle: true,
      format: 'esm',
      platform: 'neutral',
      target: 'es2020',
      external: ['react', 'react-dom'],
      outfile: bundler.resolve(outputDir, 'react.js'),
    })

    // Copy styles.css
    await bundler.copyFile('src/system/styles.css', `${outputDir}/styles.css`)

    // Write package.json
    await bundler.writePackageJson(outputDir, {
      name: '@reference-ui/react',
      version: '0.0.0-generated',
      description: 'Reference UI React components and runtime APIs',
      main: './react.js',
      types: './react.d.ts',
      exports: {
        '.': {
          types: './react.d.ts',
          import: './react.js',
        },
        './styles.css': './styles.css',
      },
    })

    log('   ✓ @reference-ui/react bundled')
  },
}
```

**File**: `packager/packages/system.ts` (new)

```typescript
import { Bundler } from '../bundler'
import { log } from '../../lib/log'

export const SYSTEM_PACKAGE = {
  name: '@reference-ui/system',
  order: 1, // Bundle before react

  async bundle(bundler: Bundler): Promise<void> {
    log('📦 Bundling @reference-ui/system...')

    const outputDir = 'node_modules/@reference-ui/system'
    bundler.ensureDir(outputDir)

    // Bundle main entry
    await bundler.esbuild({
      entryPoints: [bundler.resolve('src/entry/system.ts')],
      bundle: true,
      format: 'esm',
      platform: 'neutral',
      target: 'es2020',
      external: [],
      outfile: bundler.resolve(outputDir, 'system.js'),
    })

    // Write package.json
    await bundler.writePackageJson(outputDir, {
      name: '@reference-ui/system',
      version: '0.0.0-generated',
      description: 'Reference UI design system extension APIs',
      main: './system.js',
      types: './system.d.ts',
      exports: {
        '.': {
          types: './system.d.ts',
          import: './system.js',
        },
      },
    })

    log('   ✓ @reference-ui/system bundled')
  },
}
```

**File**: `packager/packages/index.ts` (new)

```typescript
import { CLI_PACKAGE } from './cli'
import { REACT_PACKAGE } from './react'
import { SYSTEM_PACKAGE } from './system'

export const PACKAGES = [CLI_PACKAGE, SYSTEM_PACKAGE, REACT_PACKAGE].sort(
  (a, b) => a.order - b.order
)
```

### Phase 3: Simplify Worker (Orchestration Only)

**File**: `packager/worker.ts` (simplified)

```typescript
import { resolveCorePackageDir } from '../lib/resolve-core'
import type { ReferenceUIConfig } from '../config'
import { log } from '../lib/log'
import { emit } from '../event-bus'
import { Bundler } from './bundler'
import { PACKAGES } from './packages'

export interface PackagerWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
}

/**
 * Packager worker orchestrates all package bundles.
 * Each package defines its own bundle() method.
 */
export async function runPackager(payload: PackagerWorkerPayload): Promise<void> {
  const coreDir = resolveCorePackageDir()
  const bundler = new Bundler(coreDir)

  log('')
  log('📦 Packaging Reference UI...')
  log('')

  // Each package bundles itself
  for (const pkg of PACKAGES) {
    await pkg.bundle(bundler)
  }

  log('')
  log('✅ All packages bundled!')
  log(`   ${PACKAGES.length} package(s) created`)
  log('')

  emit('packager:complete', {})
}

export default runPackager
```

**Key insight**: Worker just loops through packages and calls their `bundle()` methods. Each package knows how to build itself.

### Phase 4: Update Public API

**File**: `packager/index.ts` (updated)

```typescript
import type { ReferenceUIConfig } from '../config'
import { runWorker } from '../thread-pool'

export async function initPackager(
  cwd: string,
  config: ReferenceUIConfig
): Promise<void> {
  await runWorker('packager', { cwd, config })
}

// Re-export for direct use if needed
export { Bundler } from './bundler'
export { PACKAGES } from './packages'
export { CLI_PACKAGE, REACT_PACKAGE, SYSTEM_PACKAGE } from './packages'
```

## Benefits of Modular Design

| Aspect            | Before                                   | After                                   |
| ----------------- | ---------------------------------------- | --------------------------------------- |
| **Coupling**      | Bundler knows about all package details  | Each package owns its build logic       |
| **Extensibility** | Add to BundleDefinition + update Bundler | Create new package module with bundle() |
| **Ownership**     | Centralized bundling logic               | Distributed - each package responsible  |
| **Testability**   | Test bundler with all scenarios          | Test each package independently         |
| **Flexibility**   | Generic options for all packages         | Each package uses Bundler how it needs  |
| **Clarity**       | Complex branching in bundler             | Simple: loop and call pkg.bundle()      |

**Key insight**: Bundler is a **toolkit**, not an orchestrator. Packages use it however they need.

## Can it Replace build-cli.mjs?

**Yes.** The planned packager fully replaces `build-cli.mjs`:

| Aspect          | build-cli.mjs                 | New Packager (packages/cli.ts)         |
| --------------- | ----------------------------- | -------------------------------------- |
| **Discovery**   | Reads manifest.json (dynamic) | Explicit worker entries in module      |
| **Externals**   | Hardcoded in script           | Defined in CLI package module          |
| **Output**      | `.mjs` with manual shebang    | Package handles shebang via utilities  |
| **Entry point** | Standalone npm script         | Package module, orchestrated by worker |

**Key advantage**: CLI package is self-contained. Want to change how it builds? Edit `packages/cli.ts`, not a central bundler.

**Important**: When adding new dependencies to the CLI, update the `EXTERNAL` array in `packages/cli.ts`.

### Migration from build-cli.mjs

Current flow:

```
build-cli.mjs (npm script)
  → esbuild bundles CLI → dist/cli/
```

New flow:

```
ref sync (CLI command)
  → initPackager()
    → Packager worker
      → Bundler.bundleAll([CLI_BUNDLE, ...PACKAGES])
        → esbuild bundles CLI → dist/cli/
```

**Changes**:

- ❌ Delete `scripts/build-cli.mjs`
- ❌ Remove npm build-cli script
- ✅ Use `ref sync` instead (single entry point for all builds)
- ✅ Externals managed in `packages/cli.ts` instead of script

## Next Steps

1. Create `packager/bundler.ts` as utility toolkit (esbuild wrapper, copyFile, writePackageJson, etc.)
2. Create `packager/utils/shebang.ts` for shebang/chmod operations
3. Create package modules in `packager/packages/`:
   - `cli.ts` with CLI_PACKAGE module (has bundle() method)
   - `react.ts` with REACT_PACKAGE module (has bundle() method)
   - `system.ts` with SYSTEM_PACKAGE module (has bundle() method)
   - `index.ts` to export PACKAGES array (sorted by order)
4. Simplify `packager/worker.ts` to just loop: `for (const pkg of PACKAGES) await pkg.bundle(bundler)`
5. Update `packager/index.ts` public API exports
6. Delete old `packager/packages.ts` and `packager/bundler.ts`
7. Update `sync/index.ts` to reorder pipeline (packager first)
8. Test CLI self-bundling
9. Remove `scripts/build-cli.mjs`

**Key principle**: Keep bundler.ts ignorant of packages. Packages use bundler utilities to build themselves.

---

See [build-plan.md](build-plan.md) for overall context.
