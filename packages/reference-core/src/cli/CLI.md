# Reference UI CLI Architecture

The Reference UI CLI is a sophisticated build system that orchestrates design token generation, Panda CSS configuration, virtual filesystem management, and package bundling. It's designed for high performance using worker threads and provides a seamless developer experience with watch mode support.

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Core Systems](#core-systems)
- [Execution Flow](#execution-flow)
- [Advanced Features](#advanced-features)
- [Deep Dive: System Components](#deep-dive-system-components)

---

## Overview

### What Does It Do?

The CLI transforms a user's design system configuration into a fully functional, type-safe design system with:

1. **Design Tokens**: OKLCH color scales, spacing, typography, etc.
2. **Panda CSS Integration**: Custom config compilation and CSS-in-JS utilities
3. **React Components**: Styled primitives and composable components
4. **Type Safety**: Full TypeScript support with generated types
5. **Zero Runtime Cost**: Static CSS extraction with atomic utility classes

### Key Innovation: Dynamic Config Compilation

Unlike traditional CSS-in-JS tools, Reference UI uses a **mini-compiler** that:

- Scans your styled components
- Collects design token extensions
- Bundles them into a single Panda CSS config
- Executes the config to generate static CSS and type-safe utilities

This happens **at build time**, not runtime.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Entry Point                          │
│                        (index.ts: `ref`)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ Commands: sync (default)
                          │ Flags: --watch
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Sync Command                              │
│                     (sync/index.ts)                              │
│                                                                   │
│  Load config → init systems → run in parallel                    │
└───────────────┬────────────┬────────────┬───────────────────────┘
                │            │            │
       ┌────────┘            │            └─────────┐
       │                     │                      │
       ▼                     ▼                      ▼
┌──────────────┐    ┌────────────────┐    ┌────────────────┐
│   Virtual    │    │     System     │    │   Packager     │
│  Filesystem  │    │  (Panda CSS)   │    │  (esbuild)     │
│              │    │                │    │                │
│ Worker Pool  │    │  Worker Pool   │    │  Worker Pool   │
└──────────────┘    └────────────────┘    └────────────────┘
       │                     │                      │
       │                     │                      │
       └─────────────────────┴──────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │   Cross-Thread Events    │
              │   (BroadcastChannel)     │
              └──────────────────────────┘
```

---

## Core Systems

### 1. Config System (`config/`)

**Purpose**: Load and validate the user's `ui.config.ts`

**Key Files**:

- `load-config.ts` - Config file loader with esbuild bundling
- `index.ts` - Config type definitions

**How It Works**:

```typescript
// User's ui.config.ts
export default defineConfig({
  include: ['src/**/*.{ts,tsx}'],
  virtualDir: '.virtual',
  debug: false,
})
```

The loader:

1. Searches for `ui.config.{ts,js,mjs}` in the project root
2. Bundles it with esbuild (handles TypeScript)
3. Evaluates the bundle in a controlled environment
4. Validates required fields (`include` array)
5. Returns typed `ReferenceUIConfig`

**Why Bundle?** TypeScript configs can import types, use modern syntax, and require bundling to execute in Node.

---

### 2. Event Bus (`event-bus/`)

**Purpose**: Enable cross-thread communication between workers

**Key Files**:

- `index.ts` - Event bus implementation with BroadcastChannel
- `events.ts` - Event type definitions

**Architecture**:

```typescript
// Type-safe event emission
emit('virtual:change', { path: 'src/App.tsx', event: 'change' })

// Type-safe event listening (works in any thread)
on('virtual:change', payload => {
  console.log('File changed:', payload.path)
})
```

**Key Features**:

- **Thread-Safe**: Uses Node's `BroadcastChannel` API
- **Typed**: Full TypeScript support for events
- **Debuggable**: Optional debug logging for all events
- **Cleanup**: Proper listener management with `off()`

**Use Cases**:

- Virtual filesystem notifying system of file changes
- System notifying packager of completion
- Watch mode triggering rebuilds

---

### 3. Thread Pool (`thread-pool/`)

**Purpose**: Offload heavy work to worker threads for better performance

**Key Files**:

- `index.ts` - Piscina-based worker pool
- `workers.ts` - Worker registry
- `manifest.json` - Worker definitions

**Architecture**:

```
Main Thread                     Worker Threads
    │                                │
    │  runWorker('virtual', {...})   │
    ├────────────────────────────────▶
    │                                │
    │                           [Processing]
    │                                │
    │  ◀────────────────────────────┤
    │         Result                 │
```

**Worker Pool Configuration**:

```typescript
{
  minThreads: 2,
  maxThreads: Math.max(4, cpus().length - 1),
  idleTimeout: 30000  // 30 seconds
}
```

**Registered Workers**:

- `virtual` → `src/cli/virtual/worker.ts`
- `system` → `src/cli/system/worker.ts`
- `packager` → `src/cli/packager/worker.ts`

**Why Workers?**

- Heavy I/O operations (file copying, bundling)
- CPU-intensive tasks (esbuild, Panda codegen)
- Non-blocking main thread for better responsiveness

---

### 4. Virtual Filesystem (`virtual/`)

**Purpose**: Copy and transform user files into a codegen directory for Panda CSS to scan

**Key Files**:

- `init.ts` - Initialization and worker entry point
- `copy.ts` - File copying with transformation support
- `transform.ts` - Transform pipeline (MDX, CSS imports, CVA)
- `watcher.ts` - File watching with chokidar
- `worker.ts` - Worker wrapper

**Why a Virtual Filesystem?**

Panda CSS needs to scan files to extract styles, but it can't scan files outside its package. The virtual filesystem:

1. Copies user files from `src/` to `reference-core/.virtual/`
2. Transforms them (MDX → JSX, rewrite imports)
3. Updates on file changes in watch mode
4. Gets scanned by Panda CSS during codegen

**Transformation Pipeline**:

```
User File (src/App.tsx)
         │
         ▼
    Copy to .virtual/
         │
         ▼
    Transform?
    ├─ MDX → JSX (mdx-to-jsx.ts)
    ├─ Rewrite CSS imports (rewrite-css-imports.ts)
    └─ Rewrite CVA imports (rewrite-cva-imports.ts)
         │
         ▼
  Virtual File (.virtual/App.tsx)
         │
         ▼
  Scanned by Panda CSS
```

**Watch Mode**:

```typescript
// Watches user's include patterns
setupWatcher({ sourceDir, include: ['src/**/*.{ts,tsx}'], debug }, async event => {
  if (event.event === 'unlink') {
    await removeFromVirtual(event.path)
  } else {
    await copyToVirtual(event.path)
  }
})
```

**Supported Transformations**:

1. **MDX → JSX**: Compiles MDX files to JSX for Panda scanning
2. **CSS Import Rewriting**: `css` → `@reference-ui/system/css`
3. **CVA Import Rewriting**: `cva` → `@reference-ui/system/cva`

---

### 5. System (`system/`)

**Purpose**: Core Panda CSS integration - config compilation, codegen, CSS generation

This is the **heart** of the CLI. It compiles your design tokens into a Panda CSS config and generates static CSS and TypeScript utilities.

#### 5.1 Config Compilation (`system/config/`)

**The Problem**: Panda CSS needs a single `panda.config.ts`, but users define tokens across multiple files using `extendTokens()`, `extendRecipe()`, etc.

**The Solution**: A mini-compiler that:

1. Scans for files calling config extension functions
2. Bundles them with esbuild
3. Collects the config fragments
4. Merges them into a final config
5. Writes `panda.config.ts`

**Key Files**:

- `createPandaConfig.ts` - Main compiler orchestrator
- `entryTemplate.ts` - Dynamic entry file generator
- `extendPandaConfig.ts` - User-facing API
- `deepMerge.ts` - Config merging logic
- `initCollector.ts` - Global collector initialization

**Compilation Flow**:

```
Step 1: Scan
  ├─ panda.base.ts
  └─ src/styled/**/*.ts

Step 2: Generate Entry
  ├─ Import initCollector
  ├─ Import extendPandaConfig
  ├─ Import all scanned files
  └─ Import panda.base

Step 3: Bundle with esbuild
  └─ Creates self-contained bundle

Step 4: Execute Bundle
  ├─ Sets global collector
  ├─ Each file calls extendPandaConfig()
  └─ Fragments collected

Step 5: Deep Merge
  └─ Merge all fragments into base config

Step 6: Write panda.config.ts
  └─ Final config file
```

**Example**:

```typescript
// src/styled/theme/colors.ts
import { extendTokens } from '@reference-ui/core/styled'

extendTokens({
  colors: {
    brand: {
      primary: { value: 'oklch(62.3% 0.214 259.815)' },
    },
  },
})
```

After compilation, this becomes part of `panda.config.ts`:

```typescript
export default defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          primary: { value: 'oklch(62.3% 0.214 259.815)' },
        },
      },
    },
  },
})
```

**The Magic**: Using esbuild to bundle and execute code in isolation, collecting side effects (the `extendPandaConfig` calls).

#### 5.2 Eval System (`system/eval/`)

**Purpose**: Execute files in isolation to collect config fragments

**Key Files**:

- `runner.ts` - File execution with collector
- `scanner.ts` - Directory scanning for config files
- `registry.ts` - Track registered extension functions

**How It Works**:

```typescript
// 1. Set global collector
globalThis.__refPandaConfigCollector = []

