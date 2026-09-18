# Lib emitted-artifact coverage — 2026-09-17

Read-only scout: every emitted artifact type under
`packages/reference-lib/.reference-ui/` (the working Panda v1 + core tree),
the consumer import path for each, and which Neo browser case covers it.
Only this file was written.

Source tree: `packages/reference-lib/.reference-ui/` (1110 files total).
Neo cases: `packages/reference-neo/tests/cases/NEO-*/` (10 cases, 7 with
`"sync": true`). Neo emitter: `packages/reference-neo/src/sync/
{publish,react,compile-files}.ts`. Consumer corpus:
`packages/reference-lib/src/`, `fixtures/`, `packages/reference-core/src/`.

All counts are from `rg`; the command is stated with each table.

---

## 1. Summary

The lib `.reference-ui/` folder publishes **four** generated packages plus
workspace/incidental files. Consumers import almost exclusively through two
of them:

- `@reference-ui/react` — imported by **91** files in `packages/reference-lib/src`
  (101 HTML primitives, `css`/`recipe`, `StyleProps`/`PrimitiveProps`, color-mode
  and layer contexts, `./styles.css`).
- `@reference-ui/system` — imported by **31** files (`tokens`, `keyframes`,
  `font`, `globalCss`, `getRhythm`; `./baseSystem` re-exported by downstream libs).
- `@reference-ui/types` — imported by **13** files (Reference/Tasty document
  types; fourth package, no styles).
- `@reference-ui/styled` — imported by **0** files in lib `src`; Panda
  `css`/`jsx`/`patterns` machinery consumed only indirectly (bundled
  `react.mjs` wraps Panda `css`/`cva`; core type files reference styled types).

Against the 10 Neo cases: **7 sync cases cover the stylesheet spine**
(`styled/styles.css`, `runtime-data.mjs`, `system/{baseSystem,evaluated-system,
jsx-elements}.json`, `react/index.mjs`) at skeleton depth, plus `css()`,
responsive lowering, pseudo/disabled variants, radii tokens, recipes, and one
native primitive. **Uncovered**: the whole `@reference-ui/types` package
(543 files incl. 496 Tasty chunks), Panda `jsx`/`patterns`/`tokens`/`themes`/
`types` subpaths (128 files), the system authoring bundle surface
(`system.mjs` beyond fragments unit tests), `react/styles.css` as a consumer
path, `compile-request.json` / `font-registry.json`, `virtual/` (336 files),
and `panda.config.ts` (Panda-only, correctly absent from Neo).

The single most load-bearing gap is `@reference-ui/types`: it is the largest
emitted package by file count, is imported by real lib sources, and has no Neo
emitter (`LINKED_PACKAGES` is `system|styled|react` only) and no case.

---

## 2. Inventory table

File counts: `rg --files <dir> | wc -l`.
Import counts: `rg -l "<specifier>" packages/reference-lib/src | wc -l`.
Binding shapes: `rg --no-filename "from '<specifier>'" packages/reference-lib/src | sort | uniq -c`.

