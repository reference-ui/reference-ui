# Public API

**Status**: Living contract (rebuilt verified-true 2026-09-23; every claim
carries file:line proof). The pre-cutover `PUBLIC API.md` was deleted as
verified-stale (it imported nonexistent `@reference-ui/react` / `/system`
npm packages); this is its replacement.
**Scope**: The ids authors import and the bins they run.

## Author surface — `import … from '@reference-ui/neo'`

One entry (`packages/reference-neo/src/author/index.ts:1-5`): config plus
fragment collectors. Bundlers alias the id here and tsconfig paths point
typechecking at the same file.

| Import | Source |
|---|---|
| `defineConfig` (+ `BaseSystem`, `ReferenceUIConfig` types) | `author/index.ts:5`, defined `config/types.ts:98` |
| `tokens` (+ `createTokensCollector`, token types) | `author/index.ts:6-11` |
| `keyframes` (+ `createKeyframesCollector`, `KeyframesConfig`) | `author/index.ts:12` |
| `font` (+ `createFontCollector`, font types) | `author/index.ts:13-19` |
| `globalCss` (+ `createGlobalCssCollector`, global-css types) | `author/index.ts:20-24` |

Config keys (`ReferenceUIConfig`, `config/types.ts:25-84`): `include`
(required), `name` (required — the `@layer` + `data-layer` identity, `:37`),
`extends`, `jsxElements`, `staticCss`, `normalizeCss` (default true, `:62-66`),
`debug`, `logs`.

## Runtime surface — `@reference-ui/neo/runtime`

`css` + `recipe` plus plan registration
(`packages/reference-neo/src/runtime/index.ts:1-14`):

| Import | Source |
|---|---|
| `css(...styles)` → class string | `runtime/css/css.ts:213` |
| `recipe(config)` → runtime fn | `runtime/recipe/recipe.ts:329` |
| `registerRuntimeData`, `registerRecipeData` + style/recipe types | `runtime/index.ts:6-14` |

Worlds import the generated bundle; specs import the source entry; the
specifier stays put either way (`runtime/index.ts:3-4`).

## Generated scopes — sync-made, not published

`neo sync` links four packages into the project's
`node_modules/@reference-ui/` (junctions;
`packages/reference-neo/src/sync/publish/links.ts:8,25-30`):

- `@reference-ui/system` — `baseSystem.mjs` / `.d.mts` (name + fragment +
  portable `css`; `config/types.ts:9-17`).
- `@reference-ui/styled` — the served `styles.css`.
- `@reference-ui/react` — generated entry (`generateReactEntrySource`,
  `primitives/generate/generate.ts:29`) + a filesystem copy of the styled
  sheet (`sync/publish/react-shell.ts:14-33`).
- `@reference-ui/types` — generated type bundle.

These ids do not exist on npm. The old doc's mistake was presenting them as
published packages.

## Bins

- `neo` → `./dist/bin/neo.js` (compiled; `packages/reference-neo/package.json:19-21`).
  Source entry `bin/neo.ts`; `neo sync <dir>` regenerates `.reference-ui/`.
- `mcp` / `reference-mcp` / `ref-mcp` → `./bin/mcp.mjs`
  (`packages/reference-mcp/package.json:12-15`).

## Sibling package exports

- `@reference-ui/lib`: `.` + `./theme` (`packages/reference-lib/package.json:14-23`).
- `@reference-ui/mcp`: `.` + `./cli` (`packages/reference-mcp/package.json:26-34`).
- `@reference-ui/icons`: `.` + `./baseSystem` (`packages/reference-icons/package.json:21-29`).
- `@reference-ui/rust`: `.` + the `./tasty` family (`packages/reference-rs/package.json:21-31`).

## Retired (verified absences)

- No bundler plugin: `referenceVite` has zero hits in
  `packages/reference-neo/src` and `packages/reference-lib/src`
  (grep-verified 2026-09-23). There is no Vite/Webpack integration to import.
- No `layers` config surface: the key passes validation through unhandled
  (`validate.ts` carries zero `layers` matches) and stays deferred per D17
  (`packages/reference-neo/PLAN.md:213`).
