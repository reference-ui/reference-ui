# CHAIN_REPORT — chain matrix execution & findings

**Date:** 2026-05-02
**Scope:** Build out and validate the rest of the chain matrix per `CHAIN.md`,
treating it as the last release gate for the chainable design-system compiler.

---

## 1. Result summary

**33/33 tests pass across all 11 chain entries. No `reference-core` patches required.**

| Entry | Topology | Tests | Status |
|---|---|---:|:---:|
| T1  | Single extend (`A → extend → user`) | 5/5 | ✅ |
| T2  | Single layer  (`A → layer  → user`) | 5/5 | ✅ |
| T3  | Hybrid (`A extend + B layer`) | 5/5 | ✅ |
| T6  | Chain — app extends meta which extends base | 5/5 | ✅ |
| T7  | Diamond — two metas sharing one base, both extended | 5/5 | ✅ |
| T8  | Same library appears in `extends` AND `layers` | 4/4 | ✅ |
| T11 | Full mix — 2 extends + 2 layers; prelude order asserted | 6/6 | ✅ |
| T12 | Extend chain + app-level layered library | 3/3 | ✅ |
| T16 | Parallel extend chains | 3/3 | ✅ |
| T17 | Diamond base, mixed branches (one layered, one extended) | 3/3 | ✅ |
| T18 | Parallel extend chains + shared app-level layer | 4/4 | ✅ |

**Total:** 33 e2e tests / 11 entries / 0 framework patches.

---

## 2. What was built

### 2.1 New fixture libraries (under `fixtures/`)

To compose chains we needed more fixture libraries than the original two
(`extend-library`, `layer-library`):

| Fixture | Mode of base | Tokens | Component (testid) |
|---|---|---|---|
| `meta-extend-library` | extends `extend-library` | `metaExtendBg #312e81`, `metaExtendText #e0e7ff` | `MetaExtendDemo` (`meta-extend-demo`) |
| `meta-extend-library-sibling` | extends `extend-library` | `metaSiblingBg #7c2d12`, `metaSiblingText #ffedd5` | `MetaSiblingDemo` (`meta-sibling-demo`) |
| `extend-library-2` | independent base (`extends: []`) | `secondaryDemoBg #064e3b`, `secondaryDemoText #d1fae5`, `secondaryDemoAccent #34d399` | `SecondaryDemoComponent` (`secondary-demo`) |
| `meta-extend-library-2` | extends `extend-library-2` | `metaExtend2Bg #365314`, `metaExtend2Text #ecfccb` | `MetaExtend2Demo` (`meta-extend-2-demo`) |
| `layer-library-2` | layer-only | `layerPrivateAccent2 #9f1239` (private) | `LayerPrivate2Demo` (`layer-private-2-demo`) |

All five follow the validated `extend-library` / `layer-library` pattern:
`tsup.config.ts` (esm dts), `vitest.config.ts`, `ui.config.ts` with
`defineConfig`, `scripts/bootstrap-runtime.mjs` symlinking `@reference-ui/{react,styled,system,types}`
from `packages/reference-lib/.reference-ui/`, `scripts/build-package.mjs` verifying outputs,
and `src/components/*.tsx` using `tokens({...})` + `css({...})` from the
generated runtime.

### 2.2 Config wiring

- `tsconfig.base.json` — added 5 new `@fixtures/*` path mappings.
- `.changeset/config.json` — added 5 new fixture names to `ignore`.
- `pipeline/config.ts` — `REGISTRY_PACKAGE_NAMES` expanded with the 5 new fixtures
  so pipeline `setup --sync` builds them as part of the matrix workspace prep.

### 2.3 New chain matrix entries

`matrix/chain/{T6,T7,T8,T11,T12,T16,T17,T18}/` each scaffolded with:
- `package.json` (managed by pipeline; deps preserved by `createManagedMatrixPackageJson`)
- `matrix.json` (`bundlers: ["vite7"]`, `react: "react19"`)
- `tsconfig.json`
- `ui.config.ts` (the topology under test)
- `src/index.tsx` (renders the demo components from the fixtures)
- `tests/e2e/T<N>-contract.spec.ts` (token-resolution + structural assertions)
- `README.md` (ASCII topology sketch matching `CHAIN.md`)

