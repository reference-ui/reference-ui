# Packager-ts child process

This folder holds the **short-lived Node child** used for declaration generation (tsdown/tsc, package iteration), separate from the long-lived **packager-ts worker** thread.

## Why it exists

Heavy TypeScript tooling loads large graphs into the V8 heap. If that work ran inside the packager-ts worker isolate, RSS and heap stayed attributed to that worker for the whole sync session, which inflated memory profiles and made the machine feel overloaded when other workers were active.

Spawning a **dedicated child process** that exits when the pass finishes moves that RSS off the worker: the worker only orchestrates (`process.ts`) and stays thin. Sync also sequences MCP vs packager-ts heavy children so two large toolchains rarely run at once.

## Files

- **`entry.ts`** — CLI bundle entry (`dist/cli/packager-ts-child.mjs`). Reads JSON from `argv[2]`, runs the DTS pass, exits.
- **`process.ts`** — Used from the worker side: resolves the built script path and `spawnMonitoredAsync` to run the child.
