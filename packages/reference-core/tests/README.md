# `tests/` — everything that proves the runtime

The runtime lives in `src/`. The case harness and every case live here.
Usage in `../docs/TESTING.md`.

Cases verify the CSS is valid and wins in the cascade (computed
styles, theme, variants), with settled-state snapshots where rendering
matters; snapshot updates are human-gated (lib rule). The harness —
case discovery and search, the per-case HTTP server, headless runs,
artifact dumps, the `agentcore` CLI — has its own README; so does
`cases/`, and each case group carries its own ledger. Per-case run
output stays gitignored and is never committed.

Unit tests colocate with the code they cover in `src/`. Lib-shaped,
not rs-shaped: cases and snapshots, no goldens, no `--update-goldens`.
Core is the runtime, not the compiler. Cases are not matrix packages;
they do not install from Verdaccio.
