# WAVE5 — close `LIB_TASTY_RUNTIME_404` (materialize + analyzable)

STATUS: LANDED (`2b376fd3d` code; `e75b4c31c`/`c82052096` pins) — captain re-run +
pins-only re-baseline done. Voyage CONCLUDED — see `CLOSEOUT.md` §15. (The
required WAVE5 Oracle arc review never ran; the FINAL closeout review covered the
WAVE5 mechanism + pin move — FC-P3-3.)

Both halves per Oracle `CONCLUSION.oracle` CONC-P2-1: make the packaged tasty
edge analyzable and materialize its payload. Full report:
`reports/WAVE5.tasty.md`.

## Entries

### 2026-10-08 — WAVE5 tasty 404 closed (crew)

- Touched: `packages/reference-neo/src/packager/postprocess/rewrite-types-runtime-import.ts`
  (unwrap the whole tsc helper call, both quote forms, strip the unreferenced
  helper, zero-helper assertion), `packages/reference-neo/src/packager/reference-types.test.ts`
  (both shapes + literal assert), `packages/reference-lib/scripts/materialize-runtime.mjs`
  (copy `.reference-ui/types/tasty/` → `dist/tasty/` verbatim),
  `packages/reference-lib/scripts/build-package.mjs` (tasty tripwire),
  `docs/bugs/NEO_EMIT_MODE_DRIFT.md` (Canon one-liner),
  `docs/bugs/LIB_TASTY_RUNTIME_404.md` (STATUS → FIXED + evidence).
  Extra disclosed seam: `packages/reference-lib/tsup.config.ts` pins the
  generated `./tasty/runtime.js` edge `external` — without it an analyzable
  literal makes tsup/esbuild eagerly inline the 550-chunk runtime
  (2.15 MB → 4.16 MB) and drops the lazy edge; the captain should review this
  fourth file.
- Bar reproduced: documented package-cwd lib build → `dist/index.mjs` has a
  plain `import("./tasty/runtime.js")` and **zero**
  `__rewriteRelativeImportExtension`, 2.15 MB (WAVE4 baseline size); `dist/tasty/`
  complete (runtime + manifest + chunk-registry + 550 chunks). Unmodified full
  consumer smoke **FAIL → PASS** (incl. `mount-reference` and
  `zero-unexpected-console-errors`); scaffold `vite build` emits zero
  tasty/analyze warnings and code-splits the runtime.
- Pins: exactly three `types/types.mjs` lines move — docs `521c7b84…`→`64f66545…`,
  lib `b94b75ef…`→`cf7b63ed…` (real build), icons `b9e91e46…`→`feed3e6c…` (real
  sync). `react.mjs`×3 + maps×3 byte-identical; lib `capture-pins` diff = the
  one `types/types.mjs` line. `verify-pins` FAILs on exactly the two on-disk
  lines (docs pending the captain's documented docs sync); baseline untouched.
- Gates: `pnpm agentneo q` **0 errors** (26 pre-existing live warnings; the two
  changed neo files 0/0); neo packager+sync vitest **73/73** (14 files).
  Performance: lib build 6.82 s (WAVE4 ~7 s), 2.15 MB dist; tasty copy 0.28 s /
  2.8 MB, one-time build step.
- Not touched: `packages/reference-rs/**`, untracked `pipeline/` files,
  `font-weight-runtime-1008` files, docs dev server `:5174`, pin baseline,
  `package.json` `files`; no commit/push/stash.
