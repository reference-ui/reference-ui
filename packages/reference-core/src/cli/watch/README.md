# Watch Module

The watch module provides dedicated file system monitoring in a separate worker thread.

## Purpose

- **Isolation**: File watching runs in its own thread, never blocking the main thread
- **Simplicity**: Clean separation from virtual filesystem - watch just monitors, virtual just copies
- **Reliability**: Chokidar configuration tested and optimized
- **Events**: Emits standardized events that any module can listen to

## Architecture

```
Watch Worker Thread          Main Thread + Other Workers
    │                                │
    │  chokidar.watch()              │
    │  ↓                              │
    │  File changes detected          │
    │  ↓                              │
    │  emit('watch:change', {...})    │
    ├─────────────────────────────────▶
    │                                 │
    │                            on('watch:change')
    │                                 │
    │                            Virtual FS updates
    │                            System rebuilds
```

## Events

### `watch:ready`

Emitted when the watcher has completed initial scan and is ready to monitor changes.

```typescript
{
  sourceDir: string
  patterns: string[]
}
```

### `watch:change`

Emitted when a file is added, changed, or removed.

```typescript
{
  event: 'add' | 'change' | 'unlink'
  path: string  // Relative to sourceDir
  stats?: fs.Stats
}
```

### `watch:error`

Emitted when chokidar encounters an error.

```typescript
{
  error: string
}
```

## Usage

### Starting the Watcher

```typescript
import { initWatch } from './watch'

// Start watching in a worker thread
initWatch(sourceDir, config)
```

### Listening to Events

```typescript
import { on } from '../event-bus'

// Listen for file changes
on('watch:change', ({ event, path }) => {
  console.log(`File ${event}:`, path)
  // Handle the change
})

// Wait for watcher to be ready
on('watch:ready', () => {
  console.log('Watcher is monitoring files')
})
```

## Configuration

Chokidar is configured with optimized settings:

```typescript
{
  ignoreInitial: false,   // Process existing files on start
  persistent: true,        // Keep process alive
  awaitWriteFinish: {
    stabilityThreshold: 100,  // Wait 100ms for file to stabilize
    pollInterval: 100,        // Check every 100ms
  },
}
```

## Why a Separate Module?

Previously, watching was embedded in the virtual filesystem module, causing:

- Complex initialization logic mixing concerns
- Hard-to-debug failures (was watch failing or virtual FS failing?)
- Tight coupling between watching and copying

Now:

- **Watch module**: Just monitors files, emits events
- **Virtual module**: Just copies files when told to
- **Event bus**: Connects them loosely

This makes each module simpler, more testable, and easier to debug.

## Debugging

Enable debug logging:

```typescript
export default defineConfig({
  include: ['src/**/*.{ts,tsx}'],
  debug: true, // Shows all watch events
})
```

Debug logs include:

- `[watch:worker] Starting file watcher`
- `[watch:worker] File changed: src/App.tsx`
- `[watch:worker] ✅ Watcher ready and monitoring`

## Performance

The watch worker:

- Runs in a separate thread (no main thread blocking)
- Uses chokidar's optimized native watchers (fsevents on macOS, inotify on Linux)
- Debounces rapid changes (100ms stabilization)
- Emits lightweight events (just path + event type)

Typical overhead: <5ms per file change event
