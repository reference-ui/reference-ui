# Neo Voyage Plan, Part Two — the host (BUILD SPEC)

> Landed record (Voyage One). The living plan is [`../PLAN.md`](../../PLAN.md);
> this file is history, not orders.

Status: build spec. Turns the [`PLAN-host.md`](PLAN-host.md) seed into
ordered steps for the overnight host volume. Entry condition met:
Part One (harness) is committed (`94b9574b`).

Overnight scope (from the seed, unchanged): core API plus the
`.reference-ui/` folder structure, then primitives. Explicitly not
tonight: MCP, tasty, anything beyond the minimal surface. The night
ends when `css()` cases pass against a freshly synced folder.

## Absolutes (restated, non-negotiable)

- Neo never imports from `reference-core` or `reference-lib`. The gate
  fails such imports. Solved implementations are copied near-verbatim
  into Neo-owned modules, and their unit tests come along.
- No thread workers (no Piscina pool; serial pipeline: fragments, one
  native compile, publish).
- No `virtual-rs`, no Liquid templates (primitives generate natively).
- React 19 only. Headless only (headed inspection only on explicit
  human request).

## Green-step convention

Every step ends green, defined as all three clean:

1. `pnpm vitest run src` (unit; added in Step 0),
2. `pnpm agentneo run` (full case catalog, no regressions),
3. `pnpm agentneo q` (gate, including the boundary rule).

Proof comes in two shapes, and the step states which. Node-only
modules (config, fragments, sync plumbing) are proven by colocated
unit tests plus a regression-clean full `run` — writing a browser
case for config parsing would be theater. Browser-visible behavior
(runtime output, generated stylesheets, primitives) gets new
`NEO-<GROUP>-<nn>` cases: small world, one assertion family per
case, computed styles plus settled snapshots where rendering
matters. `TESTING.md` already blesses both shapes.

One harness touch is allowed in Step 2 (the per-case sync hook);
everything else lands in `src/`. Harness files otherwise stay
untouched all night.

## Answered open questions

### 1. Smallest step order that keeps every step green?

The seed's order (base API first, fragments+sync fourth) cannot stay
green: `css()` cases must run against a freshly synced folder, so
sync must exist before the first runtime case. Reorder to
dependency order — solved, copyable, Rust-free work first, the Rust
handshake isolated in exactly one step:

0. Runner + config + paths (unit-proven, no Rust, no browser).
1. Fragments module copy (unit-proven, no Rust, no browser).
2. Sync skeleton + Rust handshake (first case→sync→browser loop;
   the go/no-go gate for everything after).
