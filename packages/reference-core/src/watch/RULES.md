# Watch Module Rules

## 1. No `node:fs` Watching
- **NEVER use `node:fs`** (e.g. `fs.watch`, `fs.watchFile`, `fs.promises.watch`) for watching files or directories.
- All file system monitoring in this module MUST strictly and exclusively use `@parcel/watcher`.
- `@parcel/watcher` provides native, performant, cross-platform file change events (FSEvents on macOS, inotify on Linux, etc.). Do not introduce ad-hoc Node.js file system watchers.

## 2. Keep the Implementation Clean and Minimal
- The watcher module's responsibility is small: subscribe to filesystem changes with `@parcel/watcher`, filter against include/dependency paths, and emit normalized events onto the event bus.
- Do not introduce complex nested fallbacks or secondary watcher subsystems.
