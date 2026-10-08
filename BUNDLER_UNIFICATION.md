# Bundler Unification

Every shippable package in this repo is bundled the same way: **raw esbuild
behind a small per-package node script**, with TypeScript declarations emitted
by `tsc`. No tsup, no rollup. This doc is the map for getting there. It exists
so that anyone opening the repo after the reference-system PR can see the
packaging story is deliberate, not accidental.

Status: planned, post-PR voyage work. Ledger: `FINALIZE.md` F-1 (RULED
esbuild; Arc A unblocked since WAVE5 landed 2026-10-08). This doc carries the
full scope, including icons (ruled in by HQ 2026-10-08).

## Why

- `tsup` is unmaintained (F-1 owner quote) and sits on the critical build
  path of the flagship package. Its original draw (cheaper than `tsc`)
  never applied here anyway:
  every package already runs `tsc -p tsconfig.build.json` for declarations
  (`dts: false` everywhere), and TS 7 native keeps getting cheaper.
- Three bundlers for one job (ESM output + `tsc` types) is sprawl with no
  technical basis. Lib's tsup config is already just esbuild options; mcp's
  tsup plugins are already native esbuild plugins; icons' rollup run shells
  out to esbuild for the actual transform.
- Unification also dissolves `FINALIZE.md` F-2: tsup's `clean: true` wipes
  `dist/` before rewriting it, so a lib rebuild during a live dev server
  briefly 404s. A staged esbuild write (assemble aside, atomic rename in)
  removes the window everywhere at once.

## Current state (census, 2026-10-08)

tsup (12 configs):

- `packages/reference-lib/tsup.config.ts` — ESM-only, no dts/splitting/
  sourcemap; entries `index` + `theme/index`; externals react, react-dom,
  `@reference-ui/react`, `@reference-ui/styled/*`, `./tasty/runtime.js`;
  `noExternal: ['gsap']`.
- `packages/reference-mcp/tsup.config.ts` — 4 entries incl. a neo-author
  entry; two esbuild plugins passed through (`neo-alias`, `icons-index-text`).
- `packages/reference-rs/tsup.config.ts` — JS seam bundles.
- `packages/reference-legacy/tsup.config.ts` — inert (workspace-excluded).
- 8 × `matrix/fixtures/*/tsup.config.ts` — all copy lib's build line
  verbatim (`tsup && tsc -p tsconfig.build.json && build-package.mjs`).

rollup (1 config):

- `packages/reference-icons/rollup.config.mjs` — 3,861 entries (index +
  createIcon + constants + 3,858 generated), `preserveModules` mirrored
  from `src`, externals + a resolve-then-rewrite dance for
  `@material-symbols-svg/react` deep pnpm paths, transform via
  `rollup-plugin-esbuild` (automatic JSX, es2020).

raw esbuild (the model):

- `packages/reference-neo/tools/build-bin.mjs` (148 lines) — the "simple
  thing": direct `esbuild.build()` call, no wrapper framework.

Driver shape (the model): `packages/reference-icons/scripts/build.mjs` —
generate → `ensure-dist` → `ref sync` → bundle → `tsc` → materialize →
required-files tripwire. Every package's build script follows this shape;
only the bundle step's engine changes.

## Target state

- One engine: `esbuild` (`^0.28`, already in-tree).
- One shape per package: `scripts/build.mjs` orchestrating
  generate → sync → `build-bundle.mjs` (raw esbuild, ~70 lines) → `tsc`
  declarations → materialize → required-files check.
- One shared builder for lib + the 8 matrix fixtures (they share the recipe
  today; they must not become 9 copies of a new script).
- Types stay `tsc`-emitted. No `dts` bundling step anywhere.
- `reference-legacy` stays inert (workspace-excluded) — explicitly not migrated.

## Key decisions

- **esbuild, not rollup, not tsc-only** (Oracle `TSUP.oracle`, 2026-10-08).
  Rollup is out on perf; tsc-only is out (path aliases need the bundle step,
  `gsap` inlining, the multi-file dist contract).