// 2. Bundle file with esbuild
const bundled = await microBundle('src/styled/colors.ts')

// 3. Convert to data URL (ESM modules can't be imported from strings)
const url = `data:text/javascript;base64,${encoded}#${cacheKey}`

// 4. Dynamic import (executes the file)
await import(url)

// 5. Collect fragments
const fragments = globalThis.__refPandaConfigCollector
```

**Why Data URLs?** ESM modules require a URL, not a string. Data URLs let us execute bundled code without writing temp files.

**Why Random Cache Keys?** Node caches imports by URL. Random keys prevent stale imports.

#### 5.3 Code Generation (`system/gen/`)

**Purpose**: Run Panda CSS codegen and CSS generation

**Key Files**:

- `runner.ts` - Panda CLI wrapper

**Commands Executed**:

```bash
# Generate TypeScript utilities (css(), cva(), etc.)
panda codegen

# Generate styles.css with @layer tokens
panda
```

**Watch Mode**:

```bash
# Keep both processes alive
panda codegen --watch --poll &
panda --watch --poll &
```

**Why `--poll`?** Some filesystems (Docker, network drives) don't support native watching. Polling is more reliable.

#### 5.4 Box Pattern (`system/boxPattern/`)

**Purpose**: Generate Panda's custom `box` pattern for layout primitives

**Key Files**:

- `generateBoxPattern.ts` - Pattern generator
- `extendBoxPattern.ts` - User-facing API

**What It Creates**:

```typescript
// Generated pattern
export const box = props => ({
  display: props.display || 'block',
  // ... all CSS properties
})
```

This enables:

```tsx
<Box display="flex" p="4" bg="blue.500" />
```

#### 5.5 Font System (`system/fontFace/`)

**Purpose**: Generate `@font-face` declarations and font tokens

**Key Files**:

- `generateFontSystem.ts` - Font system generator
- `extendFontFace.ts` - User-facing API

**What It Creates**:

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2');
  font-weight: 400;
}
```

