# WAVE0 — robustness recon

STATUS: DONE (recon reported; Oracle plan in flight)

Reproduce: T1 emit-mode drift (source vs dist payload diff); T2 silent stale
upstream; T3 proof-harness gaps. Survey T4. No product changes.

## Entries

### WAVE0.recon — 2026-10-07 (general crew, DeepSeek V4.1 Flash)

Report: `reports/WAVE0.recon.md` (artifacts in `reports/wave0-artifacts/`).

- **T1 REPRODUCED and UNDERSTATED.** Dist mode sha `3cf8397a…` == pin;
  source mode `1b2db8e3…`; each mode byte-stable across repeated runs.
  **Four** pinned files drift, not just `system/baseSystem.mjs`:
  `react/react.mjs`, `react/react.mjs.map`, `types/types.mjs`,
  `system/baseSystem.mjs` (all four: dist == pin, source != pin). In
  `baseSystem.mjs` it is 7 esbuild banner lines **plus** a reflowed
  destructuring; normalized (banner-strip + whitespace-collapse) fragments are
  token-equal. But `types.mjs` differs as a **module graph**
  (`react/jsx-runtime` vs `react`/`createElement`) with a 2202-line diff, and
  `react.mjs.map` `sources`/`mappings` differ — so "comments only / spec
  manifest CSS identical" is false. Root cause spans four `import.meta.url`
  seams: `collect/lib/bootstrap.ts:24-26`, `packager/react.ts:30-41`,
  `packager/reference-types.ts:23-25`, `config/bundle.ts:36-39`. The pin
  baseline is dist mode; the documented lib `sync`
  (`node ../reference-neo/bin/ref.ts sync`) is source mode and cannot
  reproduce it (demonstrated: all four lib artifacts change; `verify-pins`
  then FAILs 8). `build-options.ts` comment-stripping alone cannot meet the Bar.
- **T2 CONFIRMED.** `@reference-ui/lib/baseSystem` resolves lib's live
  `.reference-ui/system/baseSystem.mjs` (`reference-lib/package.json:19-22`;
  `config/bundle.ts:64` external; `evaluate.ts:21-31`;
  `getUpstreamFragments` `evaluate.ts:72-79`). No mtime/hash check anywhere on
  the path; `errors.ts:64-100` hints only on *missing* upstream. Live demo:
  altered lib's top-level name → docs `loadUserConfig` returned
  `extends[0].name = STALE-UPSTREAM-PROBE` with **no warning**; lib restored
  byte-for-byte (`e4099f20…`).
- **T3 CONFIRMED.** `verify-pins.mjs:20-31` never syncs; it compares disk bytes
  to the committed baseline. Demonstrated PASS (1258 files) with no sync in the
  invocation. `capture-pins.mjs:19` crashes (ENOENT) on a missing
  `.reference-ui`. `measure-one-shot.mjs:26` measures a fixed, un-attested
  `packages/reference-neo/dist`.
- **T4 SURVEY.** 13 cited candidates in the report (packed-tarball
  `--ignore-scripts` staleness, `check:dist` not covering
  `.reference-ui` system/runtime bundles, un-hinted stale/parse failures,
  no microbundle normalisation seam, `lastLoadedByRoot` global cache, barrel
  guard narrower than the artifact, fresh-clone crash).
- No product code changed; pin baseline untouched; docs `.reference-ui` left
  at the dist/pin-matching state; lib `.reference-ui` restored byte-for-byte.

### Captain note — escalation

Recon falsified `NEO_EMIT_MODE_DRIFT.md`'s premise (corrected in place) and
materially widens T1: four files, four seams, and a real module-graph
difference, with the documented lib `sync` path (source) unable to reproduce
the dist-mode pin. That also means `voyage-one-shot`'s pin re-baseline to dist
mode is correct for the *shipped* artifact but the in-repo dev path diverges.

Two consequences for the plan:

1. The in-flight `PLAN.oracle` was briefed on the stale "comments only"
   premise. On its return, reconcile it against this report; if it does not
   already address the four-seam / module-graph / dev-vs-ship split, dispatch a
   focused **design consult** with the corrected evidence to choose the
   strategy: (A) canonicalise resolution across all seams, (B) canonicalise
   every emitted bundle incl. sourcemap, (C) unify the workspace on the shipped
   (dist) mode, or a mix.
2. T2 and T3 are confirmed and independent; they are candidate early lands.

