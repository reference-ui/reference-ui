# Sync Command - Event-Driven Service Architecture

## Goal

Split the CLI into small, focused services that communicate via an event bus for clean separation of concerns and parallel execution potential.

## Architecture

### Event Bus

- Central message broker for all services
- Services don't call each other directly - they publish/subscribe to events
- Enables loose coupling and easy feature additions

### Service Models

Each service:

- Has a single responsibility
- Listens for specific events
- Publishes results as events
- Can run as a Worker Thread for CPU-intensive tasks

### Event Flow (Pipeline)

```
config:loaded
  → files:copied
    → panda:codegen
      → css:generated
        → primitives:generated
          → artifacts:deployed
            → complete
```

### Services to Build

1. **ConfigLoader** - Parse ui.config.ts, emit config:loaded
2. **FileWatcher** - Watch/copy user files, emit files:copied
3. **PandaCodegen** - Run panda codegen, emit panda:codegen
4. **CSSGenerator** - Run panda css, emit css:generated
5. **PrimitivesGenerator** - Generate design primitives, emit primitives:generated
6. **Deployer** - Copy to node_modules, emit artifacts:deployed

### Multithreading Strategy

**Node.js Worker Threads** for CPU-intensive tasks:

- PandaCodegen service (heavy code analysis)
- PrimitivesGenerator (template processing)
- CSSGenerator (style computation)

**Main thread** for I/O operations:

- FileWatcher (listening for changes)
- ConfigLoader (file reading)
- Deployer (file copying)

Benefits:

- Non-blocking pipeline
- Utilize multiple CPU cores
- Clean event-based communication between threads

## Implementation Plan

### Phase 1: Event Bus Foundation

- Create EventBus class with pub/sub
- Define SyncEvent type union
- Wire up basic event flow in index.ts

### Phase 2: Extract Services

- Create individual service modules in `services/` folder
- Each service file exports its implementation
- Register services in syncCommand

### Phase 3: Worker Threads (Optional)

- Create worker files for CPU-bound services
- Use Worker threads for codegen and generation
- Post messages via event bus adapter

### Phase 4: Watch Mode

- Event bus stays alive in watch mode
- File watcher triggers re-sync automatically
- Services re-run only affected tasks

## Notes

- Keep index.ts tight - just orchestrate services
- Services are composable and testable
- Event pattern is naturally debuggable with logging
- Watch mode emerges naturally from event-driven design