And tokens:

```typescript
{
  fonts: {
    sans: {
      value: 'Inter, system-ui, sans-serif'
    }
  }
}
```

#### 5.6 System Worker (`system/worker.ts`)

**Purpose**: Orchestrate all system tasks in a worker thread

**Execution Flow**:

```typescript
export async function runSystem(payload) {
  // 1. Eval: Scan and collect config fragments
  const fragments = await runEval(coreDir, ['src/styled'])

  // 2. Compile: Create panda.config.ts
  if (fragments.length > 0) {
    await createPandaConfig(coreDir)
  }

  // 3. Codegen: Generate TypeScript utilities
  runPandaCodegen(coreDir)

  // 4. CSS: Generate styles.css with tokens
  runPandaCss(coreDir)
}
```

**Why This Order?**

1. Config must exist before codegen
2. Codegen creates the TS files
3. CSS generation creates styles.css with tokens layer

---

### 6. Packager (`packager/`)

**Purpose**: Bundle generated code into npm packages and install to `node_modules`

**Key Files**:

- `bundler.ts` - esbuild bundling logic
- `packages.ts` - Package definitions
- `worker.ts` - Worker entry point

**Packages Created**:

1. **`@reference-ui/system`**
   - Design tokens (CSS variables, JS objects)
   - CSS utilities (`css()`, `cva()`, etc.)
   - Patterns (box, stack, flex, etc.)
   - Recipes (button, card, etc.)
   - Generated from `src/system/`

2. **`@reference-ui/react`**
   - React components (Button, Card, etc.)
   - Runtime APIs (config, providers)
   - Entry points from `src/entry/`
   - Primitives from `src/primitives/`

**Bundling Strategy**:

