# StyleTrace Survey — Full-Discovery Voyage Baseline

Date: 2026-09-18. Mission: `docs/missions/completed/styletrace.md`. Read-only recon; the only
repo write is this file. Probe script lives at `/tmp/styletrace-survey-probe.mjs`
(control + experiment, re-runnable, no tree writes).

## 1. State map

### 1.1 What the engine discovers today

`packages/reference-rs/modules/styletrace/` answers two questions (README):

- which prop names count as Reference style props (resolver leg: Oxc type
  expansion from a `StyleProps` declaration entrypoint);
- which exported JSX components keep those style props connected to Reference
  primitives or the same runtime style pipeline (analysis leg: boundary check +
  JSX forwarding walk).

Covered shapes (README + `tests/cases/`, 14 TS cases + Rust `src/tests/`):
direct prop forwarding, rest/spread forwarding, local wrapper chains,
re-export/alias chains, namespace imports, default exports/imports,
`export *` barrels incl. package barrels, `splitCssProps`/`box`/`css` pipeline
usage, factory-produced components, forwardRef wrappers, package subpaths,
`node_modules` wrappers, node-builtin import filtering. Source discovery covers
`ts/tsx/js/jsx/mts` (`source_files.rs:66`).

### 1.2 What the engine misses — the Neo-tree wall

Both resolver legs fail on Neo-synced trees, so the whole trace returns `Err`
and every consumer fails closed to the empty set:

- **Style-props leg.** Entry stems (`resolver/tracer/mod.rs:17-25`) only cover
  `react/types/**` and bare `types/**` / `style-props`. Neo publishes no
  `react/types/` at all (`sync/react.ts` writes only `package.json`,
  `react.d.mts`, `react.mjs`); its style-props live at
  `styled/types/style-props.d.ts` (Neo `sync/publish/types-bundle.ts:34`).
  Worse than a missing stem: Neo's `styled/types/style-props.d.ts` exports only
  `SystemProperties` (alias), while the real `StyleProps` lives in
  `styled/types/index.d.ts:57` (typegen) and `react/react.d.mts:8` (wired).
  The resolver asks for export name `StyleProps` (`tracer/mod.rs:38`), so a
  stem-only fix still misses.
- **Primitive leg.** Primitive stems (`analysis/primitive_metadata.rs:12-18`)
  require `react/system/primitives/index`. Neo publishes no `react/system/`.
- **Propagation.** `analysis/analyzer.rs:55` (`?` on prop names) and `:58` (`?`
  on primitives) turn either miss into a whole-trace `Err`; atomic
  `hosts.rs:24-27` maps `Err` to the empty set ("fails closed", ATM-SITE-13).

This is exactly the `packages/reference-lib/ui.config.ts:15-21` B7 comment:
"Styletrace cannot substitute … on Neo trees the traced set is always empty."

### 1.3 Gap #0 (pre-existing cargo failure) — confirmed and characterized

`pnpm agentrs c styletrace`: 20 passed, 1 failed —
`tests::prop_resolution::loads_real_reference_core_style_props`
(`src/tests/prop_resolution.rs:70-92`):

> `missing StyleProps declaration entrypoint in …/packages/reference-lib`

The test resolves against the real lib sync root, whose `.reference-ui/` is
now Neo-shaped (`styled/types/{index,conditions,prop-type,style-props}.d.ts`,
`react/{package.json,react.d.mts,react.mjs,styles.css}` — verified 2026-09-18).
It passed when lib was core/Panda-synced (`react/types/style-props` existed);
the Neo cutover orphaned it. Characterization: **stale-shape test meets
missing-stem engine** — the test is the canary, the engine is the patient.
/tmp probe agrees (see §3).

## 2. Consumer table — who reads `ui.config` `jsxElements` today

Every reader found (repo-wide `jsxElements` / `jsx-elements.json` /
`jsxHosts` / `JsxElementsArtifact` search):

