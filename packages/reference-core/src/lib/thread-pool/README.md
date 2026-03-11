# thread-pool

Piscina-based worker orchestration for `reference-core`.

This module owns the shared worker pool and the small conventions around it:

- initialize the pool with shared `workerData`
- run workers by absolute path
- build worker registries from manifests
- expose tsup worker entry maps
- shut the pool down cleanly

## What it owns

- pool lifecycle
- `workerData` wiring for config and cwd
- manifest-to-worker-path mapping
- memory debug logging around pool lifetime

## What it does not own

- worker business logic
- event-bus messaging
- config loading
- packaging or Panda generation logic

It is only the execution substrate for worker modules.