```typescript
await build({
  entryPoints: [resolve(coreDir, 'src/system/index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  external: ['react', 'react-dom'],
  outfile: resolve(targetDir, 'index.js'),
})
```

**Installation**:

```
reference-docs/node_modules/
  └─ @reference-ui/
      ├─ system/
      │   ├─ package.json
      │   ├─ index.js
      │   └─ css/
      └─ react/
          ├─ package.json
          └─ index.js
```

**Why Not `npm install`?** Direct bundling and copying is faster and more reliable than running npm/pnpm in each consumer project.

---

### 7. Library Utilities (`lib/`)

**Purpose**: Shared utilities used across the CLI

**Key Files**:

#### `log.ts` - Logging System

```typescript
log.info('Starting build...')
log.debug('[worker] Processing file') // Only if debug: true
log.error('Build failed:', error)
```

**Levels**: error, warn, info, debug

#### `microbundle.ts` - Lightweight esbuild Wrapper

```typescript
// Bundle a file for evaluation
const bundled = await microBundle('src/config.ts', {
  format: 'esm',
  external: [],
})
```

**Use Cases**:

- Config file loading
- Eval system bundling
- Panda config compilation

#### `resolve-core.ts` - Package Resolution

```typescript
// Find reference-core package root
const coreDir = resolveCorePackageDir()
// → /Users/you/project/node_modules/@reference-ui/core
```

**Why?** The CLI needs to know where reference-core is installed to:

- Write to `src/system/`
- Run Panda codegen
- Copy to `.virtual/`

#### `run-command.ts` - Command Wrapper

```typescript
program.command('sync').action(runCommand(options => syncCommand(cwd, options)))
```

**Benefits**:

- Error handling
- Graceful shutdown
- Exit code management

---

## Execution Flow

### Cold Start (Initial Build)

```
1. Load Config
   └─ Bundle and execute ui.config.ts

2. Init Event Bus
   └─ Setup BroadcastChannel for cross-thread events

3. Init Log
   └─ Configure logging based on debug flag

4. Virtual Filesystem (Worker Thread)
   ├─ Create .virtual/ directory
   ├─ Scan include patterns
   ├─ Copy files (20-100ms per file)
   └─ Transform (MDX, imports)

5. System (Worker Thread)
   ├─ Eval: Scan src/styled/ (50-200ms)
   ├─ Compile: Create panda.config.ts (300-800ms)
   ├─ Codegen: Run panda codegen (2-5s)
   └─ CSS: Run panda (1-3s)

6. Packager (Worker Thread)
   ├─ Bundle @reference-ui/system (500ms-2s)
   ├─ Bundle @reference-ui/react (500ms-2s)
   └─ Copy to node_modules (50-200ms)

Total: ~5-15 seconds (depending on project size)
```

### Watch Mode (Incremental)

```
User saves src/App.tsx
         │
         ▼
   Chokidar detects change
         │
         ▼
   Virtual: Copy to .virtual/ (~10ms)
         │
         ▼
   Emit 'virtual:change' event
         │
         ▼
   System: Run panda codegen (incremental, ~500ms)
         │
         ▼
   Packager: Rebundle (incremental, ~200ms)
         │
         ▼
   Vite HMR updates browser
```

**Incremental Performance**: 500ms-1s (vs 5-15s cold start)

---

## Advanced Features

### 1. Dynamic Import with Data URLs

**Problem**: We need to execute bundled code without writing files.

**Solution**: Data URLs + dynamic imports

```typescript
const bundled = await microBundle('config.ts')
const encoded = Buffer.from(bundled, 'utf-8').toString('base64')
const url = `data:text/javascript;base64,${encoded}#${Date.now()}`
const module = await import(url)
```

**Why It Works**:

- ESM supports data URLs
- Base64 encoding handles special characters
- Cache key prevents stale imports

### 2. Global Collector Pattern

**Problem**: We need to collect config fragments from side effects.

**Solution**: Global collector + function hooks

```typescript
// 1. Prepare collector
globalThis.__refPandaConfigCollector = []

// 2. User code calls extension
extendTokens({ colors: { ... } })  // Pushes to collector

// 3. Retrieve fragments
const fragments = globalThis.__refPandaConfigCollector
```

**Why It Works**:

- No file I/O needed
- Works across module boundaries
- Simple to use for consumers

### 3. Worker Thread Pool

**Problem**: Heavy operations block the main thread.

**Solution**: Piscina worker pool

```typescript
await runWorker('system', { config }) // Non-blocking
```

**Benefits**:

- Parallel execution
- Automatic work distribution
- Resource limits (max threads)

### 4. Cross-Thread Events

**Problem**: Workers need to communicate.

**Solution**: BroadcastChannel API

```typescript
// Worker A
emit('build:complete', { success: true })

