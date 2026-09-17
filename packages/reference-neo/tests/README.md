# `tests/` — everything that proves the runtime

The runtime lives in `src/`. Everything that checks it lives here.
Contracts settled in `../docs/PLAN-harness.md`; usage in `../docs/TESTING.md`.

- `cases/` — one leaf folder per case: `case.json` id, `README.md`
  description, a small world, Playwright specs on the CSS it produces.
  Cases verify the CSS is valid and wins in the cascade (computed
  styles, theme, variants), with settled-state snapshots where
  rendering matters. Snapshot updates are human-gated (lib rule).
- `shared/` — the harness itself: case discovery and search, the
  per-case HTTP server (the browser blocks `file://`, so one always
  runs), headless runs with artifact dumps, and the
  `agentneo` CLI (`list` / `search` / `run` / `q`). Borrows the
  `agentct` shape; warm server plus queue slots land as the case
  count grows. Mechanism lives here; execution policy lives in the
  `agent-neo` skill.
- `.artifacts/` — per-case run output (gitignored). Never committed.

Unit tests colocate with the code they cover in `src/`. Lib-shaped,
not rs-shaped: cases and snapshots, no goldens, no `--update-goldens`.
Neo is the runtime, not the compiler. Cases are not matrix packages;
they do not install from Verdaccio.