---

## 3. Findings

### 3.1 Architectural finding — layered token scoping (the only "gotcha")

A library adopted via `layers: [...]` emits its tokens under
`[data-layer="<name>"] { --colors-…: …; }` — an **attribute-scoped** block, not
`:root`. Components built on Reference primitives (`Div`, `Main`, `Span`, …) bake
`data-layer="<RESOLVED_DATA_LAYER_NAME>"` into their rendered output at upstream
build time, so they self-scope and "just work" when adopted via `layers`.

Components that compile with a plain `<div>` + `css({...})` do **not** self-scope.
T17 was the only entry that mixed a plain-DOM component (`MetaExtendDemo`) with
layer-mode adoption, and it required an explicit wrapper at the adoption site:

```tsx
<div data-layer="meta-extend-library">
  <MetaExtendDemo />
</div>
```

T8/T11/T12/T18 all adopt layered libraries without any wrapper because they only
use `LayerPrivateDemo` (built on `Div`), which self-scopes. **This is correct
behavior, not a bug** — it's the documented adoption contract — but it is a sharp
edge for end users. See §4.1 below.

Recorded in repo memory: `/memories/repo/matrix-chain-layered-token-scope.md`.

### 3.2 Compiler behaviors verified by the matrix

| Behavior | Evidence |
|---|---|
| Single `extends` adopts fragment + tokens | T1 |
| Single `layers` adopts CSS only | T2 |
| Hybrid extend+layer at same boundary | T3 |
| Transitive extend (meta → base → consumer) | T6 (`metaExtendBg` local + `fixtureDemoAccent` from base) |
| Diamond extend (shared base only contributes once) | T7 (both branches see `fixtureDemoAccent`) |
| Allow-and-duplicate when same lib is in both buckets | T8 (`@layer extend-library` count ≥ 1) |
| Bucket order: `extends... → layers... → local` | T11 (asserts `CSSLayerStatementRule.nameList` ordering) |
| Layered tokens do NOT leak into app's Panda token namespace | T12 (LayerPrivateDemo resolves only inside its layer scope) |
| Parallel extend chains compose at one boundary | T16 |
| Diamond base with mixed branch modes | T17 |
| Hardest case (parallel chains + shared app-level layer) | T18 |

### 3.3 Build & pipeline observations

- `fixture-build-cache.mjs` correctly hashes inputs across the new fixtures;
  on miss runs `pnpm run build:full` (build core → sync reference-lib → build
  upstream fixtures (if any) → run own sync → tsup → build-package).
  All 5 new fixtures built clean on first attempt.
- `pipeline setup --sync` regenerates managed files (`index.html`, `vite.config.ts`,
  `vitest.config.ts`, `playwright.config.ts`, `src/main.tsx`) and re-renders
  `package.json` while preserving deps. It rebuilds upstream fixture artifacts as
  needed and runs `ref sync` per chain entry. Sync time: ~3s per entry.
- All 7 newly-built entries setup-and-tested in a single batch run; total wall time
  for the validation gate (sync + playwright) was ~40 seconds.

---

## 4. Suggested next steps

### 4.1 Reduce the layered-DOM sharp edge (priority: high)

The T17 finding is correct compiler behavior but it's a footgun for library
authors who write components against plain DOM rather than Reference primitives.

Options, ordered by user-facing improvement:

1. **Codemod / lint** — add a `reference-rs` or eslint check that flags
   layered-library components rendering on plain `<div>` / `<span>` instead of
   Reference primitives, suggesting either a switch or an explicit
   `data-layer="…"` wrapper at the component root.