// Worker B (or main thread)
on('build:complete', payload => {
  console.log('Build done!')
})
```

**Why It Works**:

- Built into Node.js (v15+)
- Zero-copy messaging
- Works in any thread

### 5. Incremental Watch Mode

**Problem**: Full rebuilds are slow.

**Solution**: Smart dependency tracking

```typescript
// Only rebuild if styled/ files change
if (event.path.startsWith('src/styled/')) {
  await createPandaConfig() // Recompile config
  runPandaCodegen() // Regenerate
}
```

**Optimizations**:

- Skip config compilation if tokens unchanged
- Panda's incremental codegen (~500ms vs 2-5s)
- Packager's incremental bundling

---

## Deep Dive: System Components

### Config Compilation Deep Dive

The config compiler is the most sophisticated part of the CLI. Here's a complete walkthrough:

#### Step 1: Scanning

```typescript
// Find all TypeScript files in src/styled/
const scannedPaths = scanDirectories(['src/styled'])
// → [
//     'src/styled/theme/colors.ts',
//     'src/styled/theme/spacing.ts',
//     'src/styled/recipes/button.ts'
//   ]
```

Uses `fast-glob` with:

- `**/*.{ts,tsx}` pattern
- `node_modules` excluded
- `followSymlinks: false` for safety

#### Step 2: Entry Generation

```typescript
// Creates .ref/panda-entry.ts
import { COLLECTOR_KEY } from './extendPandaConfig'
import { deepMerge } from './deepMerge'
globalThis[COLLECTOR_KEY] = []

// Import all config files (side effects!)
import './panda.base'
import './src/styled/theme/colors'
import './src/styled/theme/spacing'
import './src/styled/recipes/button'

// Collect and merge
const fragments = globalThis[COLLECTOR_KEY]
const mergedConfig = fragments.reduce(deepMerge, baseConfig)
export default defineConfig(mergedConfig)
```

**Key Insight**: The entry file is **generated dynamically** based on what files exist.

#### Step 3: Bundling

```typescript
// Use esbuild to create a self-contained bundle
const bundled = await microBundlePanda(entryPath)
```

esbuild resolves:

- TypeScript syntax
- Module imports
- Node built-ins
- External packages

Result: A single string of JavaScript code.

#### Step 4: Execution (in eval system)

```typescript
// Set collector
globalThis.__refPandaConfigCollector = []

// Bundle to data URL
const url = `data:text/javascript;base64,${encoded}#${cacheKey}`

// Execute (side effects run)
await import(url)

// Retrieve
const fragments = globalThis.__refPandaConfigCollector
```

As the bundle executes:

1. `extendTokens({ colors: ... })` runs
2. Calls `extendPandaConfig({ theme: { tokens: { colors: ... } } })`
3. Pushes to global collector
4. Continues to next file

#### Step 5: Deep Merging

```typescript
function deepMerge(target, ...sources) {
  for (const source of sources) {
    for (const key in source) {
      if (isObject(source[key])) {
        target[key] = deepMerge(target[key] || {}, source[key])
      } else {
        target[key] = source[key]
      }
    }
  }
  return target
}
```

Handles:

- Nested objects (theme.tokens.colors)
- Array concatenation
- Primitive overwrites

Result:

```typescript
{
  theme: {
    tokens: {
      colors: { brand: { primary: { value: '...' } } },  // From colors.ts
      spacing: { sm: { value: '0.5rem' } }               // From spacing.ts
    },
    recipes: {
      button: { /* ... */ }                               // From button.ts
    }
  }
}
```

#### Step 6: Final Config Write

```typescript
const finalConfig = `/** Generated by createPandaConfig */
${bundled}
`
writeFileSync('panda.config.ts', finalConfig)
```

Now Panda CSS can read this config and generate code!

### Virtual Filesystem Deep Dive

The virtual filesystem is crucial for cross-package scanning.

#### The Cross-Package Problem

```
reference-docs/               ← User's project
  src/
    App.tsx                   ← Uses css({ bg: 'blue.500' })

reference-core/               ← Design system core
  src/
    system/                   ← Generated by Panda