3. Runtime `css()` on plain HTML (the night's exit criterion).
4. Recipes / `cva()` (stretch).
5. Edge cases: pseudo/hover props, radii (stretch).
6. Primitives, generated natively (stretch).

Steps 0–3 are the must; 4–6 run in order only if the night allows.
Each step's section below is the contract: what lands, what proves
it, what stays untouched.

### 2. Generated folder name and placement rules?

Keep the name and the UX: `.reference-ui/` beside `ui.config`
(or wherever configured — the configured-outdir rule survives via
the copied `getOutDirPath`). Inside, the minimal version of
today's shape:

- `system/` — `baseSystem.mjs` (+ `.d.mts`),
  `evaluated-system.json` (the frozen spec dump, kept for
  debuggability), `jsx-elements.json` (styletrace input).
- `styled/` — `styles.css`, `global.css`, `css/`, `recipes/`,
  `types/` (shape mined from
  `packages/reference-lib/.reference-ui/styled/`; feature parity,
  not identical bytes).
- `react/` — the generated React entry (lands with Step 6; the
  folder exists from Step 2).
- `node_modules/` symlinks linking `@reference-ui/system` and
  friends, as today.

Dropped from the folder: `virtual/`, `panda.config.ts`, `tmp/`
(sync scratch moves to the OS temp dir), `book-perf.jsonl`.
`compile-request.json` stays out unless debugging needs it;
`font-registry.json` defers to the typegen leg.

### 3. What of core's config surface survives?

From `ReferenceUIConfig` (`packages/reference-core/src/config/types.ts`):

- Survive: `name` (required, unchanged — CSS layer + `data-layer`),
  `include` (same globs, new meaning: fragment scan + atomic scan
  roots; no `codegen` copy), `extends` (`BaseSystem[]`, unchanged —
  the fragments copy already threads upstream fragments),
  `jsxElements` (styletrace needs it), `normalizeCss` (default
  true, reset layer), `debug`. `defineConfig` stays with the same
  call shape so author `ui.config` files do not change.
- Defer: `strict` (a typegen-time concern; revisit with the type
  unions), `layers` (downstream composition).
- Drop: `mcp`, `useReferenceLibrary` / `use_reference_library`,
  `useReferenceIcons` / `use_reference_icons` (MCP/library are
  explicitly not tonight), `skipTypescript` (no tsup in Neo; the
  flag is meaningless).

Validation keeps the same error style (copied `validate.ts` trimmed
to the surviving fields); unknown-field behavior stays as core does
it today.

### 4. tsc/tsgo story for the host's own typecheck?

There is no separate story to build. The workspace already types
against `typescript@~7.0.2` (native preview — that *is* tsgo), and
the gate's `tsc --noEmit --strict` over the package is the fast
path, not a ritual. So: the host's own typecheck is `agentneo q`,
unchanged. No 5.x compile anywhere in Neo. Generated files keep
the gate's existing `@generated`/`.gen.` length-rule skip.
Declaration bundling (tsup/tsdown/none) stays deferred with the
packager decision — nothing ships tonight.

## Step 0 — Runner, config, paths

Lands in `src/`:

- `src/config/` — `types.ts` (trimmed `ReferenceUIConfig` per Q3 +
  `defineConfig`), `load.ts`, `validate.ts`, each copied from
  `packages/reference-core/src/config/` and cut to the surviving
  surface, with their unit tests.
- `src/lib/paths/` — `out-dir.ts` (+ `core-package-dir.ts` only if
  the copy needs it) copied from core; `virtual-dir.ts` and the
  global registry do NOT come across.
- Package: `vitest` devDep (copied core tests import `vitest`;
  this keeps the copies near-verbatim) plus a minimal
  `vitest.config.ts` scoped to `src/`.

Proves it: copied unit tests pass under `vitest run src`; full
`agentneo run` regression-clean (SMOKE + playtests, no new case);
`agentneo q` clean.

Stays untouched: `tests/shared/` (harness), `tests/cases/`,
everything about fragments/sync/runtime/primitives.

## Step 1 — Fragments module

Lands in `src/`:

- `src/fragments/` — the author-call collectors (`tokens()`,
  `font()`, `keyframes()`, `globalCss()`, box patterns) copied from
  `packages/reference-core/src/system/api/`, plus the scan /
  bundle / evaluate-once runner copied from
  `system/base/fragments/` and the minimal seam of
  `packages/reference-core/src/lib/fragments/` it stands on. The
  module emits an `EvaluatedSystemSpec`-shaped value typed from
  `reference-rs/contracts` (import the type, never redefine it).
- All copied unit tests alongside (`tokens.test.ts`,
  `keyframes.test.ts`, `font.test.ts`, `patterns.test.ts`,
  `fragments/index.test.ts`, trimmed only where they touch
  Panda-shaped seams that do not come across).

Proves it: `vitest run src/fragments` green; full `agentneo run`
regression-clean (no new case — nothing browser-visible yet);
`agentneo q` clean, boundary rule holding on the copies.

Stays untouched: `tests/shared/`, `tests/cases/`, `src/config/`,
`src/lib/paths/`, sync/runtime/primitives (do not exist yet).

## Step 2 — Sync skeleton + Rust handshake (go/no-go)

Lands in `src/`:

- `src/sync/` — `sync(cwd)`: resolve config + outdir, clean the
  stale `.reference-ui/` first, run fragments, call
  `@reference-ui/rust` `compile()` with the spec + source root +
  jsx hosts, publish the minimal folder per Q2 (system + styled +
  empty react + symlinks). Serial by construction — no workers.
- One harness touch: `tests/shared/runner.ts` runs `sync(worldDir)`
  before serving when the case opts in (`case.json` flag), so the
  loop case → sync → generated folder → browser is real from this
  step on. Nothing else in the harness changes.

Proves it (world + specs): new case `NEO-SYNC-01`. World: a
`ui.config` (`name`, `include`) plus one author file calling
`tokens()` with a single test token, and an `index.html` linking
`.reference-ui/styled/styles.css`. Specs: the folder shape exists
after sync (asserted node-side in the spec setup, not the
browser); the browser asserts a computed style driven by the
generated sheet (e.g. a `:root` var paints the expected color).
If `compile()` is not callable on the build machine this step
stays red and blocks — surface it here, not in Step 3. No
throwing-stub fallback, no template CSS: a fake green here poisons
every later case.

Stays untouched: `src/config/`, `src/fragments/`, `src/lib/paths/`
(apart from fixes the hookup exposes), runtime, recipes,
primitives, existing cases.

## Step 3 — Runtime `css()` on plain HTML (night's exit)

Lands in `src/`:

- `src/runtime/css/` — authored `css()` reading the maps Rust
  named (mined from `system/runtime/css/` + the generated
  `styled/css/` shape; `lowerResponsiveStyles.ts` copied
  near-verbatim with its tests), plus `src/runtime/index.ts`
  re-exporting the public surface. No React, no primitives.

Proves it (world + specs): `NEO-CSS-01` — world is plain HTML +
a synced folder; spec asserts `css({ ... })` classes paint the
expected computed styles and no ghost classes leak into the
stylesheet. `NEO-CSS-02` — responsive/container-query lowering
parity: the lowered shape matches what build-time lowering
produced (same assertion family as core's lowering tests, now
end to end in the browser). Both cases run sync fresh (Step 2
hook) — the night ends when these two pass against a freshly
synced folder.

Stays untouched: `src/config/`, `src/fragments/`, `src/sync/`
(hookup fixes only), recipes, primitives, existing cases.

## Step 4 — Recipes / `cva()` (stretch)

Lands in `src/`:

- `src/runtime/recipe/` — `customCvaFn.ts` seam copied from
  `system/runtime/recipe/` (same responsive-lowering wrapper),
  re-exported from `src/runtime/index.ts`, with its unit tests.

Proves it (world + specs): `NEO-RECIPE-01` — world defines one
recipe with base + two variants + one compound variant; specs
assert each variant paints its computed styles and the compound
fires only when both conditions hold. Synced fresh, as all
runtime cases are from here on.

Stays untouched: `src/config/`, `src/fragments/`, `src/sync/`,
`src/runtime/css/`, primitives, existing cases.

## Step 5 — Edge cases (stretch)

Lands in `src/`: fixes only, inside `src/runtime/` and (if the
evidence points down) the sync→atomic fixture — no new modules
unless a feature family genuinely needs one.

Proves it (world + specs): one case per family — `NEO-EDGE-01`
(pseudo/hover props resolve: `:hover` / `[data-hover]` paint),
`NEO-EDGE-02` (border radii resolve against radius tokens).
Each spec asserts computed styles in the exercised state, not
stylesheet text grep.

Stays untouched: module layout everywhere; primitives;
existing cases.

## Step 6 — Primitives, generated natively (stretch)

Lands in `src/`:

- `src/primitives/` — `tags.ts` (tag set copied), `generate/`
  (native generator: template literals / string building over
  the tag set + typegen unions — no Liquid, no
  `primitives.liquid`), the runtime split (StyleProps vs DOM
  props, `css()` call, `data-layer` + color-mode stamping mined
  from core's `primitives/shared/`), React 19 only.
- `src/sync/` grows the `react/` publish target (full shape, not
  the Step 2 placeholder).

Proves it (world + specs): `NEO-PRIM-01` — world renders one
primitive (`div`) with style props + a DOM prop passthrough;
specs assert StyleProps paint, DOM props land on the element,
and `data-layer` carries the configured system name. Typegen
unions compile under the Step 0 story (`q` covers it).

Stays untouched: `src/config/`, `src/fragments/`,
`src/runtime/`, existing cases. The generator never emits a
`Box` / `Flex` / `Grid` (map rule).

## Sources mined (read-only, per the seed)

- `packages/reference-core/src/system/` — API surface: `api/`
  (collectors), `base/fragments/` + `base/create.ts` (runner),
  `runtime/css/` + `runtime/recipe/` (css/cva seams),
  `primitives/` (`tags.ts`, shared runtime; `generate/` read for
  behavior only — Liquid stays behind).
- `packages/reference-lib/.reference-ui/styled/{styles.css,global.css}`
  — output shape spec (27k-line layered sheet; parity of features,
  not bytes).
- `packages/reference-core/src/system/styled/` — typegen shape
  reference (`css/`, `recipes/`, `types/`, …).
- `packages/reference-rs/modules/map.html` — the cut: atomic emits
  the stylesheet, typegen the types, Neo the runtime above.
- `packages/reference-rs/contracts/types.ts` — frozen wire format
  (`EvaluatedSystemSpec`, `NativeRuntimeArtifact`); imported, never
  redefined. `@reference-ui/rust` (napi binding) is the compile()
  seam.

## Exit checklist

- [x] Steps 0–3 green (`vitest run src` + `agentneo run` + `agentneo q`).
- [x] `NEO-SYNC-01`, `NEO-CSS-01`, `NEO-CSS-02` pass against freshly
  synced folders (sync hook runs clean-first every run).
- [x] No imports from core/lib paths (gate proves it).
- [x] No workers, no virtual, no Liquid, React 19, headless.
- [x] Stretch steps (4–6) either green in order or explicitly
  unstarted — no half-landed modules.
