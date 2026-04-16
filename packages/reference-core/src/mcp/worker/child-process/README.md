# MCP child process

This folder holds the **short-lived Node child** used for Atlas prefetch and full MCP artifact builds, separate from the long-lived **MCP worker** thread.

## Why it exists

Atlas and Tasty analysis build large in-memory graphs. Running that inside the MCP worker would keep RSS and heap in that worker’s isolate for the whole session. A **dedicated child** that exits when work finishes releases that memory and keeps the worker small.

Sync wires `run:mcp:prefetch:atlas` and `run:mcp:build` so heavy MCP children do not overlap packager-ts DTS children when possible.

## Files

- **`entry.ts`** — CLI bundle entry (`dist/cli/mcp-child.mjs`). JSON on `argv[2]`, prints a JSON line on stdout for the parent to parse.
- **`process.ts`** — Main-thread / worker callers: resolve the built script and `spawnMonitoredAsync` helpers.