```

**Problem**: Panda CSS runs inside `reference-core` but needs to scan `reference-docs/src/`.

**Solution**: Copy `reference-docs/src/` → `reference-core/.virtual/` and scan there.

#### Copy with Transform

```typescript
async function copyToVirtual(sourcePath: string, sourceDir: string, virtualDir: string) {
  // Preserve directory structure
  const relativePath = relative(sourceDir, sourcePath)
  const destPath = join(virtualDir, relativePath)

  // Create parent dirs
  await mkdir(dirname(destPath), { recursive: true })

  // Transform if needed
  const content = await transformFile(sourcePath, destPath)

  // Write
  await writeFile(destPath, content)
}
```

#### Transformation Pipeline

Each file goes through:

1. **MDX → JSX** (if `.mdx`)

   ```typescript
   const compiled = await compile(mdxContent, {
     jsx: true,
     jsxImportSource: 'react',
   })
   ```

2. **Rewrite CSS imports** (all files)

   ```typescript
   // Before
   import { css } from '../system/css'

   // After
   import { css } from '@reference-ui/system/css'
   ```

3. **Rewrite CVA imports** (all files)

   ```typescript
   // Before
   import { cva } from '../system/cva'

   // After
   import { cva } from '@reference-ui/system/cva'
   ```

**Why Rewrite?** The virtual files may have different import paths. Rewriting ensures they resolve correctly.

#### Watch Mode Implementation

```typescript
const watcher = chokidar.watch(include, {
  cwd: sourceDir,
  ignoreInitial: true,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 50,
    pollInterval: 10,
  },
})

watcher.on('all', (event, path) => {
  handler({ event, path })
})
```

**Events Handled**:

- `add` - New file created
- `change` - File modified
- `unlink` - File deleted

**Debouncing**: `awaitWriteFinish` prevents handling partial writes.

### Packager Deep Dive

The packager creates production-ready npm packages.

#### Package Definition

```typescript
const SYSTEM_PACKAGE: PackageDefinition = {
  name: '@reference-ui/system',
  entry: 'src/system/index.ts',
  copy: ['src/system/styles.css'],
  external: [],
}