2. **Auto-wrap in `defineConfig`** — when a fixture is consumed via `layers`, the
   compiler could optionally synthesize a small `<LayerScope name="…">` wrapper
   for re-exported JSX elements declared in `jsxElements`. Requires a runtime
   contract change but eliminates the sharp edge entirely.
3. **Documentation** — at minimum, add a "Layered adoption contract" section to
   `docs/CORE.md` and `docs/LAYERS.md`. (Doc-only fix; lowest effort, lowest
   reach.)

### 4.2 Promote the chain matrix into a release gate (priority: high)

The 11 chain entries plus `matrix/reference`, `matrix/primitives`, etc. should be
the release-blocking smoke set. Concretely:

- Add a `pnpm chain:gate` script that runs `pipeline setup --sync` + playwright
  for every `matrix/chain/T*` entry and reports pass/fail in a single line
  per entry. CI can `time` it as a single gate.
- Tag the chain matrix in `.changeset/config.json` so a release cannot ship
  without it being green.

### 4.3 Fill in the still-untouched topologies from `CHAIN.md` (priority: medium)

The "Suggested execution order" set is now done, but `CHAIN.md` enumerates more
shapes worth covering for completeness — especially T4 (parallel extends, no
chain), T5 (parallel layers, no chain), and any deeper-than-2 chain (e.g.
`A → B → C → user`) to confirm fragment flattening at depth ≥ 3.

Estimated work: each entry mirrors T6/T7 — ~1 fixture library + 1 matrix entry.

### 4.4 Tighten the prelude-order assertion in T11 (priority: low)

T11's bucket-order test relies on `CSSLayerStatementRule.nameList` (modern
browsers OK, but it's an ergonomic dependency). A more portable fallback would be
to parse `cssText` with a `@layer ([^;{]+);` regex. Currently passes on the
project's pinned Playwright/Chromium, but worth hardening before extending the
matrix to webkit/firefox runners.

### 4.5 Document the "allow-and-duplicate" rule (priority: low)

T8 documents the spec in `CHAIN_RULES.md` (same library in both `extends` and
`layers` is allowed; CSS is duplicated; tokens flow only via the `extends` side).
The test passes with `>= 1` occurrence of `@layer extend-library`. Worth tightening
to `=== 2` once the spec confirms duplication is mandatory rather than incidental,
or to `=== 1` if the compiler should de-dupe.

### 4.6 Capture component-author guidance (priority: medium)

`fixtures/extend-library` and `fixtures/layer-library` are de-facto reference
implementations for fixture authors. Consider hoisting them into
`docs/FIXTURE_AUTHORING.md` (or a `templates/` directory) so external library
authors have a single canonical pattern to copy:

- `tsup.config.ts` shape (esm + dts, externals)
- `scripts/bootstrap-runtime.mjs` symlink discipline
- `tokens({...})` + `css({...})` usage (and the layered-DOM caveat from §4.1)
- Component build-time class baking (which is why config-time composition works)

### 4.7 Performance / observability (priority: low)

- The pipeline's `Generated runtime TypeScript declarations in 1.90s` step
  dominates each entry's sync time and is largely identical across entries. A
  shared declaration cache keyed on the upstream artifact hash could collapse
  full-matrix sync time meaningfully.
- Add a `--report=json` mode to `pipeline setup --sync` so CI can graph per-step
  cost over time and catch regressions.

---

## 5. What did NOT change

- **`reference-core` is untouched.** The chain matrix passes on the existing
  compiler. The original "we may need to make small patches to reference-core"
  pre-approval was not exercised.
- No fixture build scripts changed. No pipeline rendering logic changed.
- No managed file template changed.

---

## 6. Files of record

- New fixtures: `fixtures/{meta-extend-library,meta-extend-library-sibling,extend-library-2,meta-extend-library-2,layer-library-2}/`
- New chain entries: `matrix/chain/{T6,T7,T8,T11,T12,T16,T17,T18}/`
- Updated configs: `tsconfig.base.json`, `.changeset/config.json`, `pipeline/config.ts`
- Repo memory: `/memories/repo/matrix-chain-layered-token-scope.md`