- **Icons migrates too** (HQ, 2026-10-08). Rollup's only unique feature in
  use is `preserveModules`, which esbuild covers via multi-entry +
  `outbase`: esbuild replicates entry-point directory structure into outdir
  from the lowest common ancestor, customizable via `outbase`
  ([esbuild API docs](https://esbuild.github.io/api/#outbase)). Nothing
  depends on rollup's exact layout: the exports map exposes only the barrel,
  there are zero deep `icons/generated` imports, and the barrel's relative
  re-exports keep resolving under esbuild's layout. The `paths()` rewrite
  collapses into mark-external-up-front (never resolve = nothing to rewrite).
- **Externals are computed from `package.json`** (bare and `/*` subpath
  forms), per package. The trap is silently inlining `zustand` and
  `@reference-ui/icons` — every arc's proof bar includes a dist-content
  check against this.
- **Staged writes everywhere** (assemble aside, atomic rename in), closing F-2.

## Arcs

### Arc A — lib + the 8 matrix fixtures (first)

Lib is the flagship and the recipe 8 fixtures copy, so it goes first and
carries the shared builder with it.

Scope: `packages/reference-lib`, `matrix/fixtures/*` (8), the new shared
builder module they all import.

Steps:

1. Write the shared `build-bundle.mjs` (raw esbuild): entries `index` +
   `theme/index`, ESM, `.mjs` out-extension, node18 target, externals
   computed from each consumer's `package.json`, `gsap` bundled.
2. Repoint lib's build line at it; keep the 2-entry fat-file dist contract
   (`index.mjs` ~2.1 MB + `theme/index.mjs` ~77 KB).
3. Repoint all 8 fixtures at the shared builder; delete their tsup configs.
4. Update the tsup-coupled helpers: `materialize-runtime.mjs`
   `bundleRewrites`, `build-package.mjs` dist-shape assumptions,
   `check-dist-fresh.mjs` tsup references.
5. Remove `tsup` from lib's and the fixtures' dependencies.

Validation:

- Byte-compare `dist/` before/after (identical, or byte-explained diff).
- `dist/index.mjs` imports none of `zustand`, `@reference-ui/icons`
  (the inlining trap — assert, don't eyeball).
- Consumer smoke green (it asserts the packed `dist`).
- All 8 fixture builds green; matrix package covering the touched surface
  re-run per `test-core` (`pnpm agent`).
- Live-server rebuild shows zero 404 windows (F-2 bar).

### Arc B — icons (after A)

Scope: `packages/reference-icons` (rollup config + plugins deleted).

Steps:

1. Replace the rollup step in `scripts/build.mjs` with an esbuild
   multi-entry build: all current entries, `outbase: 'src'`,
   `splitting` on, automatic JSX, es2020 target, externals incl. the
   `@material-symbols-svg/react` subpath regex (no resolve-then-rewrite).
2. Keep the rest of `build.mjs` untouched (generate, sync, tsc,
   materialize, required-files tripwire).
3. Remove `rollup`, `@rollup/plugin-node-resolve`,
   `rollup-plugin-esbuild` from dependencies.

Validation:

- Barrel (`dist/index.mjs`) resolves every icon; required-files tripwire passes.
- Sample byte-compare of `dist/generated/*.mjs` outputs (explained diffs only:
  chunk filenames may move; module bytes should not).
- Grep tests + CI for `dist` globs expecting rollup's exact chunk filenames;
  none may remain.
- Icons consumer smoke green.

### Arc C — mcp

Scope: `packages/reference-mcp`.

Steps:

1. Move the `neo-alias` and `icons-index-text` plugins verbatim into a
   `build-bundle.mjs` (they are already esbuild plugins; drop the `any`
   typings for `esbuild.Plugin` while moving them).
2. Same 4 entries, same `.mjs` out-extension, same node18 target,
   sourcemap on (as today).
3. Remove `tsup` from dependencies.

Validation:

- Byte-compare `dist/` before/after (identical or explained).
- MCP smoke / child-process entry boots (the `mcp-child` entry is the
  load-bearing one).
- F-4 tripwire (no unexpected dist content) still passes.

### Arc D — reference-rs JS seams (last)

Scope: `packages/reference-rs` `build:js` (`tsup && tsc && dts-entrypoints`).

Steps:

1. Replace the `tsup` leg with raw esbuild over the same entries;
   keep the `tsc` + `create-dts-entrypoints.mjs` legs untouched.
2. Remove `tsup` from dependencies.

Validation:

- `pnpm agentrs v` (all seam suites) green; `pnpm agentrs q` clean.
- N-API/native boundary untouched (no `native/` changes in this arc).

## Sequencing

Arc A first (unblocks F-2, proves the shared builder). Arcs B, C, D in any
order after A — they are disjoint trees with no mutual dependencies and can
run as parallel crews. Land each arc as its own commit(s); never mix arcs in
one commit (a dist regression must bisect to exactly one packaging change).

## Risks and rollback

- **Silent inlining** (externals miscomputed) is the top risk in every arc;
  each proof bar asserts dist contents rather than trusting the build log.
- **Byte drift in pinned artifacts**: harvest-census byte cells and
  verify-pins cover emitted bytes; re-pin only with a dated comment citing
  the cause (see the 2026-10-08 scope.ts re-pin for the ritual).
- **Rollback** per arc is `git revert` of that arc's commit(s) — no shared
  state, no migrations, no coordination beyond the commit split.

## Non-goals

- `reference-legacy`: workspace-excluded, stays on tsup, inert.
- Changing what ships (entries, externals, file layout beyond chunk names):
  this voyage swaps the engine, not the cargo.
- `tsc` removal: declarations stay `tsc`-emitted everywhere.
- Touching `reference-neo`'s existing esbuild usage except as a pattern source.

## Open questions

None. All material choices above are ruled (Oracle) or decided (HQ) with
workspace evidence cited.

## Sources

- [esbuild API docs — outbase/outdir semantics](https://esbuild.github.io/api/#outbase)
  (inspected 2026-10-08; grounds the Arc B layout claim).
- Everything else is workspace evidence: the configs, build scripts, and
  `FINALIZE.md` F-1 cited inline by path.
