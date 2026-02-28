# Reference UI CLI: Practical Guide

This is a shortened, practical guide to the CLI architecture and how to work on it day to day.

## Thread Pool: How It Works

The CLI offloads heavy work to a worker thread pool so the main thread stays responsive.

**Key points:**

- **Workers are registered** in a manifest and invoked by name (e.g. `watch`, `virtual`, `system`, `packager`, `packager-ts`).
- **Main thread calls** `runWorker(name, payload)` and waits for the result.
- **Each worker runs in isolation** and can do heavy I/O or CPU work without blocking the CLI.
- **Parallelism is bounded**: pool size is tuned to avoid exhausting CPU or I/O bandwidth.

When you add a new worker, keep it focused and register it with the pool so it can be scheduled like the others.

## Logging: Why Use `log.debug`

When developing the CLI, **use `log.debug` for routine tracing** instead of `console.log` or `log.info`.

**Why:**

- **Noise control**: `log.debug` only shows when `debug: true` is set in `ui.config.ts`.
- **Predictable output**: regular builds stay clean and user-friendly.
- **Targeted diagnostics**: you can toggle debug output without code changes.

Use `log.info` for user-facing status messages and `log.error` for failures.

## Worker Responsibilities

Each worker has a single clear responsibility. This keeps the pipeline understandable and fast.

- **watch**: Watches source files and emits `watch:change` events.
- **virtual**: Copies and transforms user files into `.virtual/` for Panda scanning.
- **system**: Compiles Panda config, runs codegen, generates CSS.
- **packager**: Bundles outputs into npm packages in `node_modules/`.
- **packager-ts**: Emits `.d.ts` files from bundled `.js` outputs.

When you add logic, put it in the right worker rather than spreading it across multiple places.

## Cross-Thread Events (Event Bus)

Workers communicate through the event bus (BroadcastChannel), so events are visible in any thread.

**Example flow:**

- `watch` emits `watch:change`
- main thread listens and re-runs the pipeline
- `packager` emits `packager:complete` when finished

Use typed events to keep payloads consistent and easier to debug.

## Practical Tips

- **Keep worker payloads small**: pass only what the worker needs.
- **Prefer deterministic steps**: workers should not depend on shared global state.
- **Use debug logging for traces**: `log.debug('[worker] message', payload)`.
- **Watch mode** should do incremental work whenever possible.

## Common Pitfalls

- **Accidental main-thread work**: heavy tasks in the CLI command handler will block.
- **Unbounded logging**: too much `log.info` makes watch mode noisy.
- **Cross-worker coupling**: if workers depend on each other directly, the pipeline becomes fragile.

---

If you need deeper background, see [CLI.md](CLI.md).
