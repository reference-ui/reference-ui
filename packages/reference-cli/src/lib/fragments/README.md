# Fragments

**General-purpose fragment collection system for build-time code execution.**

The fragments module provides a way to:
1. **Define** functions users can call (e.g., `tokens()`, `extendPandaConfig()`)
2. **Scan** directories for files that call those functions
3. **Execute** those files at build time via microbundle
4. **Collect** the data passed to those functions

This is the core capability that powers system features like Panda config collection, box pattern extensions, and font system configuration.

## Concepts

### Fragment

A **fragment** is data collected from user code at build time. The shape is generic (`T`).

### Collector

A **FragmentCollector** is:
- A function users call: `collect(fragment: T)`
- A globalThis registry that captures those calls during execution
- Init/cleanup utilities for the global state

### Workflow

```
User code:
  import { tokens } from '@reference-ui/system'
  tokens({ colors: { primary: '#000' } })
                    ↓
CLI scans for files calling tokens()
                    ↓
CLI bundles + executes each file
                    ↓
Collector captures { colors: { primary: '#000' } }
                    ↓
CLI merges/processes all fragments
```

## API

### `createFragmentCollector<T>(config)`

Create a collector for a specific fragment type.

```typescript
import { createFragmentCollector } from '@reference-ui/cli/lib/fragments'
import type { Config } from '@pandacss/dev'

const pandaCollector = createFragmentCollector<Partial<Config>>({
  name: 'panda-config',
  globalKey: '__refPandaConfig',
  logLabel: 'system:panda',
})

// Export for users
export const extendPandaConfig = pandaCollector.collect
```

**Config:**
- `name` - Human-readable identifier (for logging)
- `globalKey` - Unique key on globalThis (e.g., `__refPandaConfig`)
- `logLabel` - Optional label for debug logs (defaults to `fragments:${name}`)

**Returns:**
- `collect(fragment: T)` - Function users call to register fragments
- `init()` - Set up globalThis collector (call before executing code)
- `getFragments()` - Get collected fragments
- `cleanup()` - Remove from globalThis

### `scanForFragments(options)`

Scan directories for files that call specific functions.

```typescript
import { scanForFragments } from '@reference-ui/cli/lib/fragments'

const files = scanForFragments({
  directories: ['src/styled', 'src/components'],
  functionNames: ['extendPandaConfig', 'tokens'],
  include: ['**/*.{ts,tsx}'], // optional, this is the default
  exclude: ['**/node_modules/**', '**/*.d.ts'], // optional, this is the default
})
// => ['/abs/path/to/button.ts', '/abs/path/to/input.tsx', ...]
```

**Options:**
- `directories` - Directories to scan (absolute or relative)
- `functionNames` - Function names to look for (e.g., `['tokens', 'recipe']`)
- `include` - Glob patterns to include (default: `['**/*.{ts,tsx}']`)
- `exclude` - Glob patterns to exclude (default: `['**/node_modules/**', '**/*.d.ts']`)

**Returns:** Array of absolute file paths

### `collectFragments<T>(options)`

Execute files and collect fragments.

```typescript
import { createFragmentCollector, scanForFragments, collectFragments } from '@reference-ui/cli/lib/fragments'

// 1. Create collector
const collector = createFragmentCollector<MyFragmentType>({
  name: 'my-system',
  globalKey: '__refMySystem',
})

// 2. Scan for files
const files = scanForFragments({
  directories: ['src/styled'],
  functionNames: ['myFunction'],
})

// 3. Collect fragments
const fragments = await collectFragments({
  files,
  collector,
  tempDir: '/path/to/.ref/fragments', // optional
})

// 4. Do something with fragments
console.log(fragments) // => [{ ... }, { ... }, ...]
```

**Options:**
- `files` - Files to execute (from `scanForFragments` or custom list)
- `collector` - FragmentCollector instance
- `tempDir` - Optional temp directory for bundled files (default: `cwd/.ref/fragments`)

**Returns:** `Promise<T[]>` - Array of collected fragments

## Usage in System

System modules configure collectors for their needs:

```typescript
// packages/reference-core/src/cli/system/panda/collector.ts
import { createFragmentCollector } from '@reference-ui/cli/lib/fragments'
import type { Config } from '@pandacss/dev'

export const pandaCollector = createFragmentCollector<Partial<Config>>({
  name: 'panda-config',
  globalKey: '__refPandaConfig',
  logLabel: 'system:panda',
})

// Public API
export const extendPandaConfig = pandaCollector.collect
export const COLLECTOR_KEY = pandaCollector.config.globalKey
```

Then in the build process:

```typescript
// packages/reference-core/src/cli/system/panda/build.ts
import { scanForFragments, collectFragments } from '@reference-ui/cli/lib/fragments'
import { pandaCollector } from './collector'

const files = scanForFragments({
  directories: ['src/styled', 'user/project/src'],
  functionNames: ['extendPandaConfig', 'tokens', 'recipe'],
})

const fragments = await collectFragments({
  files,
  collector: pandaCollector,
  tempDir: join(coreDir, '.ref', 'panda'),
})

// Merge fragments into Panda config...
```

## Why Fragments?

### Before (tangled, Panda-specific)

```
system/eval/         - Panda-specific runner with COLLECTOR_KEY hardcoded
system/config/panda/ - initCollector.ts, extendPandaConfig.ts (boilerplate)
```

### After (general, reusable)

```
lib/fragments/       - Generic capability, tested & documented
system/panda/        - Configures fragments for Panda use case
system/fonts/        - Configures fragments for fonts use case
system/box/          - Configures fragments for box patterns
```

**Benefits:**
- Clear separation: lib = capability, system = configuration
- No boilerplate files (initCollector, etc.) per use case
- Type-safe collectors for each domain
- Easy to add new fragment types
- Testable in isolation

## Implementation Details

### Microbundle

Each file is bundled with `microBundle()` before execution. This:
- Resolves imports (including `node_modules`)
- Compiles TypeScript
- Inlines dependencies (so the temp file is self-contained)

### GlobalThis Pattern

Fragments use `globalThis[collectorKey]` to pass data between:
- User code (calls `collect(fragment)`)
- CLI (reads from globalThis after execution)

This works because:
1. CLI sets `globalThis[key] = []` before import
2. User code calls `collect()`, which pushes to that array
3. CLI reads the array and cleans up

### Temp Files

Bundled code is written to temp `.mjs` files because Node's `import()` requires a file path. Temp files are cleaned up after execution.

## Future

- Add fragment validation/schema support
- Add fragment merging strategies (deep merge, array concat, etc.)
- Add fragment caching based on file mtimes
- Add parallel execution for large file sets
