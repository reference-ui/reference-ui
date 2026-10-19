# `tests/` — everything that proves the runtime

The runtime lives in `src/`. Everything that checks it lives here.
Usage in `../docs/TESTING.md`.

Cases verify the CSS is valid and wins in the cascade (computed
styles, theme, variants), with settled-state snapshots where rendering
matters; snapshot updates are human-gated (lib rule). The harness —
case discovery and search, the per-case HTTP server, headless runs,
artifact dumps, the `agentcore` CLI — is described in its own README,
as are the case groups; per-case run output stays gitignored and is
never committed.

Unit tests colocate with the code they cover in `src/`. Lib-shaped,
not rs-shaped: cases and snapshots, no goldens, no `--update-goldens`.
Core is the runtime, not the compiler. Cases are not matrix packages;
they do not install from Verdaccio.
