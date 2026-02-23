# Watch Module

Thin wrapper around chokidar that watches files and emits events. That's it.

## Purpose

- **Simple**: Just watches files with chokidar
- **Events**: Emits events when files change
- **Isolated**: Runs in a worker thread so it doesn't block

## Architecture

```
Watch Worker Thread          Other Modules (listen to events)
    │                                │
    │  chokidar.watch()              │
    │  ↓                              │
    │  File change detected           │
    │  ↓                              │
    │  emit('watch:change')           │
    ├─────────────────────────────────▶
    │                                 │
    │                            on('watch:change')
    │                                 │
    │                         (handle the change)
```

## Events Emitted

### `watch:ready`

Watcher is ready and monitoring files.

```typescript
{ sourceDir: string; patterns: string[] }
```

### `watch:change`

A file was added, changed, or removed.

```typescript
{ event: 'add' | 'change' | 'unlink'; path: string; stats?: any }
```

### `watch:error`

Chokidar error occurred.

```typescript
{
  error: string
}
```

## Usage

### Start Watching

```typescript
import { initWatch } from './watch'

initWatch(sourceDir, config)
```

### Listen to Events

```typescript
import { on } from '../event-bus'

on('watch:change', ({ event, path }) => {
  console.log(`File ${event}: ${path}`)
  // Do something with the change
})
```

## Configuration

```typescript
{
  ignoreInitial: true,    // Only watch for changes, not initial files
  persistent: true,       // Keep process alive
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
