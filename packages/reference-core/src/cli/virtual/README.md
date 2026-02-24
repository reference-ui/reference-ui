# Virtual Filesystem Module

The virtual filesystem creates an isolated, transformed copy of user files for consumption by build tools like Panda CSS.

## Purpose

- **Isolation**: Tools read from `.virtual/` instead of source files directly
- **Transformation**: Apply minimal transforms (MDX → JSX, AST tweaks)
- **Watch Mode**: Automatically sync changes during development
- **Extensibility**: Multiple tools can consume the same virtual files

## Architecture

```
User Files (src/)
      ↓
  File Watcher
      ↓
  Transforms (minimal)
      ↓
Virtual Directory (.virtual/)
      ↓
  ├→ Panda CSS (reads)
  ├→ Future Tool A (reads)
  └→ Future Tool B (reads)
```

## Key Principle

> Keep files **mostly as-is** with minimal transforms. The virtual layer is about **isolation and light preprocessing**, not heavy compilation.

## API

### `initVirtual(sourceDir, config, options?)`

Initialize the virtual filesystem with optional file watching.

```typescript
import { initVirtual } from './virtual'
import { loadUserConfig } from '../config'

const config = await loadUserConfig(process.cwd())

const cleanup = await initVirtual(process.cwd(), config, {
  virtualDir: '.virtual',
  watch: true,
})

// Later: stop watching
cleanup()
```

### `syncVirtual(sourceDir, config, options?)`

Manually sync all files to the virtual directory.

```typescript
import { syncVirtual } from './virtual'
import { loadUserConfig } from '../config'

const config = await loadUserConfig(process.cwd())

await syncVirtual(process.cwd(), config, {
  virtualDir: '.virtual',
})
```

### `transformFile(options)`

Transform a single file (used internally).

```typescript
import { transformFile } from './virtual'

const result = await transformFile({
  sourcePath: '/path/to/file.mdx',
  destPath: '/path/to/.virtual/file.jsx',
  content: '# Hello',
  debug: true,
})
```

## Current Transforms

### MDX → JSX

- **Why**: Panda CSS needs to extract styled() calls from MDX
- **How**: Full MDX compilation using @mdx-js/mdx
- **When**: Applied first in the transform pipeline

### Panda CSS Import Rewrites

After MDX compilation, we apply Panda-specific transforms:

1. **CVA/Recipe Imports**: Rewrite `cva` and `recipe` imports from `@reference-ui/core` to `styled-system/css`
2. **CSS Imports**: Rewrite `css` imports from `@reference-ui/core` to `styled-system/css`

These rewrites ensure Panda CSS can properly resolve its generated functions.

### Transform Pipeline

All transforms are orchestrated by the `transforms/` controller:

1. **MDX → JSX** (if .mdx file)
2. **Rewrite cva/recipe imports** (for .js/.jsx/.ts/.tsx files)
3. **Rewrite css imports** (for .js/.jsx/.ts/.tsx files)

## File Structure

```
virtual/
├── index.ts           # Main exports, initVirtual()
├── types.ts           # TypeScript types
├── watcher.ts         # File watching with chokidar
├── copy.ts            # Copy + transform logic
├── transform.ts       # Transform coordinator
├── config.internal.ts # Internal configuration
├── init.ts            # Initialize virtual filesystem
├── sync.ts            # One-time sync
├── transforms/        # Transform implementations
│   ├── index.ts           # Transform controller/pipeline
│   ├── mdx-to-jsx.ts      # MDX compilation
│   ├── rewrite-cva-imports.ts  # CVA/recipe import rewriting
│   └── rewrite-css-imports.ts  # CSS import rewriting
└── README.md          # This file
```

## Integration with CLI

The sync command uses the virtual module:

```typescript
// In sync/index.ts
import { initVirtual } from '../virtual'
import { loadUserConfig } from '../config'

export const syncCommand = async (cwd: string, options) => {
  const config = await loadUserConfig(cwd)

  // Setup virtual filesystem
  const cleanup = await initVirtual(cwd, config, {
    watch: options.watch,
  })

  // Panda CSS reads from .virtual/
  await runPandaCodegen()

  // Cleanup on exit
  process.on('SIGINT', cleanup)
}
```

## Why "Virtual"?

- **Familiar concept**: Virtual DOM, virtual filesystem
- **Emphasizes abstraction**: It's a layer between source and tools
- **Tool-agnostic**: Not tied to any specific build tool
- **Clear intent**: "Don't edit these files directly"