| # | Artifact type | Path under `.reference-ui/` | Files | Consumer import path | Importers (lib src) | Neo case coverage |
|---|---------------|------------------------------|------:|----------------------|--------------------:|-------------------|
| 1 | Panda css fns | `styled/css/` (`css`,`cva`,`cx`,`sva` + d.ts) | 11 | `@reference-ui/styled`, `./css`, `./css/cva`, `./css/cx`, `./css/sva` | 0 | **Covered by semantics, not by file.** NEO-CSS-01 (4 utilities + hover), NEO-CSS-02 (container lowering via `styled/runtime-data.mjs` + `css.mjs` bundle). Neo emits no `css/` dir |
| 2 | Panda styled jsx | `styled/jsx/` (factory + 20 pattern components + d.ts) | 49 | `@reference-ui/styled/jsx` | 0 | **Uncovered.** No Neo case touches Panda `styled()` factory. NEO-PRIM-01 covers the *native* replacement (`react/index.mjs`, style props, `data-layer`) instead |
| 3 | Panda patterns | `styled/patterns/` (same 20 fns, class-name helpers) | 42 | `@reference-ui/styled/patterns`, `./patterns/box` | 0 | **Uncovered.** Neo has `src/fragments/api/patterns.ts` (`extendPattern`) with colocated vitest but no browser case and no emitted patterns |
| 4 | Panda recipes | `styled/recipes/` (`font-style`, `create-recipe`) | 5 | (no export entry in `styled/package.json`) | 0 | **Covered by semantics.** NEO-RECIPE-01 asserts 6 recipe classes + `registerRecipeData` from `runtime-data.mjs`. No `recipes/` dir emitted |
| 5 | Token fns + unions | `styled/tokens/` | 3 | `@reference-ui/styled/tokens`, `./tokens/*` | 0 direct (core `types/public/*.ts` reference styled token/type paths) | **Uncovered as package.** Token *values* covered via sheet vars (NEO-SYNC-01 `--colors-brand`; NEO-EDGE-02 `--radii-md/full`) |
| 6 | Themes | `styled/themes/` (`light`/`dark` JSON + `getTheme`/`injectTheme`) | 4 | (no export entry) | 0 | **Uncovered.** NEO-PLAY-B-01 probes a theme flip, but on static committed HTML, not generated themes |
| 7 | Generated types | `styled/types/` (14 d.ts; `csstype`, `style-props`, `conditions`, …) | 14 | `@reference-ui/styled/types`, `./types/*` | 0 direct (referenced by core type graph) | **Uncovered.** Neo emits only a minimal standalone `react/index.d.mts` |
| 8 | Assembled sheet | `styled/styles.css` (27k lines) | 1 | via `react/styles.css` copy (see 17) | 1 (`src/global.d.ts` declares the module) | **Covered.** All 7 sync cases read it: SYNC-01 (layer + token), CSS-01/02, EDGE-01/02, PRIM-01, RECIPE-01 |
| 9 | Panda global cssgen | `styled/global.css` (`@layer base`, panda banner) | 1 | (bundled into sheet pipeline) | 0 | **Existence only.** NEO-SYNC-01 asserts the file exists; Neo emits a 1-line stub ("global rules ship in styles.css") |
| 10 | Runtime plans data | `styled/runtime-data.mjs` + `.d.mts` (`NativeRuntimeArtifact`) | 2 | internal (`registerRuntimePlans` hook into react) | 0 direct | **Covered.** NEO-CSS-02 (`registerRuntimeData`) and NEO-RECIPE-01 (`registerRecipeData`) import it from the world via `pathToFileURL` |
| 11 | Panda build internals | `styled/helpers.js`, `styled/extensions/index.mjs`, `styled/package.json` | 3 | build-time only (`panda.config.ts` consumes extensions) | 0 | **N/A (correctly absent).** Neo has no Panda pipeline; `styled/package.json` exists but carries no `exports` map yet |
| 12 | System authoring bundle | `system/system.mjs` (`tokens`, `keyframes`, `font`, `globalCss`, `getRhythm`) | 1 of 41 in `system/` | `@reference-ui/system` | 31 (`globalCss` 18, `tokens` 6, `keyframes` 6, `font` 1 — distinct statements) | **Partial.** Fragment collectors exist in `src/fragments/api/*` with colocated vitest, but no browser case asserts an emitted authoring `system.mjs`; Neo's system export map is `baseSystem`-only |
| 13 | Portable base system | `system/baseSystem.mjs` + `.d.mts` (shipped in lib `files[]`) | 2 | `@reference-ui/system/baseSystem` | 0 in lib src; `fixtures/layer-library/src/index.ts` re-exports it | **Existence only.** NEO-SYNC-01 asserts both files; shape differs from lib (Neo `{name,fragment,css,jsxElements}` vs lib core type) |
| 14 | Evaluated data JSON | `system/evaluated-system.json` (112 KB), `system/jsx-elements.json` (101 primitives + 53 local, merged 154), `system/compile-request.json` (120 KB), `system/font-registry.json` | 4 | build data (Rust input / jsx hosts / registry) | 0 | **Half covered.** SYNC-01 asserts `evaluated-system.json` + `jsx-elements.json`. `compile-request.json` and `font-registry.json` are not emitted by Neo |
| 15 | System type surface | `system/types/` (public graph, mirrors react), `system/system/{api,panda,primitives}`, `system/lib/fragments`, `system/entry/system.d.ts`, `system/types.generated.d.mts`, `system.d.mts` | ~30 | `@reference-ui/system` (types: `StyleProps`, `SystemStyleObject`, token/recipe/keyframes configs) | type-only (via `export type *`) | **Uncovered.** No case asserts system `.d.ts` output |
| 16 | React runtime bundle | `react/react.mjs` (2781 lines: 101 primitives + `css`/`recipe`/`useColorMode`/contexts) + `react.d.mts` + `entry/react.d.ts` + `system/primitives` d.ts | ~8 of 50 in `react/` | `@reference-ui/react` | 91 (`Div,Span` 25, `Div` 13, `Div+PrimitiveProps` 7, `StyleProps` 3, contexts/`recipe` rare) | **Covered at skeleton depth.** NEO-PRIM-01 asserts `react/index.mjs` + `index.d.mts` exist (note: Neo names them `index.*`, lib names them `react.*`), one primitive paints style props, DOM passthrough, `data-layer`. Full 101-tag surface, contexts, `css`/`recipe` re-exports unasserted |
| 17 | React stylesheet copy | `react/styles.css` (duplicate of `styled/styles.css`) | 1 | `@reference-ui/react/styles.css` (export map + `global.d.ts` module decl) | 1 | **Uncovered — filename gap.** Neo publishes no `react/styles.css`; `writeReactDir` emits only `package.json` (+ `index.*` from `publishReactBundle`), and the Neo react export map has no `./styles.css` entry |
| 18 | React public types | `react/types/public/` (17 d.ts: `StyleProps`, `PrimitiveProps`, fonts, recipes, …), `react/types.generated.d.mts` (`FontRegistry`) | ~19 | `@reference-ui/react` (type imports) | 3+ (`StyleProps` statements; `PrimitiveProps` in ~12 statements) | **Uncovered.** Neo `generateReactTypesSource` emits a minimal standalone `index.d.mts`; no `StyleProps`/`PrimitiveProps` graph |
| 19 | Types package | `types/types.mjs` (7328 lines: `Reference`, `createReferenceComponent`, runtime provider/hooks) + `tasty/{manifest,runtime,chunk-registry}.js` + `tasty/chunks/` (496 files) + `reference/` (38 d.ts) + `entry/types.d.ts` | 543 | `@reference-ui/types`, `./manifest`, `./runtime` | 13 (`ReferenceDocument*`, `ReferenceMember*`, `ReferenceJsDoc`, `formatReferenceTypeParameter`) | **Uncovered entirely.** Neo emits no `types/` dir; `LINKED_PACKAGES = ['system','styled','react']`. No case references it |
| 20 | Virtual workspace | `virtual/src/` (313 files: mirrored component/theme sources), `virtual/book/` (12: shell, canvas, discovery, perf, vite config), `virtual/_reference-component/` (10: Reference runtime sources), `virtual/__reference__ui/` (1 transpiled `SummaryChip.js`) | 336 | none (sync/Book workspace; `compile-request.json` points `sourceRoot` at it) | 0 | **N/A by design, unasserted.** Neo `collectCompileFiles` reads real project sources (`COMPILE_EXCLUDE` skips `.reference-ui/**`); no virtual dir, no case |
| 21 | Driver config | `panda.config.ts` (260 KB generated driver) + `node_modules/` symlinks | 1 + links | Panda CLI only | 0 | **N/A (correctly absent).** No Panda in Neo |
| 22 | Session + incidental | `tmp/{session,config.snapshot}.json` + `session.lock`, `book-perf.jsonl`, `react/.ref-ui-tsgo-rOgR0s/` staging | ~5 | none | 0 | **N/A.** No case asserts session files (neo-state notes Neo still uses `.reference-ui/tmp` via `getProjectTmpDirPath`) |

