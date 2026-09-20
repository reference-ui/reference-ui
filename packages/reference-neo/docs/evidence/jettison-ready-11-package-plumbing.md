# READY Ask 11 — Package plumbing (D6): can the runtime namer live at `@reference-ui/rust/namer`?

Date: 2026-09-20. Crew: PLUMB. Mission brief: `docs/missions/operation-jettison.md` §4/§9.
Recommendation under test: `packages/reference-rs/modules/atomic/js/namer/` →
`@reference-ui/rust/namer`. Method: read the actual code paths (no edits).
Verdict: **all three claims confirm**, each with one caveat or condition.

## (a) `sync/react.ts` can inline `@reference-ui/rust/namer` — CONFIRMED

The actual inlining path (`packages/reference-neo/src/sync/react.ts`):

1. `runtimeHeaderSource(dataPath)` (lines 30–39) emits import lines binding
   `css, recipe, registerRecipeData, registerRuntimeData` from the neo
   `runtime/index.ts` **source path** and `runtimeData, systemName` from the
   generated `styled/runtime-data.mjs` **file path**, then registration calls.
2. `publishReactBundle` (lines 47–105) writes header + `generateReactEntrySource(...)`
   to `<outDir>/tmp/react-entry.mts` (stable name per out dir — SYNC-06
   byte-stability), then `microBundle(entryPath, { format: 'esm', platform:
   'browser', external: ['react', 'react-dom/client'] })`, and writes the
   bundle to `react/react.mjs`.
3. `microBundle` (`src/lib/microbundle/microbundle.ts`) is `esbuild.build`
   with `bundle: true, write: false`; options from `build-options.ts`
   (`mainFields: ['module','main']`, `conditions: ['import','node']` by
   default, overridden only where the caller passes them — `react.ts`
   overrides platform/external, not conditions).

Adding one header line —
`import { name, NAMER_RULES_VERSION } from '@reference-ui/rust/namer'` —
flows through the same bundle: esbuild resolves the workspace link
(`node_modules/@reference-ui/rust`, verified present at root;
`packages/reference-neo/package.json:24` depends on `workspace:*`) →
`package.json` `exports` `./namer` → `dist/namer.mjs`, and inlines it, since
only `react`/`react-dom/client` are external. There is no conditions hazard:
the export target is a plain `.mjs` file, and the entry already mixes
source-`.ts` imports (neo runtime) with a generated-`.mjs` import
(runtime-data), so a second `.mjs` import is the established shape.

Precedent that sync already resolves this package at build time:
`src/sync/native.ts:69` dynamic-imports `@reference-ui/rust/atomic`.

Caveat (build order, not feasibility): `dist/namer.mjs` must exist when sync
runs — i.e. `build:js` (tsup) before `sync`. That is already true for
`dist/atomic.mjs` today, so no new ordering class; just a new entry on the
same conveyor.

Alternative path, same bundle: `css.ts` is itself bundled from source, so
`css.ts` could import `@reference-ui/rust/namer` directly instead of the
header doing it. Either way the namer text lands in `react.mjs` via the one
esbuild invocation. (Today `css.ts:6` imports only *types* from
`@reference-ui/rust/contracts` — type-only, erased — plus sibling `./plans.ts`;
the namer import would be its first runtime cross-package import. Nothing in
the bundler forbids that.)

## (b) A `./namer` export can be browser-safe with no N-API on its graph — CONFIRMED (conditional on leaf-entry discipline)

The import graph, traced from the entry candidates:

- `modules/atomic/js/index.ts` → `./runtime.js` → `../../runtime/js/native`
  (`callNativeJson` → `getVirtualNative`/`requireNative` → platform `.node`
  binary via `modules/runtime/js/loader.ts`). **The `./atomic` entry is not
  browser-safe and the namer must not route through it.**
- `modules/atomic/js/plans.ts` → `import type { … } from './types.js'`
  (**type-only**, erased at compile). Zero runtime imports.
- `modules/atomic/js/types.ts` → `import type { … } from
  '../../../contracts/types.js'` (**type-only**, erased). Zero runtime imports.

So a `modules/atomic/js/namer/` tree that imports only namer siblings plus
`type` imports from `../types.js` / `@reference-ui/rust/contracts` has **no
runtime import graph at all** — nothing to be unsafe. `browser-safe` here is
structural (no `node:` builtins, no `runtime/js/*`, no `./runtime.js`,
no `../index.js`), not a review judgment. The Slice 2 gate should assert it
mechanically (e.g. an esbuild `platform: 'browser'` bundle of the namer entry
with zero warnings, or a lint rule banning value-imports outside `namer/`).

Supporting precedent: `tasty` keeps native out of its index —
`tasty/js/index.ts` has no native import (native access lives in
`tasty/js/runtime.ts`, off the index graph), which is what makes
`tasty/browser.ts` (re-exporting `./index`) a viable browser entry. The namer
should go one step further: a dedicated leaf entry
(`modules/atomic/js/namer/index.ts` → `dist/namer.mjs`), never a re-export
through `atomic/js/index.ts`, so a future `index.ts` change cannot silently
drag the loader into the browser bundle.

Conditions for the "browser-safe" claim to stay true at GO:

1. tsup entry maps the leaf file, not the index (see file list).
2. `target` stays honest: tsup uses `target: 'node18'`; the namer sources
   must avoid node-only APIs regardless, since the file also ships to the
   browser via react.mjs. (Pure string/number/array code — expected to hold
   trivially.)
3. The dts entrypoint tool gains a `namer.d.ts` stub (see file list) so
   `import … from '@reference-ui/rust/namer'` typechecks downstream.