const REACT_PACKAGE: PackageDefinition = {
  name: '@reference-ui/react',
  entries: {
    '.': 'src/entry/react.ts',
    './primitives': 'src/primitives/index.ts',
  },
  external: ['react', 'react-dom', '@reference-ui/system'],
}
```

#### Bundling Process

```typescript
async function bundlePackage(pkg: PackageDefinition) {
  // 1. Create target directory
  const targetDir = join(cwd, 'node_modules', pkg.name)
  mkdirSync(targetDir, { recursive: true })

  // 2. Bundle entry points
  for (const [export, entry] of Object.entries(pkg.entries)) {
    await build({
      entryPoints: [resolve(coreDir, entry)],
      bundle: true,
      format: 'esm',
      external: pkg.external,
      outfile: resolve(targetDir, outputPath)
    })
  }

  // 3. Copy additional files
  for (const file of pkg.copy || []) {
    cpSync(
      resolve(coreDir, file),
      resolve(targetDir, basename(file))
    )
  }

  // 4. Generate package.json
  writeFileSync(
    resolve(targetDir, 'package.json'),
    JSON.stringify({
      name: pkg.name,
      version: '0.0.0',
      type: 'module',
      exports: { ... }
    }, null, 2)
  )
}
```

#### package.json Exports

```json
{
  "name": "@reference-ui/system",
  "exports": {
    ".": "./index.js",
    "./css": "./css.js",
    "./tokens": "./tokens.js",
    "./styles.css": "./styles.css"
  }
}
```

This enables:

```typescript
import { css } from '@reference-ui/system'
import { Button } from '@reference-ui/react'
import '@reference-ui/system/styles.css'
```

---

## Performance Characteristics

### Cold Start

| Phase         | Time      | Notes                 |
| ------------- | --------- | --------------------- |
| Load config   | 50-200ms  | Includes bundling     |
| Virtual FS    | 100-500ms | Depends on file count |
| Eval & Scan   | 50-200ms  | Fast with caching     |
| Panda Config  | 300-800ms | esbuild bundling      |
| Panda Codegen | 2-5s      | Full generation       |
| Panda CSS     | 1-3s      | Token layer creation  |
| Packager      | 1-3s      | Two packages          |
| **Total**     | **5-15s** | Typical monorepo      |

### Watch Mode (Incremental)

| Trigger       | Time      | Notes              |
| ------------- | --------- | ------------------ |
| File change   | 10-50ms   | Copy to virtual    |
| Panda codegen | 500ms     | Incremental        |
| Packager      | 200-500ms | Incremental bundle |
| **Total**     | **~1s**   | 10-15x faster      |

### Optimization Techniques

1. **Worker Threads**: Parallel execution of virtual, system, packager
2. **Incremental Builds**: Panda and esbuild cache unchanged files
3. **Smart Rebuilds**: Only recompile config if styled/ changed
4. **Fast Glob**: Optimized file scanning with caching
5. **Debouncing**: Batch file changes to reduce rebuilds

---

## Design Decisions & Rationale

### Why Worker Threads?

**Alternative**: Run everything in main thread sequentially

**Choice**: Worker threads for I/O-heavy operations

**Reason**:

- Copying 100 files = 100 blocking I/O operations
- esbuild bundling = CPU-intensive
- Panda codegen = subprocess spawn (blocks event loop)
- Workers keep main thread responsive

### Why BroadcastChannel?

**Alternative**: Custom IPC with MessagePort

**Choice**: Node's BroadcastChannel API

**Reason**:

- Built-in, no dependencies
- Works across all thread types
- Simpler than manual port passing
- Type-safe with our wrapper

### Why Data URLs?

**Alternative**: Write temp files and import them

**Choice**: Data URLs for bundle execution

**Reason**:

- No file I/O (faster)
- No temp file cleanup needed
- Works with ES modules
- Avoids filesystem permissions issues

### Why Global Collector?

**Alternative**: Return values from eval'd code

**Choice**: Global side-effect collector

**Reason**:

- User code is declarative: `extendTokens({ colors })`
- No need for awkward return statements
- Works across module boundaries
- Clean DX for users

### Why Virtual Filesystem?

**Alternative**: Configure Panda to scan external directories

**Choice**: Copy files to .virtual/

**Reason**:

- Panda doesn't support scanning outside its package
- Transformation pipeline (MDX, imports) needed anyway
- Clear separation of concerns
- Easy to clean up (just delete .virtual/)

### Why Not `postinstall` Scripts?

**Alternative**: Run CLI as postinstall hook

**Choice**: Explicit `ref sync` command

**Reason**:

- Users control when builds happen
- Easier to debug (explicit execution)
- Works with monorepo tools (Turborepo, Nx)
- No phantom builds during npm install

---

## Error Handling

### Config Load Errors

```typescript
try {
  userConfig = await loadConfigFile(configPath)
} catch (err) {
  throw new Error(
    `Failed to load ${configPath}:\n${err.message}\n` +
      `Make sure your config exports: export default defineConfig({ ... })`
  )
}
```

**Provides**:

- Clear error message
- File path that failed
- Example fix

### Bundling Errors

```typescript
try {
  await microBundle(entryPath)
} catch (err) {
  console.error('[createPandaConfig] Bundling failed:', err)
  throw new Error(
    'Failed to bundle Panda config.\n' + 'Check your styled/ files for syntax errors.'
  )
}
```

**Provides**:

- esbuild errors (syntax, imports)
- File and line numbers
- Actionable advice

### Panda Not Found

```typescript
for (const bin of candidates) {
  if (existsSync(bin)) {
    return bin
  }
}

throw new Error(
  `Panda CSS not found. Install @pandacss/dev:\n` +
    `  npm install -D @pandacss/dev\n` +
    `Searched: ${candidates.join(', ')}`
)
```

**Provides**:

- Installation command
- Searched locations (helps debug)

### Worker Failures

```typescript
pool.on('error', err => {
  console.error('[pool] Worker error:', err)
  // Don't crash, just log
})
```

**Graceful degradation**: Log error but keep running.

---

## Future Enhancements

### 1. Incremental Config Compilation

**Current**: Full recompile on any styled/ change

**Future**: Only recompile changed files

```typescript
// Track changed files
const changedFiles = new Set<string>()