Totals check: `rg --files packages/reference-lib/.reference-ui | wc -l` → **1110**.
Per-dir: `styled/` 135, `system/` 41, `react/` 50, `types/` 543, `virtual/` 336,
`tmp/` 3, top-level 2 (`panda.config.ts`, `book-perf.jsonl`).

---

## 3. Findings

1. **Two packages carry all direct consumer imports; Neo covers one's runtime
   and neither's types.** `rg -l` over `packages/reference-lib/src` gives
   `@reference-ui/react` 91 files, `@reference-ui/system` 31, `@reference-ui/types`
   13, `@reference-ui/styled` 0. NEO-PRIM-01 + the css cases cover the react
   runtime spine; the `StyleProps`/`PrimitiveProps`/token-union type graphs
   (rows 15, 18) have zero case coverage.
2. **Panda `styled/*` subpaths are dead to lib consumers but live to the build.**
   Zero lib-src imports of `@reference-ui/styled*`, yet `react.mjs` bundles
   `import { css as styledCss } from "@reference-ui/styled/css"` and core's
   `types/public/*.ts` reference `styled/types/*` + `styled/tokens`. Neo is
   right to not re-emit them, but the internal dependency (custom `css`/`cva`
   wrapping generated plans) must keep working — today covered only via the
   `css.mjs` bundle path in CSS-01/02.
