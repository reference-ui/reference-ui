# Brief — WAVE5.tasty (crew: general, DeepSeek V4.1 Flash, `#high`)

Final bounded arc of the robustness voyage: **close `LIB_TASTY_RUNTIME_404`**
(Oracle `CONCLUSION.oracle` CONC-P2-1, combined options 1+2; WAVE4 arc §5).
Read `reports/CONCLUSION.oracle.md` (CONC-P2-1 is the exact spec) and
`docs/bugs/LIB_TASTY_RUNTIME_404.md`. Work in `/Users/ryn/Developer/reference-ui`,
branch `reference-system`, at the then-HEAD. Do **not** commit/push/stash; do
**not** edit the pin baseline; do not touch `packages/reference-rs/**`, the
pre-existing untracked `pipeline/` files, the `font-weight-runtime-1008` files,
or the running docs dev server. Disclose anything you did not touch.

**Performance guard:** the user warns against regression. Do not add per-sync
work; the materialize copy is a one-time build step and the postprocess is a
string edit. Record the before/after `pnpm --filter @reference-ui/reference-docs
build` (or the lib build) wall time if convenient.

## Root cause (confirmed by the Oracle)

`packages/reference-neo/tsconfig.build.json` sets
`rewriteRelativeImportExtensions: true`, so **tsc** emits
`import(__rewriteRelativeImportExtension('__REFERENCE_UI_TYPES_RUNTIME__'))`
and the types leg, in dist mode, preserves the wrapper around the external
placeholder; `rewriteTypesRuntimeImport` then string-replaces the placeholder
*inside the call* → an un-analyzable `import(<call>)` in `types/types.mjs` and,
inherited via tsup, in `reference-lib/dist/index.mjs`. Source mode already
emits the clean literal. Separately, `materialize-runtime.mjs` never copies the
tasty runtime, so the edge 404s.

## Fix (both halves required)

1. `packages/reference-neo/src/packager/postprocess/rewrite-types-runtime-import.ts`:
   replace the **whole** `__rewriteRelativeImportExtension("<placeholder>")`
   call — both quote forms — with the literal `"./tasty/runtime.js"`; keep a
   plain-placeholder fallback (source-mode bundles); strip the helper definition
   when it is left unreferenced; keep the triple-guard throw semantics; add an
   assertion that the output contains **zero** `__rewriteRelativeImportExtension`.
   Update its unit test to cover **both** input shapes (helper-wrapped + plain)
   and assert the literal `import("./tasty/runtime.js")`.
2. `packages/reference-lib/scripts/materialize-runtime.mjs`: copy
   `.reference-ui/types/tasty/` → `dist/tasty/` **verbatim** (`tasty/runtime.js`
   only statically imports `./chunk-registry.js` + `./manifest.js`; the 550
   `./chunks/*.js` edges are runtime-computed downstream — copy the whole dir,
   runtime.js alone is insufficient).
3. `packages/reference-lib/scripts/build-package.mjs`: assert
   `dist/tasty/runtime.js` exists alongside the packaged runtime files (a
   permanent tripwire).
4. No `package.json` `files` change (`dist` ships wholesale).

## Bar (must reproduce; do not edit pins)

- Postprocess unit tests green for both shapes; emitted `reference-lib/dist/index.mjs`
  contains a plain `import("./tasty/runtime.js")` and **zero**
  `__rewriteRelativeImportExtension`; `dist/tasty/runtime.js` + manifest +
  chunk-registry present.
- **Exactly 3 pin deltas** (`types/types.mjs` × docs/lib/icons): only the helper
  def removal + call→literal; report the before/after hashes + a banner-normalized
  classification. `react.mjs`×3 + maps×3 **byte-identical**; evaluated
  spec/manifest/CSS identical.
- The **unmodified** full consumer smoke flips **FAIL → PASS**, including the
  mount probe, and the scaffold `vite build` emits no tasty/analyze warning.
- `pnpm agentneo q` 0 errors; neo packager/sync suites green; `verify-pins` shows
  exactly the 3 deltas (captain re-baselines).
- One-line append to `docs/bugs/NEO_EMIT_MODE_DRIFT.md` Canon noting the
  dist→source convergence of this edge.

## Output

Write `.agents/missions/voyage-robustness/reports/WAVE5.tasty.md`, append to a
new `.agents/missions/voyage-robustness/WAVE5.md`, reply with a short summary +
VERDICT. Code + tests only; the pins-only re-baseline is the captain's.
