# O1 — Land lingering verified work

STATUS: IN PROGRESS

Chunks to land (from FINALIZATION_REPORT.md "Finalization state"):
1. Font-weight divergence fix — `packages/reference-rs/modules/atomic/**`
   (+ new `resolve/font/scope.rs`) + goldens `ATM-COND-05`, `ATM-LAYER-15`
   + `docs/bugs/FONT_WEIGHT_RESOLUTION.md`.
2. MDX fragment exclusion — `packages/reference-neo/src/collect/**`.
3. System docs section — `packages/reference-docs/src/content/docs/system/**`
   + `packages/reference-docs/src/collections/runtime.ts`.

Also present, unclaimed by the report: `opencode.json` (agent layer),
`.agents/missions/smoke-oracle/briefs/SMOKE.oracle.md`, `FINALIZATION_REPORT.md`.

Not mine, do not touch: `pipeline/src/registry/lock.*`,
`pipeline/src/testing/matrix/runner/paths.test.ts`.

Pre-existing failures to ignore (confirmed at HEAD): `bin/ref.test.ts`
verbose-wording drift; flaky `clean-repro` / `session-repro` lock-kill tests.

## Entries

### 2026-10-07 — O1.verify crew (DeepSeek V4.1 Flash) — VERIFIED, ready to commit

Pin: `8d8f5a71080c44acd1f0d673371e473b44f446a7`. Full report:
`reports/O1.verify.md`.

- Chunk 1 (font-weight): **PASS** — `pnpm agentrs v atomic` 15 files / 314
  tests green; targeted `-t "ATM-COND-05|ATM-LAYER-15"` 2/2 green;
  `pnpm agentrs q` 0 violations / 4 soft warnings; `scope.rs` header is a real
  6-sentence `//!`; both goldens extended to bare-`weight` scoping.
- Chunk 2 (MDX fragment exclusion): **PASS** — Neo has no unit-test script, so
  the repo runner `pnpm agent vitest packages/reference-neo/src/collect/lib/scan`
  was used: 8 files / 38 tests green. `pnpm agentneo q` on `src/collect`:
  0 errors / 5 warnings. Non-JS gate proven on both paths
  (`scanner.ts:250` + `native.ts:212` confirm).
- Chunk 3 (System docs): **PASS** — `pnpm agentdocs q` 0 errors / 0 warnings;
  `pnpm --filter @reference-ui/reference-docs build` exits 0 (content-collections
  registers `slug:"fonts"`/`"system"`, bundle carries the Fonts page). Live
  `/fonts` render **not** re-run (nothing on :5174); steps recorded in report.
- Full Neo unit suite shows only the three documented pre-existing failures
  (`bin/ref.test.ts`, flaky `clean-repro`/`session-repro`); scan subtree green.

Three clean commits for the captain: (1) atomic weight fix + `scope.rs` + both
goldens + bug note; (2) neo `collect/**` six files; (3) docs `runtime.ts` +
`content/docs/system/` three new files. `opencode.json`,
`.agents/missions/**`, `FINALIZATION_REPORT.md` are agent/mission layer;
`pipeline/src/registry/lock.*` and `paths.test.ts` remain untouched.