3. **`@reference-ui/types` is the largest uncovered emitted package.**
   543 of 1110 files (49%), 496 of them content-hashed Tasty chunks, imported
   by 13 lib-src files, with `./manifest` and `./runtime` subpaths. Neo has no
   emitter and no case. Either Neo must emit it or PLAN must declare the
   Reference/Tasty surface out of scope for parity.
4. **Filename deltas already exist and are asserted by cases.**
   Neo publishes `react/index.mjs`/`index.d.mts` where lib publishes
   `react/react.mjs`/`react.d.mts` (NEO-PRIM-01 asserts the Neo names), and
   Neo's `styled/package.json` / `react/package.json` / `system/package.json`
   carry minimal or missing `exports` maps vs lib's full maps (lib styled map
   has 12 entries incl. `./css/cva`, `./jsx`, `./patterns/box`, `./tokens/*`).
   Any consumer resolving the lib subpaths breaks under Neo output.
5. **`react/styles.css` is a real consumer path with no Neo equivalent.**
   Lib's react export map serves `./styles.css` and `src/global.d.ts` declares
   the module; Neo's react map has only `.` and no styles file is published
   into `react/`. If the bundler/vite path resolves styles through the react
   package, this is a P0 gap; if through `styled/styles.css`, it is a doc fix.
6. **`global.css` is asserted but stubbed.** SYNC-01 checks existence only, and
   Neo writes a 1-line stub while lib's file is 1743 lines (`@layer base` +
   reset + panda banner). The lib-sheet-global-css evidence report owns the
   semantic gap; from this inventory's view the case gives false confidence —
   it passes with no global CSS at all.
7. **`virtual/` is a third of all files and entirely absent from Neo by design.**
   336 files: a 313-file source mirror (vs 763 files under
   `packages/reference-lib/src` — `rg --files | wc -l` on each), the 12-file
   Book app, and Reference-component staging. Nothing imports it as a package;
   it exists so Panda scans mirrored sources. Neo's extractor reads real
   sources instead. No case needed, but Book parity (Book app, discovery,
   perf) needs its own decision elsewhere.
8. **Harness-only cases cover no artifacts.** NEO-SMOKE-01, NEO-SNAP-A-01, and
   NEO-PLAY-B-01 serve static committed HTML (`"sync"` unset) and assert
   computed styles / snapshots only. Artifact coverage rests on the other 7.
9. **System authoring surface is unit-tested, not sync-tested.**
   `src/fragments/api/{tokens,keyframes,font,globalCss,patterns}.ts` have
   colocated vitest, but no browser case imports an emitted `system.mjs` and
   calls `tokens()`/`globalCss()` the way 31 lib-src files do. The sync
   boundary (bundle → import → collect) is unproven in a browser.
10. **Data JSON is half-emitted.** `evaluated-system.json` and
    `jsx-elements.json` are covered by SYNC-01; `compile-request.json`
    (`schemaVersion`, `spec`, `jsxHosts`, `sourceRoot`, `declarationRoot`) and
    `font-registry.json` (sans/serif/mono weight maps) have no Neo emitter. If
    downstream tooling (packager, fonts) reads them, cases must pin them.

