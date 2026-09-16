# Simulation learnings — native cutover from Panda CSS to reference-rs

Mission: PLAN.md gates F0→N1-N6→G1→C1/C2/C3/Q1→C4→C5→M0→G2→K1→G4 (replace Panda
CSS with Rust crates + N-API + TS wrappers in `packages/reference-rs`).
**Outcome: SIMULATION. M0 DONE 7/7 GREEN; G2 HALTED (2nd captain halt) on 3
open items + a css hang. Plan: keep `packages/reference-rs` + this doc,
quarantine-stash `pipeline/`, revert everything else to last green commit.**

## Per-area change summary (640 dirty files, 521 tracked changed)

- **reference-rs (354 files, +4918/−3182):** KEPT. New crates/modules
  (atomic, base-system, typegen, styletrace, runtime, canon, atlas, tasty,
  virtualrs, shared), F0 `contracts/` fixtures+types, N-API seams, TS wrappers,
  vitest suites. `agentrs t` exit 0 (cargo 387, vitest 28 files/379 tests).
- **reference-core (89 files, +2097/−2655):** REVERT. C1 spec/compose
  (`system/base/`), C2 browser runtime (`createCss`/registry/serialize,
  `LayerScopeContext string|null`), C3 types/packager, C4 two-phase driver
  (typegen→atomic, workers/scheduler), C5 bound-css materialisation.
- **pipeline/ (17 files, +295/−36):** QUARANTINE-STASH (name: TODO). Perf work
  + matrix runner changes. Needed later to probe the css wedge.
- **matrix + fixtures (49 files):** REVERT. M0 backend-text (`data-theme`),
  oracle updates, fixture `bootstrap-runtime`/`build-package` rewrites.
- **lib/icons/root:** REVERT. Portal TS2322, materialize-runtime, ui.config,
  `test-core` runner scripts, rust-compile workflow.

## Fix-packet catalog (M0 run, ~26 packets; symptom → root cause → fix)

1. TS2591 (prep swaps) → `this` typing in swapped code → typing-only fix.
2. Packaging-boundary abort on extend-library → false positive on fixture
   layer → boundary check fix.
3. Icons builds fail → UNVERIFIED (icons pack wiring) → fixed, builds green.
4. Portal TS2322 → `LayerScopeContext` now `string|null` → value fix.
5. materialize `assertNoBareSpecifier` → bare `@reference-ui/react` specifier
   → assertion/wiring fix.
6. lib verify 2 FAILs → empty cssChunks/stylePropNames + verify race → fixed.
7. rust/icons packs → transient race/pack wiring → fixed; lib build 8/8.
8. distro setup fails → `@reference-ui/react` lacks `createCss` export →
   export restored in entry/react.ts.
9. `No native runtime plans registered when recipe() ran` → registration
   ordering → ordering fix.
10. distro sync throws → config evaluates `recipe()` before sync generates
    plans (chicken-and-egg) + scheduler 404 → sync ordering (bundle alias +
    fallback) + scheduler fix; sync green (7133 plans).
11. color-mode test-phase fails → plans never registered in built dist
    (`requireRegistered`) → registration fix.
12. css-selectors + recipe `Could not resolve` → externals wiring → fixed.
13. recipes always empty → `assemble.ts` had no recipe fragment collector
    (real C1 gap) → collector added (795 green).
14. atomic ignores `spec.recipes` (runtime 0) → engine lowering gap → engine
    fix; fixture proof (1 table, 149 green).
15. Container still 7146 plans/0 recipes → consumer linkage → fixed; 7146/1.
16. color-mode registration crash → runtime registration in test env → fixed;
    css-selectors GREEN 2/2.
17. Triage: color-mode 9f = one engine bug (`builder.rs` plan/CSS class
    mismatch); distro = styled-oracle Panda-ism + layer preamble + cold-sync
    race; recipe f1.
18. Builder fix units-green but color-mode still f9 in-container → theory
    insufficient; packed linux emitted 1 recipe vs local 2 → platform-divergence
    lead (later disproven).
19. Platform parity PROVEN identical (divergence theory dead); crash fixed,
    classes+vars+data-theme correct, but colors wrong → systemic stylesheet
    **layer inversion**.
20. Layer fix → color-mode 15/15 + distro 26/26 (atomic 148/148, 155/155).
21. recipe f10/34 → UNVERIFIED root cause → fixed; recipe 34/34 GREEN.
22. system 4f, css-selectors 1f, watch 2f, responsive suite-fail (tally blind
    spot: 8/8 tests passed, suite failed) → fixed → 6/7 GREEN.