## (c) `pnpm agentrs v atomic` picks up `js/namer/**/*.test.ts` unchanged — CONFIRMED

- `modules/atomic/vitest.config.ts` (lines 9–15): project `name: 'atomic'`,
  `include: ['tests/**/*.test.ts', 'js/**/*.test.ts']`. A
  `js/namer/*.test.ts` file matches the second glob with **no config change**.
- Root `packages/reference-rs/vitest.config.ts`: `projects:
  ['modules/*/vitest.config.ts', 'contracts/vitest.config.ts']` — `v atomic`
  selects the atomic project, which carries that include.
- Honesty note: **zero `js/**/*.test.ts` files exist under `modules/atomic/js`
  today** (verified by find), so the glob is proven by config in atomic but
  not yet by a live file there. However the identical include block in
  `modules/tasty/vitest.config.ts` serves **nine live js test files**
  (`tasty/js/index.test.ts`, `build.test.ts`, `utilities.test.ts`,
  `internal/object-projection.test.ts`, …), so the pattern is proven in-repo
  with the same runner (`pnpm agentrs v <module>`), the same root workspace
  file, and the same glob spelling. `ATM-SEAM-08`'s spec files under
  `js/namer/` (or `tests/`, which also matches) will be picked up; the brief's
  "Precedent: `atomic/js/plans.ts` + `vitest.config.ts`" is accurate as far as
  it goes — `plans.ts` proves the *location*, tasty proves the *pickup*.

## Files that would change at GO for the D6 home (no changes made)

Named without touching — the complete GO surface for
`modules/atomic/js/namer/` → `@reference-ui/rust/namer`:

**reference-rs packaging (the export itself):**

1. `packages/reference-rs/package.json` — add `./namer` to `exports`
   (`types: ./dist/namer.d.ts`, `import: ./dist/namer.mjs`) and
   `dist/namer.{d.ts,mjs}` to `files`.
2. `packages/reference-rs/tsup.config.ts` — add `namer:
   'modules/atomic/js/namer/index.ts'` to `entry`.
3. `packages/reference-rs/modules/runtime/js/tools/create-dts-entrypoints.mjs`
   — add `{ file: 'namer.d.ts', target: './modules/atomic/js/namer/index' }`
   (else the types subpath 404s downstream).
4. `packages/reference-rs/contracts/types.ts` (+ fixtures
   `contracts/fixtures/{native-runtime-artifact,compile-result,portable-base-system}.json`
   + `contracts.test.ts`) — `NamerTables`, `LowerStep`, v2 artifact shapes
   (brief §5; ask 8 fixes the exact shape).

**The runtime namer + its tests (new files):**

5. `packages/reference-rs/modules/atomic/js/namer/{lexical,lower,shorthand,value,when,shape,slot,index,miss}.ts`
   (brief §9/Slice 2 list + `miss.ts` from Slice 3; each ≤ 365 lines, header
   naming its compiler fn + golden).
6. `packages/reference-rs/modules/atomic/js/namer/*.test.ts` — `ATM-SEAM-08`
   blocks (one per `tests/namer-goldens/*.json`), picked up per (c).
   (Alternative home the brief allows: `tests/cases/ATM-SEAM-08/`; either
   matches the include.)

**Rust side feeding it (Slice 1, for completeness of the D6 surface):**

7. `modules/atomic/src/runtime/tables.rs` (new), `src/resolve/lexical.rs`
   (new), `Cargo.toml` (`preserve_order`), golden writer +
   `tests/namer-goldens/*.json`, `namer_goldens_are_fresh` guard.

**Neo consuming it (Slice 3):**

8. `packages/reference-neo/src/sync/react.ts` — header gains the namer import
   (or nothing, if the import lives in `css.ts` — one of the two changes).
9. `packages/reference-neo/src/runtime/css/css.ts` — `collectEntries` feeds
   `name()`; delete `createStylePlanIndex`/`resolveScoredDeclarations`/
   `findStylePlanMisses`/`serializeLookupKey` from the runtime path;
   `registerRuntimeData` requires `schemaVersion: 2` + rules-version match.
10. `packages/reference-neo/src/runtime/css/plans.ts` (+ `css.test.ts`,
    `eviction.test.ts`, `plans.test.ts` fixtures) — constructed pairs in,
    index out; `schemaVersion: 2` fixtures.
11. `NEO-NAMER-01..03` cases + `tests/cases/namer/{SPEC,TESTS}.md` (Slice 0
    shells, Slice 2–3 green).

**Prose pins (Slice 4):**

12. Atomic `SPEC.md` (FORBID-03 wording, GHOST-01 note, GHOST-02 retitle,
    `ATM-SEAM-06..08` + `ATM-NAME-08` entries), `src/runtime/README.md`
    (permanent home of both tables), `docs/ATOMIC.md`,
    `packages/reference-neo/docs/DOMAIN.md` (+9 Vocabulary entries),
    `packages/reference-neo/PLAN.md` D4/D5 rows, `docs/missions/README.md`.

## D6 recommendation

The plumbing supports the recommended home. `sync/react.ts` inlines by
construction (one header line, same esbuild bundle); browser-safety is
structural given a leaf entry that never touches `atomic/js/index.ts` or
`runtime/js/*` (assert it mechanically at GO); vitest pickup needs no config
change (tasty proves the glob). The only new-failure-mode to pin at GO: a
test that fails if `dist/namer.mjs` (or its source graph) gains a
`runtime/js` / `node:` import — the tasty `browser.ts` shape shows the
discipline, but nothing enforces it today.