| # | Reader | File:line | What it does with the list |
| --- | --- | --- | --- |
| C1 | Neo sync resolver | `packages/reference-neo/src/sync/jsx-elements.ts:19-23` | `resolveJsxElements`: `config.jsxElements` → `local`, `extends[].jsxElements` → `upstream`, union → `merged`. **No styletrace call** (contrast core). |
| C2 | Neo compile request | `packages/reference-neo/src/sync/index.ts:68-72` | `jsxHosts = merged ∪ PRIMITIVE_JSX_NAMES` into `ScopedCompileRequest` → `compileNative`. |
| C3 | Neo baseSystem publish | `packages/reference-neo/src/sync/publish/system.ts:49,178-181` | `jsx.merged` → published `baseSystem.jsxElements` (downstream `extends` fuel). |
| C4 | Neo artifact publish | `packages/reference-neo/src/sync/publish/system.ts:188` | writes `system/jsx-elements.json` (`{primitives,upstream,local,merged}`). |
| C5 | Neo validation | `packages/reference-neo/src/config/validate.ts:58-62` (top-level), `:20-25` + `:140-145` (per-system entries) | shape checks; `jsxElements` counts as "synced system data". |
| C6 | Core config run | `packages/reference-core/src/system/panda/config/run.ts:39-56` | merges configured + **traced** (`traceIncludedJsxElements`) + upstream → `additionalJsxElements` → `createBaseArtifacts` + panda config. ~~The only traced leg in either pipeline.~~ Struck slice #6: Neo gained a traced leg in slice #4 (C17). |
| C7 | Core trace driver | `packages/reference-core/src/system/panda/config/styletrace.ts:69-93` | globs `include` for traceable roots, calls `trace(root, cwd)` per root, warns-and-skips on failure. |
| C8 | Core upstream/merge | `packages/reference-core/src/system/panda/config/jsx-elements.ts:22-23,27-28,31-50` | `getUpstreamJsxElements`, `resolvePandaJsxElements` (prepends primitives), artifact writer, `system/jsx-elements.json` path. |
| C9 | Core panda patterns | `packages/reference-core/src/system/panda/config/extensions/api/extendPatterns.ts:62` | feeds `jsx:` patterns into the generated Panda config. |
| C10 | Core base publish | `packages/reference-core/src/system/base/create.ts:25,104-115` | writes `baseSystem.jsxElements` into `system/baseSystem.mjs`. |
| C11 | Core validation | `packages/reference-core/src/config/validate.ts:66-70` (top-level), `:18-23`, `:203-208` (entries) | same shape/data checks as C5. |
| C12 | Atomic host union | `packages/reference-rs/modules/atomic/src/hosts.rs:13-17` | `jsx_hosts ∪ traced_names` → the extraction gate set. |
| C13 | Atomic extractor | `packages/reference-rs/modules/atomic/src/extract/jsx/mod.rs:220`, `extract/mod.rs:110-113` | unimported tags extract **iff** in host set (incl. dotted `NS.Panel` ↔ concatenated `NSPanel` spelling). |
| C14 | Downstream `extends` | every `matrix/*/ui.config.ts` (`extends: [baseSystem]`), e.g. `matrix/distro/ui.config.ts:7`; `matrix/watch/src/watch-config-base-system.ts:31-32` (spreads `baseSystem` incl. `jsxElements`) | lib's published list becomes every matrix package's `upstream`. |
| C15 | Lib re-export/ship | `packages/reference-lib/src/index.ts:7`, `scripts/build-package.mjs:11-12` | re-exports + ships `baseSystem.mjs` (list included). |
| C16 | Distro assertions | `matrix/distro/tests/unit/distro.test.tsx:703-729` | pins `baseSystem.jsxElements ∋ MonoText` and `jsx-elements.json` upstream/merged `∋ MonoText`, primitives `∋ Div`. |
| C17 | Neo traced publish (slice #4) | `CompileResult.tracedJsxHosts` (`packages/reference-rs/contracts/types.ts:99`) → `resolveJsxElements(config, traced)` (`packages/reference-neo/src/sync/jsx-elements.ts:21-36`), called from `sync/index.ts:96` | `compile()` returns the traced set on the result; Neo publishes configured ∪ traced into `jsx-elements.json` (`local`/`merged`) and `baseSystem.jsxElements`. Config `jsxElements` is the escape hatch. |

Producers (hand lists in-tree): `packages/reference-lib/ui.config.ts:22-34`
(53 names), `packages/reference-icons/ui.config.ts:7` (`ICON_JSX_NAMES`),
`matrix/primitives/ui.config.ts:8` (`PrimitiveJsxMarker`), plus Neo case worlds
`NEO-SITE-11` (`Chart`), `NEO-SITE-16` (`NSPanel`), `NEO-SYNC-04`
(`CardFrame`, `PanelShell`), `NEO-SYNC-10` (`LocalPanel` + upstream).

Checked and **absent** (negatives): Book has no `jsxElements` readers
(`book/` appears only inside `include` globs as trace *sources*); typegen
emits `StyleProps` but never reads the list; Vite/Webpack plugins have no
`jsxElements`/`jsxHosts` reads (Webpack only path-aliases `baseSystem`,
`packages/reference-core/src/webpack/plugin.ts:52`); `reference-icons`
`baseSystem` has no in-repo consumers (downstream is external).

## 3. Behavioral surface — deleting the list TODAY

Prediction (from the code chain C1→C2→C12→C13 and C3→C14→C16):

1. `jsx.merged` becomes `[]`; `compile-request.json` `jsxHosts` shrinks to
   primitives only (`sync/index.ts:72`).
2. Atomic's traced leg returns `Err` on the Neo-shaped lib tree (§1.2) and
   fails closed to `∅` (`hosts.rs:26`). Nothing replaces the deleted names.
3. Style props on compound tags (`<Accordion …>`, `<MonoText …>`, …) in
   `include` sources silently stop extracting (`extract/jsx/mod.rs:220`) →
   missing utilities in `styled/styles.css` → visual drift + red paint specs.
4. Published `baseSystem.jsxElements: []` and `jsx-elements.json` `local: []`
   propagate through `extends` → `matrix/distro` MonoText assertions (C16) go
   red; every matrix package loses upstream hosts.
5. Core-synced trees would partially self-heal via the traced leg (C6/C7), but
   lib is Neo-synced, so the traced leg is dead there too.

Proof (cheap, /tmp-only): `node /tmp/styletrace-survey-probe.mjs` against the
built NAPI binding (binary newer than all styletrace sources, so current):

- `control:fixture-src: OK count=2 sample=["DirectWrapper","ReexportedWrapper"]`
  (core-shaped fixture traces fine);
- `experiment:lib-src: ERROR … missing StyleProps declaration entrypoint in
  …/packages/reference-lib` (real Neo tree fails);
- `experiment:lib-bindings: ERROR` (same for the bindings entry).

Plus the red canary from §1.3. Deletion today = silent extraction loss +
downstream breakage. Not safe.

## 4. Gap list

| Gap | Title | Characterization | Proof strategy |
| --- | --- | --- | --- |
| **#0** | Neo decl roots unresolvable (CONFIRMED) | Both legs miss Neo shapes: no `styled/types/*` style-props stem, no Neo primitive surface, and Neo's `style-props.d.ts` exports `SystemProperties` not `StyleProps` (§1.2–1.3). | Slice #1: red→green canary + probe traces lib non-empty. |
| #1 | Neo sync never calls styletrace | `resolveJsxElements` is config-only (C1); core has the traced leg (C6), Neo has none. Fixing #0 alone changes no Neo output. | New zero-config Neo case: local wrapper traced into `jsxHosts` without `jsxElements`. |
| #2 | Non-forwarding hosts in the 53-list | `ToastHost` (`ToastSystem.tsx:840-886`) exposes **no** style props at its boundary, yet is listed. Either vestigial or use-site-driven — a definition tracer can never emit it by design. | Use-site scan over `include`: which style props (if any) appear on each non-traced tag. Classify each of the 53 as traced / vestigial / genuinely-hosted. |
| #3 | Primitive aliases | `const PrimitiveJsxMarker = Div` (`matrix/primitives/src/index.tsx:7`) has no param boundary; the analyzer keys on first-param bindings/annotations. Likely missed. | Slice proof traces the primitives package; if missed, targeted engine fix + regression case. |
| #4 | Member-expression spellings | `<NS.Panel/>` ↔ concatenated `NSPanel` (NEO-SITE-16) is config-spelled today; discovery is definition-based and may never emit member spellings. | Slice proof: namespace-member fixture through trace; engine fix or documented escape-hatch carve-out. |
| #5 | Dangling roadmap doc | README ("Why atomic stations still scan every JSX tag") points at `./PLAN.md`, which does not exist; its "falls back to scanning every tag" also contradicts the fail-closed `hosts.rs:1-5` (ATM-SITE-13). | Doc fix inside slice #1: restore or re-point the plan, reconcile the fallback claim. |

MonoText-class wrappers (intersection `StyleProps & {…}` props, destructured
rest spread + direct forwarding into a primitive — verified in
`Reference/components/shared/MonoText.tsx`) match already-covered analyzer
shapes, so the bulk of the 53 should trace once #0 lands; #2–#4 are the
expected residue.

## 5. Proposed slice order (smallest-first)

1. **Slice #1 — Neo decl-root resolution (gap #0).** Add `styled/types/*`
   style-props stems, resolve the `StyleProps`/`SystemProperties` entry
   (likely `styled/types/index.d.ts` + `react/react.d.mts` candidates), and a
   Neo primitive surface for the primitives leg; fold in gap #5 doc fix.
   Proof: canary green, /tmp probe traces lib src non-empty, per-name
   traced-vs-53 diff published as evidence.
2. **Slice #2 — per-name oracle (gap #2 driver).** Classify all 53 names
   (traced / vestigial / hosted-at-use-site) with a use-site scan over lib
   `include` as the witness for non-traced names. Proof: classification table
   + scan output; mission step 1 baseline (`jsx-elements.json`,
   `compile-request.json`, `baseSystem.mjs`, component snapshots) frozen here.
3. **Slice #3 — close definition gaps (#3, #4, any #2 residue).** Engine fixes
   driven strictly by the slice-2 oracle (aliases, member spellings, …), each
   with a `tests/cases/` regression. Proof: oracle residue → zero or
   explicitly carved out with reason.
4. **Slice #4 — wire the traced leg into Neo sync (gap #1).** Call styletrace
   from Neo sync and union traced ∪ configured (mirroring core C6), keeping
   config as override. Proof: new zero-config Neo case green; NEO-SYNC-04
   unchanged (config still lands in `jsxHosts`).
5. **Slice #5 — delete `jsxElements` from lib `ui.config.ts` (acceptance).**
   Proof: zero drift across every pin in §6, esp. the distro MonoText
   assertions and the slice-2 baseline.
6. **Slice #6 (tail) — icons + matrix configs.** Same treatment for
   `reference-icons` (no in-repo consumers — external ripple only) and
   `matrix/primitives` (`PrimitiveJsxMarker`, doubles as the #3 regression).

## 6. Snapshot strategy — pins the deletion must not move

**Neo cases (behavioral goldens):** `NEO-SITE-11` (configured host extracts +
paints), `NEO-SITE-16` (member-tag concatenated hosts), `NEO-SYNC-04`
(`compile-request.json` frozen shape, `jsxHosts` = config + primitives,
`jsx-elements.json` merged), `NEO-SYNC-10` (extends merge incl. `jsxElements`).
**Neo unit:** `src/sync/sync.test.ts:80-120,179-210,243-256`
(`jsx-elements.json` content, `baseSystem.jsxElements`).

**Matrix:** `matrix/distro/tests/unit/distro.test.tsx:703-729` (sharpest pin:
upstream `MonoText` through `extends`), `matrix/primitives` suite
(`tests/e2e/primitives-contract.spec.ts`, `tests/unit/*`) for the alias host.

**Lib:** `src/components/*/__e2e__` Playwright CT (visual/presence coverage
across the 53-host components) + `pnpm capture` component snapshots; the
mission-step-1 witness baseline (slice #2) freezes
`system/jsx-elements.json`, `system/compile-request.json`,
`system/baseSystem.mjs`, and the sheet for diffing.

**Engine's own:** styletrace `src/tests/prop_resolution.rs` (gap-0 canary),
`src/tests/hermetic_roots.rs` + `tracing.rs`, `tests/cases/*` (14 cases) +
`cases.test.ts`; atomic `src/hosts.rs` tests + `extract/gating_tests.rs`;
core `system/panda/config/{run,jsx-elements,styletrace}.test.ts` (merge
semantics; trace is mocked there, so they pin the union, not discovery).