23. M0 closer: stale `.node` proven by hash → rebuilt via sanctioned flow.
24. Responsive 3f → engine ordering: base rule emitted after
    `@container`/`@media` at equal specificity (sort ignores conditions +
    first-seen emission) → condition-aware ordering fix (cargo 153, seam
    158/158, 118 goldens unchanged).
25. Responsive still f3/sf1 after ordering fix → stale-or-wrong
    disambiguation → resolved; **M0 DONE 7/7 GREEN exit 0**
    (system 33/33, color-mode 15/15, css-selectors 23/23, distro 26/26+1skip,
    recipe 34/34, responsive 35/35, watch 5/5).

Meta-lesson: V2 fail-fast hid 6/7 packages (packet 19); always re-prove engine
fixes in-container; tally blind spots (suite-fail with tests green) need
suite-level gating.

## Perf findings (all landed in pipeline/ + runner; numbers from session log)

- Verdaccio uplink `cache: true` (verified in
  `pipeline/src/registry/verdaccio/config.yaml`).
- pnpm store shared across matrix jobs via Dagger cache volume:
  **21.2s → 266ms** per job after first.
- Lanes 4→6 (after cache; 1 PW worker/unit stays locked).
- Native Playwright off-exclusive cap 8→16 (`--workers=16` observed live).
- reference-rs CPU-gate slots 2→4.
- **Key discovery (UNVERIFIED exact size):** pipeline prep staging copies ~11GB
  incl. Rust `target/` dirs every run — see `pipeline/src/registry/package-prep.ts`
  + `paths.ts` (`stagingDir`); also note pnpm store dir env var inside
  container. Biggest remaining boot-cost lever: exclude `target/` from staging.

## Open failures at halt (G2)

1. **S3.2 expectation** — PLAN §3.2 adoption (system-on-plans / Rust-owned
   system segment / className-less recipe = sync-failing diagnostic) required
   an expectation update; citation+intent to be preserved. Fix landed,
   verification incomplete.
2. **css `splitPrimitiveProps`** — No-plans registration error (reads
   `getStylePropNames()` registry; css always style; className/children/
   colorMode/variant metadata). Fix landed, verification incomplete.
3. **primitives `extensions/index.mjs`** — missing file after `ref sync` +
   No-plans registration. Fix landed, verification incomplete; sanctioned
   writers own the file.
4. **css "watch-ready" wedge (×2, same phase)** — 19–22 min silent hang, VM
   idle, required kill; everything else fails cleanly/fast. Now a product-bug
   lead, not infra flake. **`/tmp/wedge2-sample.txt` is LOST** (absent;
   /tmp did not survive) — stack sample unrecoverable. G2-fix probe logs (`/tmp/g2-fix-*.log`) persisted to `docs/forensics/`
   (6 files: css, css-verify×3, primitives, watch-probe).

## Key seam/contract notes

- `contracts/types.ts` + `contracts/fixtures/*.json` (F0 freeze) are the
  cross-package truth: `EvaluatedSystemSpec`, `NativeRuntimeArtifact`,
  `CompileResult`, `PortableBaseSystem`, `NativeCompileRequest` (±layers
  negative, token-light, invalid-version/unknown-field fixtures). Every packet
  reads the same fixture — never hand-copied mocks.
- N-API exports (per-module `native.rs`): `compile_system` (atomic),
  `emit_dts_sync` (typegen), `analyze_styletrace[_bindings]` (styletrace),
  `get_native_capabilities` (runtime), `scan_and_emit_modules` (tasty),
  `analyze_atlas` (atlas), `rewrite_css/cva_imports`, `replace_function_name`,
  `apply_responsive_styles` (virtualrs).
- Runtime lookup key is `(system, when, prop, value, important)`; slots are
  Rust-authored cascade identity; bound `css()` replaces by slot for its owner
  only; misses emit one dev diagnostic, never hash/fallback.
- `data-theme` is the only light/dark attribute; zero `data-panda-theme`
  anywhere is a G2/K1 gate.

## Next mission

Rewrite of `reference-core` against `reference-rs` (real cutover, not sim).
`pipeline/` stash is quarantined for probe (stash name:
`sim-quarantine-pipeline`). First task on resume: css-wedge diagnosis with forensics-first
capture (persist samples into `docs/forensics/` immediately; /tmp is volatile).
Ground truth: session log `.../sessions/2026/09/15/01a0a6f5-3f24-7050-8d43-1c93b3c5f661/session.jsonl`
(28MB; grep, don't dump).
