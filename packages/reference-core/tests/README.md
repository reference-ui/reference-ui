# Everything that proves the runtime

The runtime sources live beside this folder. The case harness and every case live here.
Usage lives in the testing doc.

Cases verify the CSS is valid and wins in the cascade (computed
styles, theme, variants), with settled-state snapshots where rendering
matters; snapshot updates are human-gated (lib rule). The harness —
case discovery and search, the per-case HTTP server, headless runs,
artifact dumps, the `agentcore` CLI — has its own README; so does
the case tree, and each case group carries its own ledger. Per-case run
output stays gitignored and is never committed.

Unit tests colocate with the code they cover. Lib-shaped,
not rs-shaped: cases and snapshots, no goldens, no `--update-goldens`.
Core is the runtime, not the compiler. Cases are not matrix packages;
they do not install from Verdaccio.
