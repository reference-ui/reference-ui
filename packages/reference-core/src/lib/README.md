# lib

Shared internal infrastructure for `reference-core`.

This folder is where small reusable building blocks live. These modules are not
the product features themselves; they support config loading, fragment
collection, worker execution, filesystem path resolution, logging, and command
wrapping.

## Modules

- `event-bus`: cross-thread event transport built on `BroadcastChannel`
- `fragments`: generic fragment scanning, bundling, execution, and collection
- `log`: internal console logger with debug gating from config
- `microbundle`: small esbuild wrapper for in-memory bundling
- `paths`: path resolution helpers for config, outDir, dist, and package roots
- `run`: command wrapper that standardizes CLI error handling
- `thread-pool`: Piscina-based worker pool helpers
- `child-process.ts`: monitored child-process spawn helper used by packaging

## Why this folder exists

The goal of `lib` is to keep non-feature-specific infrastructure out of higher
level modules like `config`, `system`, `packager`, and `watch`.

That gives the rest of the codebase smaller units to depend on:

- config loading depends on `microbundle` and `paths`
- system generation depends on `fragments`
- worker-driven phases depend on `thread-pool`
- CLI entrypoints depend on `run` and `log`

Each submodule should document:

1. what it owns
2. what it does not own
3. whether it is release-ready as internal infrastructure
