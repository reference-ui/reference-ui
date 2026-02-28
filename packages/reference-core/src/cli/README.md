# Reference UI CLI

A high-performance build system that transforms design system configurations into type-safe CSS-in-JS utilities and React components.

## Overview

The CLI orchestrates a multi-stage pipeline that:

1. **Watches** source files for changes
2. **Transforms** and copies files to a virtual filesystem
3. **Compiles** design tokens and Panda CSS configuration
4. **Generates** CSS utilities and TypeScript types
5. **Bundles** and installs packages to `node_modules/@reference-ui/`

All heavy work runs in worker threads for optimal performance.

## Architecture

```
┌─────────┐
│  Watch  │  Monitors file changes with @parcel/watcher
└────┬────┘
     │ emits watch:change
     ▼
┌─────────┐
│ Virtual │  Copies & transforms files (.mdx → .jsx, import rewrites)
└────┬────┘
     │ emits virtual:fs:change
     ▼
┌─────────┐
│ System  │  Compiles Panda config, runs codegen, generates CSS
└────┬────┘
     │ emits system:compiled
     ▼
┌──────────┐
│ Packager │  Bundles code with esbuild, installs to node_modules
└────┬─────┘
     │ emits packager:complete
     ▼
┌──────────────┐
│ Packager-TS  │  Generates TypeScript declarations
└──────────────┘
```

## Key Systems

### Event Bus

Cross-thread communication using Node's `BroadcastChannel`. Workers emit typed events (`watch:change`, `system:compiled`, etc.) that other workers can listen to. Enables loose coupling and parallelism.

### Thread Pool

Based on Piscina. Offloads heavy I/O and CPU work to worker threads:

- **watch** — File watcher (long-running)
- **virtual** — File transformation (long-running in watch mode)
- **system** — Panda config compilation and codegen (long-running in watch mode)
- **packager** — esbuild bundling
- **packager-ts** — TypeScript declaration generation

### Watch Module

Uses `@parcel/watcher` (native FSEvents/inotify) to monitor source files. Filters changes by `config.include` patterns and emits events for the pipeline to react to.

### Virtual Filesystem

Copies user files from `src/` to `reference-core/.virtual/` with transformations:

- MDX → JSX (for Panda CSS scanning)
- Import rewrites (`css` → `@reference-ui/system/css`)

Panda CSS scans the virtual directory instead of the user's source.

### System (Panda Integration)

Compiles design tokens into a unified Panda CSS config:

1. Scans files calling `extendTokens()`, `extendRecipe()`, etc.
2. Bundles fragments with esbuild
3. Deep-merges into base config
4. Runs Panda codegen and CSS extraction

### Packager

Bundles generated code into npm packages:

- `@reference-ui/system` — Design tokens, CSS utilities, patterns, recipes
- `@reference-ui/react` — React components, runtime APIs, styles.css

Uses esbuild for fast bundling and installs directly to `node_modules/`.

### Packager-TS

Generates `.d.ts` files from bundled JavaScript using `tsdown`.

## Commands

```bash
# Build once and exit
ref sync

# Watch mode - rebuild on file changes
ref sync --watch
```

## Configuration

Create `ui.config.ts` in your project root:

```typescript
import { defineConfig } from '@reference-ui/core/config'

export default defineConfig({
  include: ['src/**/*.{ts,tsx}'], // Files to scan
  virtualDir: '.virtual', // Transform cache directory
  debug: false, // Enable debug logging
})
```

## Performance Features

- **Debounced rebuilds** — Prevents duplicate runs when multiple events fire rapidly
- **Incremental builds** — Panda CSS only processes changed files
- **Worker threads** — Parallel execution of independent tasks
- **Native transforms** — Rust-based MDX compilation and import rewriting

## Development

### Project Structure

```
cli/
├── index.ts              # CLI entry point (Commander)
├── sync/                 # Main orchestration command
├── config/               # Config loading and validation
├── event-bus/            # Cross-thread event system
├── thread-pool/          # Worker management (Piscina)
├── watch/                # File watching (@parcel/watcher)
├── virtual/              # File transformation and virtual FS
├── system/               # Panda CSS integration
│   ├── config/          # Config compilation
│   ├── collectors/      # Design token collection
│   ├── eval/            # Runtime config evaluation
│   └── gen/             # Panda codegen runner
├── packager/            # Package bundling
│   ├── bundler/         # esbuild integration
│   ├── package/         # Package definitions
│   └── install/         # node_modules installation
└── packager-ts/         # TypeScript declaration generation
```

### Key Utilities

- `lib/log.ts` — Logging with debug mode support
- `lib/debounce.ts` — Function debouncing
- `lib/path.ts` — Path utilities (`toRelativeImport`)
- `lib/resolve-core.ts` — Resolve `@reference-ui/core` package directory
- `lib/microbundle.ts` — esbuild wrapper for quick bundling
- `lib/child-process.ts` — Spawn with memory monitoring

### Logging

Use `log.debug()` for development tracing:

```typescript
import { log } from '../lib/log'

log.debug('worker-name', 'Something happened', { data: 'value' })
```

Debug logs only appear when `debug: true` in `ui.config.ts`.

### Adding a Worker

1. Create `module/worker.ts` with exported function
2. Add entry to `thread-pool/manifest.json`
3. Update `WorkerName` type in `thread-pool/workers.ts`
4. Call via `runWorker('name', payload)`

## Related Documentation

- **CLI.md** — Deep architectural dive
- **LLMS.md** — Practical development guide
- **thread.md** — Thread pool patterns and best practices