// Only rebundle if changed
if (needsRebundle(changedFiles)) {
  await createPandaConfig()
}
```

### 2. Parallel Bundling

**Current**: Bundle packages sequentially

**Future**: Parallel bundling with Promise.all

```typescript
await Promise.all(PACKAGES.map(pkg => bundlePackage(pkg)))
```

### 3. Build Cache

**Current**: No persistent cache

**Future**: Cache bundled configs and esbuild outputs

```typescript
const cacheKey = hashFiles(configFiles)
if (cache.has(cacheKey)) {
  return cache.get(cacheKey)
}
```

### 4. Plugin System

**Current**: Hardcoded transformations

**Future**: User-defined transforms

```typescript
export default defineConfig({
  include: ['src/**/*.tsx'],
  transforms: [myCustomTransform(), rewriteImports(/^~/, './src/')],
})
```

---

## Troubleshooting Guide

### Build is Slow

**Symptoms**: Initial build takes >30 seconds

**Causes**:

1. Too many files in `include`
2. Large node_modules in `virtualDir`
3. Slow disk I/O

**Solutions**:

```typescript
// Exclude heavy directories
export default defineConfig({
  include: ['src/**/*.{ts,tsx}', '!src/heavy-generated-dir/**'],
})
```

### Tokens Not Appearing

**Symptoms**: Colors defined but not in styles.css

**Causes**:

1. Missing `runPandaCss()` call
2. Config not compiled
3. Panda not finding config file

**Debug**:

```bash
# Check if config exists
ls reference-core/panda.config.ts

# Manually run Panda
cd reference-core
pnpm exec panda

# Check layer in styles.css
grep "@layer tokens" src/system/styles.css
```

### Watch Mode Not Working

**Symptoms**: File changes don't trigger rebuild

**Causes**:

1. Chokidar not watching correct directory
2. Include patterns don't match files
3. File in node_modules (ignored)

**Debug**:

```typescript
// Enable debug logging
export default defineConfig({
  include: ['src/**/*.tsx'],
  debug: true, // Shows all file events
})
```

### Import Errors in Generated Code

**Symptoms**: `Cannot find module '@reference-ui/system'`

**Causes**:

1. Packager didn't run
2. node_modules not created
3. Wrong package.json exports

**Solutions**:

```bash
# Check if packages exist
ls node_modules/@reference-ui

# Manually run packager
ref sync
```

---

## Testing Strategy

### Unit Tests

**Config System**:

```typescript
describe('loadConfigFile', () => {
  it('loads TypeScript configs', async () => {
    const config = await loadConfigFile('/path/to/ui.config.ts')
    expect(config.include).toBeDefined()
  })
})
```

**Deep Merge**:

```typescript
describe('deepMerge', () => {
  it('merges nested objects', () => {
    const result = deepMerge({ a: { b: 1 } }, { a: { c: 2 } })
    expect(result).toEqual({ a: { b: 1, c: 2 } })
  })
})
```

### Integration Tests

**End-to-End Build**:

```typescript
describe('sync command', () => {
  it('generates complete design system', async () => {
    await syncCommand('/test/project', { watch: false })

    // Assert generated files exist
    expect(existsSync('reference-core/panda.config.ts')).toBe(true)
    expect(existsSync('reference-core/src/system/styles.css')).toBe(true)
    expect(existsSync('node_modules/@reference-ui/system')).toBe(true)
  })
})
```

### Performance Tests

**Cold Start Benchmark**:

```typescript
console.time('cold-start')
await syncCommand(cwd, { watch: false })
console.timeEnd('cold-start')
// Expected: <15s for typical project
```

**Watch Mode Benchmark**:

```typescript
// Trigger file change
writeFileSync('src/App.tsx', updatedContent)

console.time('incremental')
// Wait for rebuild
await waitForRebuild()
console.timeEnd('incremental')
// Expected: <2s
```

---

## Conclusion

The Reference UI CLI is a sophisticated build orchestrator that:

1. **Compiles dynamic configs** using esbuild and global collectors
2. **Manages cross-package scanning** via virtual filesystem
3. **Orchestrates multi-step builds** with worker threads
4. **Generates type-safe utilities** with Panda CSS
5. **Packages everything** into consumable npm packages

**Key Innovations**:

- Dynamic config compilation (no manual merging)
- Data URL execution (no temp files)
- Worker thread parallelism (better performance)
- Virtual filesystem (cross-package scanning)
- Incremental watch mode (fast iteration)

**Result**: A design system that feels like magic to use, but is built on solid architectural principles.

---

## Related Documentation

- [Config Compilation](system/config/readme.md)
- [Eval System](system/eval/readme.md)
- [Virtual Filesystem](virtual/README.md)
- [Event Bus](event-bus/README.md)
- [Thread Pool](thread-pool/README.md)
- [Packager](packager/README.md)
