# Architecture

**Status**: Living stub (verified-true 2026-09-23; every claim carries file:line proof).
**Scope**: Repository. This is the ONE architecture doc — pre-cutover maps were
deleted (history lives in git), not kept alongside.

Reference UI is a chainable design-system compiler. Authors write `ui.config.ts`
plus styled source; `neo sync` compiles that into generated packages under
`.reference-ui/` and links them into `node_modules/@reference-ui/`. Native
parsing and lowering run in Rust; orchestration, fragments, and publish run in
TypeScript. The style language contract lives in [LANGUAGE/](LANGUAGE/PUBLIC-API.MD).

## Packages (6 published)

| Package | Role | Proof |
|---|---|---|
| `@reference-ui/neo` | Compiler driver: config, fragments, sync, `neo` bin | `packages/reference-neo/package.json` (name + `bin.neo` → `./dist/bin/neo.js`) |
| `@reference-ui/lib` | Component library + theme (`.` and `./theme` exports) | `packages/reference-lib/package.json:14-23` |
| `@reference-ui/rust` | Native engine: 11 modules (atlas, atomic, base-system, canon, module-graph, runtime, shared, styletrace, tasty, typegen, virtualrs) | `packages/reference-rs/modules/` listing |
| `@reference-ui/mcp` | MCP server (`mcp` bin + `.`/`./cli` exports) | `packages/reference-mcp/package.json:12-15,26-34` |
| `@reference-ui/icons` | Icon set, ships a `baseSystem` (`.`/`./baseSystem` exports) | `packages/reference-icons/package.json:21-29` |
| `@reference-ui/reference-docs` | Published docs site | `packages/reference-docs/package.json:2` |

## The build (`neo sync`)

1. Load `ui.config.ts` (`defineConfig`, `packages/reference-neo/src/config/types.ts:98`).
2. Clean `.reference-ui/`, scan `include` globs for fragments, evaluate them once.
3. Compile natively (the engine scans `sourceRoot` itself — no virtual mirror,
   no staged declarations; `packages/reference-neo/src/sync/index.ts:167`).
4. Publish the folder (system, styled, react, types legs) and link the four
   generated scopes (`packages/reference-neo/src/sync/publish/links.ts:8,25-30`).
5. The folder is atomic: any post-clean failure removes it again (SYNC-11;
   `packages/reference-neo/src/sync/index.ts:137-143`).

## Composition

- `extends: BaseSystem[]` adopts upstream fragments plus upstream portable CSS.
  The served sheet and the published `baseSystem.css` are both assembled by one
  merge (`mergePackedStylesheets`, `packages/reference-neo/src/sync/packed-css.ts:118`;
  statement at `:125`, reset strip at `:62`).
- `layers:` is deferred past this voyage (D17, `packages/reference-neo/PLAN.md:213`):
  `validate.ts` carries zero `layers` handling, so the key passes validation
  through and no sync path reads it. `matrix/tests/chain/T2` is the kept layers
  prover for when D17 lands.
- Identity is `ui.config.name`: the CSS `@layer` name and the `data-layer`
  selector (`packages/reference-neo/src/config/types.ts:37`).

## Pins (verified absences)

- No bundler plugin: `referenceVite` has zero hits in `packages/reference-neo/src`
  and `packages/reference-lib/src` (grep-verified 2026-09-23).
- No `@reference-ui/react` / `@reference-ui/system` npm packages: those ids are
  sync-generated scope links (`links.ts:8`), alongside `styled` and `types`.
- `normalizeCss` defaults to true and owns the reset (`types.ts:62-66`); a
  `false` consumer opts its whole subtree out, upstream included
  (`packed-css.ts:57-62` strip rule).

## Verification home

- Neo behavior: `packages/reference-neo/tests/cases/` (NEO-* cases) + colocated
  `src/**/*.test.ts`.
- Installed-shape proof: `matrix/tests/chain/T1-T13` (11 tiers; T4/T5 never
  built) + `matrix/tests/mcp`, run hermetic via the pipeline matrix runner
  (`pipeline/src/testing/matrix/`).
