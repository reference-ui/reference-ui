# TYPE — generated declarations

After `sync()`, the generated declarations type real consumer code: a world
importing primitives, `css`/`recipe`, and named types from `@reference-ui/react`
compiles clean, token unions and recipe variants reject bad literals, and the
system authoring surface typechecks in fragment files. This group owns
`src/sync/publish.ts` (types publish only) and `tsconfig.json` `paths`.
Existing: none — all six rows start `open`.

## Dialect

Consumers write primitives with `StyleProps`, `css()`/`recipe()` calls, and
named type imports (`StyleProps`, `PrimitiveProps`, `SystemStyleObject`,
`RecipeVariantProps`, `CssStyles`, font registry types); fragment authors write
`tokens()`/`font()`/`keyframes()`/`globalCss()`/`getRhythm()` against
`@reference-ui/system`. Proofs run `tsc --noEmit -p world/tsconfig.json`
**after sync**, with `paths` pointing at the generated
`.reference-ui/**/*.d.mts` (§8.14) — a second check beside the harness's
stable-surface pre-run typecheck.

## Engine

No Atomic stations: the engine is typegen `emitDtsSync`, verified present
2026-09-17 (`ls packages/reference-rs/modules/typegen/{js/,README.md,SPEC.md,
tests/goldens/}` + README/SPEC/goldens read). It prints `.d.ts` strings from
`BaseSystem` + canon and never touches `atomic` (TYP-FORBID-06). Leans:
TYP-TOKEN-01..06 (category unions + `Tokens`), TYP-STYLE-02/03/04/05
(`StyleProps`, `StyleConditionKey`, `StylePropValue<T> = T | Array<T | null> |
condition map`, recursion without TS2589), TYP-RECIPE-01/02 (plain optional
unions), TYP-FONT-01..03, TYP-STRICT-01..05 (callable via `emit_dts_with`,
unexposed per D17), TYP-FORBID-01..06. Caveats, all settled engine contracts,
no RS: open mode keeps `Token | (string & {})` (TYP-STRICT-04), so TYPE-02
asserts at a `ColorToken`-typed position; `StyleConditionKey` carries `@sm`,
never bare `sm` (TYP-STYLE-03, D8); recipe variants are plain unions, not
`ConditionalValue`-wrapped (TYP-RECIPE-01).

## Decisions

D5 (TYPE-01 targets `react/react.d.mts` + `./styles.css` names). D6 (TYPE-05:
`defineConfig`, `tokens`, `font`, `keyframes`, `globalCss`, `extendPattern`,
`getRhythm`, `baseSystem` + config types; `getRhythm` is pure over the rhythm
root). D8/D10 (TYPE-04: container-first `@sm` plus `Array<T | null>` holes —
Panda and typegen agree). D17 (`strict`/`layers` deferred; typegen `strict`
stays callable but unexposed, so strict-mode rejection is an absence).

Coverage-map rows for this group: 2 (`system.mjs`+`.d.mts` → TYPE-05 with
SYNC-12), 8 (41 packaged core type files → replaced by native `system.d.mts`,
Panda-shaped leftovers not reproduced), 14 (`styled/types/*.d.ts` → TYPE-01/
02/03/06, today missing), 20 (`react/{entry,system,types}/` → TYPE-01 with
PRIM-10; the single `index.d.mts` must become the named graph).

## Approved absences

- `strictTokens` / `WithEscapeHatch` / `ImportantMark` hatches (D17): engine
  support exists (`styles-strict.d.ts` golden, seam TYP-NATIVE-03) but no
  config exposes it; Panda `generate-style-props` / `generate-prop-types`
  are contrast only.
- Pattern types (`BoxProps`, `FlexProps`, …) and jsx-factory types
  (`JsxFactory`, `JsxElements`, `HTMLStyledProps`, `Styled`): TYP-FORBID-02/03;
  primitives are authored React, layout is primitives + `css()`.
- `recipes/*.d.ts` module trees and `tokens.mjs` / `token()` / `token.var`
  runtime (TYP-FORBID-04/05; D15): one central types string, `{path}` refs only.
- `styled/types/global.d.ts` (`declare module '@pandacss/dev'`): §4.1 forbids
  `@pandacss` anywhere; TYPE-06 asserts it.
- `TokenCategory` / `ColorPalette` / `colorPalette.*` unions: D14, no lib author
  uses the virtual palette.
- `textStyles` / `layerStyles` / `animationStyles`, asset tokens,
  `formatTokenName` `$` prefixes, hashed var names: zero lib/core matches or
  Panda opt-ins (tokens-types corpus §5).

## Out of scope (Panda, not Reference)

| Feature | Reason |
| --- | --- |
| Bare `sm`/`md`/`lg` as condition keys | TYP-STYLE-03 excludes viewport keys; container `@sm` + `_hover` only |
| `ConditionalValue`-wrapped recipe variants | Panda `generate-recipe` shape; Neo prints plain optional unions |
| `csstype.Properties` dump / `@reference-ui/styled` type re-export | TYP-STYLE-01: `SystemStyleObject` is owned |
| Atomic class names (`.mt_2r`) in `.d.ts` | TYP-FORBID-01: engine internals, never public API |
| `cva` alias, `css.raw` | D3/D16: `recipe` / `recipe().raw()` only |
| `token.var` JS map, `globalVars` unions | No `token()` runtime (D15) |