---

## 4. Case implications

Ordered by consumer impact (importer count × breakage severity):

1. **`@reference-ui/types` (13 importers, 543 files, 0 coverage)** — needs a
   PLAN-level decision before any case: emit a Neo `types/` package (manifest +
   runtime + Reference component) with a case that imports `./manifest` and
   renders one `ReferenceDocument`, or explicitly defer Tasty/Reference parity
   and record which lib sources cannot build under Neo until then.
2. **`react/styles.css` consumer path (row 17)** — one-line case addition to
   NEO-SYNC-01 or NEO-PRIM-01: assert `react/styles.css` exists and equals
   `styled/styles.css` (lib behavior: byte-identical duplicate), or assert the
   chosen replacement path. Today neither is pinned.
3. **React export-map + filename parity (row 16, finding 4)** — extend
   NEO-PRIM-01 (or a new sync-shape case) to assert the full `exports` maps of
   all three packages and the `react.mjs` vs `index.mjs` decision, so the
   rename is a recorded contract rather than drift.
4. **System authoring round-trip (31 importers, finding 9)** — new case:
   world fragment files call `tokens()`/`globalCss()` imported from the
   *emitted* `@reference-ui/system`, sync collects them, sheet contains the
   token/var and the global rule. Proves the bundle→import→collect boundary.
5. **`global.css` semantics (finding 6)** — strengthen SYNC-01 or add a global
   case: assert the reset/base rules actually land (in `styles.css @layer
   global` per the stub comment, or in `global.css`) and paint, instead of
   existence-only. Depends on the lib-sheet-global-css gap list.
6. **Patterns/recipes/JSX surface (rows 2–4)** — `extendPattern` + recipe
   authoring need a case once the emitter lands; Panda `styled()` factory and
   `jsx/*` need an explicit wont-emit record (0 lib importers, but
   `jsx-elements.json` `local: 53` shows the detection pipeline feeds on
   component hosts — a case asserting `local`/`merged` on a multi-component
   world would pin that).
7. **Type-surface parity (rows 7, 15, 18)** — cheapest form: a case (or
   typecheck step) that compiles a world importing `StyleProps`,
   `PrimitiveProps`, and one token union from the emitted packages. Today the
   only type assertion is file existence of `index.d.mts`.
8. **No action: rows 11, 20, 21, 22** — Panda internals, virtual mirror, driver
   config, session files. Correctly absent from Neo; no cases wanted. (Book app
   parity is a separate product decision, not an artifact-coverage gap.)

---

## 5. Out of scope

- **Sheet semantics.** What the 27k-line `styles.css` / 1743-line `global.css`
  contain, layer order, and per-family reproduction difficulty belong to
  `lib-sheet-styles-css.md` and `lib-sheet-global-css.md`; this report pins
  only file presence, consumer paths, and which case reads each file.
- **Core author/runtime API parity.** Module-by-module surface comparison and
  panda-ism renaming are owned by `core-api-parity.md`; row 12/16 findings
  here defer to it for naming decisions.
- **Rust engine claims.** Whether `compile()` output is correct per plan is
  owned by `atomic-claims.md`; here `runtime-data.mjs` is covered as "imported
  and registered by a case", not "byte-correct".
- **Panda v1 corpus mining.** Input→CSS expectations from Panda's own test
  suites are owned by the three `panda-v1-*-corpus.md` reports.
- **Harness health and timing.** Runner mechanics, green/red state, and wall
  time are owned by `neo-state-2026-09-17.md`.
- **Uninspected corners.** `styled/tokens/tokens.d.ts` union contents,
  `styled/themes/*.json` blob shape, `types/tasty/manifest.js` schema, and
  `react/.ref-ui-tsgo-rOgR0s/` staging purpose were listed but not read line by
  line; counts only. `matrix/` consumers were not surveyed (lib src +
  fixtures + core src only).
- **Staleness.** The lib tree was generated 2026-09-16; a re-sync may change
  counts (notably Tasty chunk hashes and `jsx-elements.json` `local` list).
  Re-run `rg --files packages/reference-lib/.reference-ui | wc -l` and the
  `rg -l` import commands above to refresh.
