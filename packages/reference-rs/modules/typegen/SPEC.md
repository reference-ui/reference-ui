# Typegen SPEC

Current freeze, cases, and proof. Architectural design: [REFERENCE_SYSTEM.md](../../../../REFERENCE_SYSTEM.md) (§3.2, §4.3, §4.5, §7 B) and [atomic.md](../../docs/atomic.md).
Public types architecture: [plan.md](../../../reference-core/src/types/plan.md).
Module README: [README.md](./README.md).

Crate: `packages/reference-rs/modules/typegen`  
Test harness: `pnpm agentrs c typegen` (Cargo) and `pnpm agentrs v typegen` (tsc fixtures)  
Core generators: `packages/reference-core/src/types/generators`  

---

## 1. Job of the Crate

Typegen is the pure declaration printer for Reference UI's styling system. It takes a portable `BaseSystem` definition (token categories and names, declared recipe tables, font families and weights) plus `canon` (canonical CSS properties, HTML primitive tags, Reference dialect props such as `mt`, `r`, `container`, `font`, `weight`, and pseudo/condition keys). It emits lean, strictly typed TypeScript declaration files (`.d.ts`) containing category-specific token string literal unions, recipe variant prop types, `FontRegistry` interface augmentations, and a Reference UI-owned `SystemStyleObject` and `StyleProps` narrowed by tokens over `csstype`. It must not emit an authored JSX component factory (`styled.div`), pattern helpers (`box`, `flex`, `stack`, `grid`), runtime recipe modules (`recipes/*`), runtime token dictionaries, or atomic utility class names (`.mt_2r`, `.bg_n300`), keeping atomic CSS compilation strictly an internal engine detail.

---

## 2. Legend & Status Summary

### Legend

- `[x]` A passing Cargo unit test or Vitest test title contains this case ID.
- `[ ]` Specified contract; awaiting implementation or rename in test suite. The engine may exist as a stub or prototype.

### Current Status (2026-09-15)

**Freeze: Token-union + recipe variant/compound + FontRegistry + FontProps + StyleProps + recursive SystemStyleObject printer in `packages/reference-rs/modules/typegen`; FORBID-01–06 proven on `emit_dts`; STYLE-05 and STRICT-01–05 proven by `tsc --noEmit`. Core `TYP-RECIPE-03` owns recipe contracts and `TYP-STYLE-01` owns `SystemStyleObject` (no `@reference-ui/styled` re-export). Core generator prototype remains in `packages/reference-core/src/types/generators/`.**  
Public types are Reference UI-owned declarations. Core `SystemStyleObject` is assembled from `csstype.Properties` plus canon aliases; the packager wraps `BaseSystemStyleObject` when `strict` is set. `strict` is a printer option on `emit_dts_with`, not a Dump field and not a `ui.config.ts` parse.

| Metric | Status |
| :--- | :--- |
| Engine | Token / recipe / FontRegistry / FontProps / StyleProps / SystemStyleObject printer (`emit_dts(&BaseSystem)` open-mode; `emit_dts_with` for strict wrappers) + Core generator prototype (`refreshGeneratedTypesArtefact`, `renderSystemStyleObjectDts`) |
| Named `[x]` | 28 / 28 contract IDs |
| Named `[ ]` | 0 / 28 contract IDs |
| Cargo tests | 35 (`src/tests/`) |
| Vitest tests | TYP-STYLE-05 + TYP-STRICT-01–05 tsc fixtures in `modules/typegen/tests/` (`pnpm agentrs v typegen` **14**); core `TYP-STYLE-01` in `generators/strict.test.ts` plus unnamed prototypes in `generators/fonts.test.ts` |

**Named proven:** `TYP-TOKEN-01`–`06`, `TYP-RECIPE-01`–`03`, `TYP-FONT-01`–`03`, `TYP-STYLE-01`–`05`, `TYP-STRICT-01`–`05`, `TYP-FORBID-01`–`06`.  
**Remaining unproven:** none.

### In the Tree

- `packages/reference-rs/modules/typegen/src/lib.rs` exports `emit_dts(&BaseSystem)` (always open-mode) and `emit_dts_with(system, &EmitOptions { strict })`. Open emit prints category unions plus `Tokens`, `PascalCase(name)VariantProps`, `PascalCase(name)CompoundVariant` when a dump row's `when` is a subset of declared axes, `FontRegistry`, discriminated `FontProps`, and `StyleProps` when the dump has color/spacing tokens plus breakpoints. Style dumps also print recursive `SystemStyleObject` (`StyleProps` plus nested `StyleConditionKey` and `&${string}` selectors). Radius keys from canon (`*Radius`, excluding `webkit*`) print on StyleProps when the dump has a `radii` category; Panda `rounded*` is not invented. Empty categories / recipes are omitted (not `never`). A StyleProps dump without fonts still prints `FontRegistry {}` so `[FontName] extends [never]` falls back to `StylePropValue<string>` instead of collapsing StyleProps. Goldens: `tests/goldens/tokens.d.ts`, `recipes.d.ts`, `compound.d.ts`, `recipes-two.d.ts`, `fonts.d.ts`, `styles.d.ts`, `styles-fonts.d.ts`, `styles-strict.d.ts`. Dump font weight keys are authored names (`bold`), not CSS numbers (`700`). Compound `css` is `{ [property: string]: string }`. Unknown compound axis/value rows are skipped. Multiple recipes share one emit string (`ButtonVariantProps` + `BadgeVariantProps`); there is no `recipes/` module tree, no `tokens.mjs`, and no `atomic` crate dependency. `canon` supplies color properties, padding/margin aliases, radius names, and `NAMED_CONDITIONS`. The token catalog dump has no breakpoints so `tokens.d.ts` stays token-only (no StyleProps / SystemStyleObject). StyleProps intersects `FontProps` and adds dialect `container` / recursive `r`; it does not dump `csstype.Properties` or import `@reference-ui/styled`. Open StyleProps keep `Token | (string & {})`. Strict names wrap `BaseSystemStyleObject` (`StyleProps`) as `StrictSpacingProps<StrictRadiiProps<StrictColorProps<…>>>` in declaration order, then intersect nested condition keys (a recursive wrap of the full object is TS2456). Unknown / duplicate strict names are skipped. `pnpm agentrs v typegen` typechecks consumer fixtures against the style goldens.
- `packages/reference-core/src/types/generators/fonts.ts` builds `FontRegistry` interfaces and injects them into package `.d.ts` declarations.
- `packages/reference-core/src/types/generators/strict.ts` prints owned `BaseSystemStyleObject` from `csstype` plus canon aliases, then wraps with `StrictColorProps` / `StrictRadiiProps` based on `ui.config.ts`.
- `packages/reference-core/src/types/public/` exposes `StyleProps`, `ReferenceProps`, `SafeColorProps`, and `SafeRadiiProps`.

### Defects & Leftovers to Kill

1. **`SystemStyleObject` alias:** **Killed 2026-09-15 (`TYP-STYLE-01`).** `packages/reference-core/src/types/public/system-style-object.ts` owns `SystemStyleObject` from `csstype.Properties` mapped through `StylePropValue`, plus canon aliases (`bg`, `p`/`mt`, `w`/`h`, `flexDir`). `renderSystemStyleObjectDts` wraps `BaseSystemStyleObject` (not the recursive alias — TS2456) and emits zero `@reference-ui/styled` imports.
2. **`recipe()` re-exports:** **Killed 2026-09-15 (`TYP-RECIPE-03`).** `packages/reference-core/src/types/public/recipe.ts` owns `RecipeCreatorFn`, `RecipeDefinition`, `RecipeRuntimeFn`, `RecipeSelection`, `RecipeVariant`, and `RecipeVariantProps`. Style values still use `SystemStyleObject` from `./system-style-object` (STYLE-01).
3. **Viewport breakpoint pollution:** `packages/reference-core/src/types/public/conditions.ts` still imports `Conditions` from `@reference-ui/styled/types/conditions` and manually excludes 25 viewport breakpoint keys (`TYP-STYLE-03`).
4. **Panda `rounded*` on SPEC STRICT-02:** Core `RADII_PROP_KEYS` lists 14 keys including `rounded` / `roundedTop`. Canon has no those aliases. Typegen prints canon `*Radius` names and does not invent Panda keys.
5. **SPEC STRICT-03 `gap`:** StyleProps still omits `gap` (padding/margin aliases only, same as STYLE-02). Strict spacing wraps those keys; it does not add `gap`.
6. **Core spacing wrapper is null:** `STRICT_WRAPPER_BY_CATEGORY.spacing` in `generators/strict.ts` is still `null`. Typegen prints `StrictSpacingProps` anyway. Do not rewrite core in this crate.

---

## 3. Crosswalk: Panda codegen vs typegen

Panda treats codegen as a file farm (`styled-system/`). We author
`css()` / `recipe()` in TypeScript and restrict typegen to unions from
`BaseSystem`. Vendor paths are the example of the farm we refuse.

| Panda codegen job | Our ID | Disposition |
| :--- | :--- | :--- |
| `styled-system/types/system-style-object.d.ts` | `TYP-STYLE-01` | **Owned type** from `csstype` + token unions. |
| `styled-system/types/tokens.d.ts` | `TYP-TOKEN-01`–`06` | Print category unions from `BaseSystem`. |
| `styled-system/types/recipes.d.ts` | `TYP-RECIPE-01`–`03` | Derive variant props from `BaseSystem` recipe tables. Own `RecipeDefinition`. |
| `styled-system/types/conditions.d.ts` | `TYP-STYLE-03` | Container-first. No viewport breakpoint keys as defaults. |
| `styled-system/jsx/` (`styled.div`, `HTMLStyledProps`) | `TYP-FORBID-02` | **Refuse.** Primitives are authored React. |
| `styled-system/patterns/` (`box`, `flex`, `stack`, `grid`) | `TYP-FORBID-03` | **Refuse.** Layout is primitives + `css()`. |
| `styled-system/recipes/*.d.ts` | `TYP-FORBID-04` | **Refuse.** `recipe()` is authored TypeScript. |
| `styled-system/tokens/index.mjs` | `TYP-FORBID-05` | **Refuse.** Tokens are CSS variables in `@layer tokens`. |
| Atomic class names in `.d.ts` | `TYP-FORBID-01` | **Refuse.** Users never write `.mt_2r`. |
| Whole-farm AST in Rust (`pandacss_codegen`, `vendor/panda/crates/pandacss_codegen/src/artifacts/types.rs`) | `TYP-FORBID-06` | **Refuse.** Typegen does not depend on `atomic`. |
| `strictTokens` / `strictPropertyValues` | `TYP-STRICT-01`–`05` | Owned wrappers via `emit_dts_with` printer options. Typegen does not parse `ui.config.ts`. |

---

## 4. API & Generation Freeze Decisions

1. **BaseSystem + Canon as Exclusive Inputs:** Typegen reads token names and categories from `BaseSystem`, and platform/dialect properties from `canon`. It never accesses compiler internal tables, AST leaves, or the compiled `AtomSet`. If `n300` is declared under `colors`, `bg="n300"` typechecks regardless of whether the engine prints `.bg_n300` or `.background_n300`.
2. **Own `SystemStyleObject`:** `SystemStyleObject` must be an owned type definition authored in `packages/reference-core/src/types/` (and printed by typegen in generated packages), composed of `csstype.Properties`, Reference UI token unions, dialect property overrides, and recursive nesting. Re-exporting from `@reference-ui/styled/types` is strictly forbidden.
3. **Container-Query-First Condition Keys:** `StylePropValue<T>` supports plain `T`, responsive arrays `Array<T | null>`, and condition object maps. Default public condition keys filter out viewport breakpoints (`sm`, `md`, `lg`, etc.) in favor of container query conditions (`@sm`, `@md`), theme modes (`_dark`, `_light`), and pseudo-selectors (`_hover`, `_focusVisible`).
4. **Author-Owned FontRegistry Interface Augmentation:** Fonts declared via `font()` generate interface augmentations for `FontRegistry`. When empty, `FontProps` falls back to `string` without causing `StyleProps` to collapse to `never`. When populated, `FontProps` narrows `font` to known names and `weight` to weights registered for that specific font.
5. **Open Autocomplete by Default, Strict on Opt-In:** By default, token properties use `TokenUnion | (string & {})` to provide instant IDE autocomplete while allowing raw CSS escape hatches. When `strict: ['colors', ...]` is configured in `ui.config.ts`, the `(string & {})` escape hatch is stripped, restricting values strictly to declared tokens plus standardized CSS keywords (`white`, `black`, `currentColor`, `inherit`, `transparent`).
6. **Zero Atomic Class Names in Typings:** No type definition emitted by typegen may include generated class names (`.mt_2r`), atom identifiers, or compiler hashes.

---

## 5. Source Evidence

- `packages/reference-core/src/types/plan.md`: Mandates owning `SystemStyleObject`, using `csstype`, eliminating viewport breakpoints as public defaults, and treating generated unions as primitive ingredients.
- `packages/reference-core/src/types/public/system-style-object.ts`: Owned `SystemStyleObject` from `csstype.Properties` plus canon aliases. Zero `@reference-ui/styled` imports.
- `packages/reference-core/src/types/public/colors.ts`: Canonical catalog of 38 `COLOR_PROP_KEYS` and `StrictColorProps` wrapping logic.
- `packages/reference-core/src/types/public/radii.ts`: Canonical catalog of 14 `RADII_PROP_KEYS` and `StrictRadiiProps` wrapping logic.
- `packages/reference-core/src/types/public/fonts.ts`: Implementation of `FontProps` discriminated union and `[FontName] extends [never]` fallback guard.
- `packages/reference-core/src/types/generators/strict.ts`: Generator orchestrating composition of strict property wrappers based on `ui.config.ts`.
- `packages/reference-core/src/types/generators/fonts.ts`: Generator compiling `FontDefinition[]` into `FontRegistry` interface declarations.
- `vendor/panda/crates/pandacss_codegen/src/artifacts/types.rs`: example of the whole-farm failure mode (`types/jsx`, `types/pattern`, `types/recipe`, `types/system`).

---

## 6. Required Cases

### Token Unions (`TYP-TOKEN-*`)

- [x] `TYP-TOKEN-01` `[reference]` `[unit]` —  
  **Typegen should emit a string literal union of color token keys from BaseSystem.**  
  Pass a `BaseSystem` declaring colors `{ n100: { value: '...' }, n300: { value: '...' }, brand: { primary: { value: '...' } } }`. Assert the emitted declaration defines `type ColorToken = 'n100' | 'n300' | 'brand.primary'`, joining nested tokens with dot notation. The failure mode is emitting `string`, using underscores, or omitting nested scales.

- [x] `TYP-TOKEN-02` `[reference]` `[unit]` —  
  **Typegen should emit spacing and rhythm token unions preserving fractional rhythm literals.**  
  Pass a `BaseSystem` declaring spacing tokens `'1'`, `'2'`, `'4'` and rhythm fractions `'1/2r'`, `'1r'`, `'2r'`. Assert the emitted `type SpacingToken` contains `'1' | '2' | '4' | '1/2r' | '1r' | '2r'`. The failure mode is stripping the `'r'` unit or rejecting slash fractions, causing valid rhythm style props to fail typechecking.

- [x] `TYP-TOKEN-03` `[reference]` `[unit]` —  
  **Typegen should emit border radius token unions matching declared radii.**  
  Pass a `BaseSystem` declaring radii `'none'`, `'sm'`, `'md'`, `'lg'`, `'full'`. Assert the emitted `type RadiusToken` equals `'none' | 'sm' | 'md' | 'lg' | 'full'`. The failure mode is omitting `'none'` or failing to quote numeric-named radius keys.

- [x] `TYP-TOKEN-04` `[reference]` `[unit]` —  
  **Typegen should emit discrete typography token unions for font sizes, font weights, and line heights.**  
  Pass a `BaseSystem` declaring typography tokens for sizes (`xs`, `sm`, `base`, `lg`), weights (`regular`, `medium`, `bold`), and line heights (`tight`, `normal`). Assert emitted types include `type FontSizeToken`, `type FontWeightToken`, and `type LineHeightToken` exactly matching declared keys. The failure mode is collapsing typography scales into generic strings or conflating sizes with line heights.

- [x] `TYP-TOKEN-05` `[reference]` `[unit]` —  
  **Typegen should emit elevation, shadow, and z-index token unions.**  
  Pass a `BaseSystem` declaring shadow tokens (`sm`, `md`, `overlay`) and z-index tokens (`modal`, `toast`, `tooltip`). Assert emitted declarations define `type ShadowToken = 'sm' | 'md' | 'overlay'` and `type ZIndexToken = 'modal' | 'toast' | 'tooltip'`. The failure mode is leaking raw CSS box-shadow values into the union or dropping semantic z-index identifiers.

- [x] `TYP-TOKEN-06` `[reference]` `[unit]` —  
  **Typegen should assemble an aggregate Tokens dictionary indexing all category unions.**  
  Pass a `BaseSystem` containing multiple categories into typegen. Assert emitted declarations export an aggregate interface `Tokens` where `Tokens['colors']`, `Tokens['spacing']`, and `Tokens['radii']` index the respective category unions. The failure mode is structural drift that breaks token indexing in consumer libraries.

---

### StyleProps & SystemStyleObject (`TYP-STYLE-*`)

- [x] `TYP-STYLE-01` `[reference]` `[unit]` —  
  **Typegen should emit a Reference UI-owned SystemStyleObject.**
  Inspect the emitted `system-style-object.d.ts` declaration file. Assert `SystemStyleObject` is assembled from `csstype.Properties` and Reference UI token unions, and contains zero imports from `@reference-ui/styled`. The failure mode is re-exporting `StyledSystemStyleObject`.

- [x] `TYP-STYLE-02` `[reference]` `[unit]` —  
  **Typegen should narrow StyleProps properties using BaseSystem tokens while preserving canonical aliases.**  
  Inspect emitted `StyleProps` definitions for canonical props and shorthand aliases (e.g. `bg`, `backgroundColor`, `color`, `p`, `padding`, `mt`, `marginTop`). Assert color properties accept `StylePropValue<ColorToken | (string & {})>` and spacing properties accept `StylePropValue<SpacingToken | (string & {})>`. The failure mode is missing shorthand aliases or failing to provide IDE autocomplete for tokens.

- [x] `TYP-STYLE-03` `[reference]` `[unit]` —  
  **Typegen should filter out viewport breakpoint keys from public StylePropValue condition types.**  
  Inspect `StylePropValue<T>` and `StyleConditionKey` in emitted declarations. Assert `StylePropValue<T>` allows plain `T`, array notation `Array<T | null>`, and condition objects containing pseudo-selectors (`_hover`, `_focusVisible`), color modes (`_dark`, `_light`), and container queries (`@sm`, `@md`), while excluding viewport keys (`sm`, `md`, `lg`, `smToMd`). The failure mode is polluting property autocompletion with 25+ viewport breakpoint names.

- [x] `TYP-STYLE-04` `[reference]` `[unit]` —  
  **Typegen should layer Reference UI dialect properties on StyleProps while omitting conflicting raw CSS props.**  
  Inspect emitted `StyleProps`. Assert it omits raw CSS `font`, `weight`, `container`, and `r` as CSS keys, replacing them with `container?: StylePropValue<string | boolean>`, `r?: StylePropValue<Record<string | number, StyleProps>>` (recursive `StyleProps` printed in this crate — not a `csstype` dump and not an import of `@reference-ui/styled`), and `FontProps` mixed in by intersection. The failure mode is allowing CSS shorthand `font` to collide with Reference UI's scoped font family prop.

- [x] `TYP-STYLE-05` `[reference]` `[unit]` —  
  **Typegen should support recursive selector and condition nesting without compiler recursion limits.**  
  Author a deeply nested style object targeting multiple pseudos and child selectors (e.g. `_hover: { _dark: { '& > span': { color: 'n300' } } }`). Assert `SystemStyleObject` typechecks without triggering TypeScript compiler recursion depth limits (TS2589). `StylePropValue<T>` stays per-property; nested objects are `SystemStyleObject` printed in this crate (condition keys, plus `&${string}` selectors). The failure mode is unconstrained recursive expansion causing `Type instantiation is excessively deep and possibly infinite`.

---

### Recipe Variant Types (`TYP-RECIPE-*`)

- [x] `TYP-RECIPE-01` `[reference]` `[unit]` —  
  **Typegen should derive recipe variant prop types from declared BaseSystem recipe tables.**  
  Pass a `BaseSystem` declaring a recipe `button` with variants `{ size: { sm: {...}, lg: {...} }, tone: { quiet: {...}, loud: {...} } }`. Assert emitted declarations export `type ButtonVariantProps = { size?: 'lg' | 'sm'; tone?: 'loud' | 'quiet' }` with all variant keys optional (value unions lexicographic). The failure mode is emitting `string` for variant keys or making variant selections mandatory.

- [x] `TYP-RECIPE-02` `[reference]` `[unit]` —  
  **Typegen should constrain compound variant definitions to valid variant combinations.**  
  Declare a recipe with compound variants in `BaseSystem` (e.g. `compoundVariants: [{ size: 'sm', tone: 'loud', css: {...} }]`). Assert the emitted recipe type enforces that compound variant match criteria are subsets of declared variant literal unions. The failure mode is allowing arbitrary string combinations in compound variants without type validation.

- [x] `TYP-RECIPE-03` `[reference]` `[unit]` —  
  **Typegen should provide owned RecipeDefinition contracts.**
  Inspect `packages/reference-core/src/types/public/recipe.ts`. Assert `RecipeCreatorFn`, `RecipeDefinition`, `RecipeRuntimeFn`, `RecipeSelection`, and `RecipeVariantProps` are declared as owned TypeScript interfaces, eliminating all imports from `@reference-ui/styled/types/recipe`. The failure mode is re-exporting recipe types from the generated styled package.

---

### Font Registry (`TYP-FONT-*`)

- [x] `TYP-FONT-01` `[reference]` `[unit]` —  
  **Typegen should emit a FontRegistry interface matching declared font families and dump weight keys.**  
  Pass a `BaseSystem` with fonts `sans` (weights `{ normal: '400', bold: '700' }`) and `mono` (weights `{ light: '300', medium: '500' }`). Assert emitted declarations include `interface FontRegistry { 'sans': { 'bold': true; 'normal': true }; 'mono': { 'light': true; 'medium': true } }`. Dump weight **keys** are authored names (`bold`); CSS numbers (`700`) are values. The draft `['400','700']` arrays do not match Dump — do not invent a second numeric key namespace. The failure mode is emitting CSS values as keys or generating unquoted identifier syntax that breaks non-alphanumeric font names.

- [x] `TYP-FONT-02` `[reference]` `[unit]` —  
  **Typegen should narrow FontProps discriminated pairs and scoped weight literals.**  
  Inspect `FontProps` resolved against a populated `FontRegistry`. Assert that setting `font="sans"` restricts `weight` to `'bold' | 'normal' | 'sans.bold' | 'sans.normal'` (dump **keys**, not CSS numbers `'400'`/`'700'`), while rejecting weights belonging only to `'mono'` (`'light'`, `'medium'`, `'mono.light'`). Sibling families keep their own dump keys (`mono` → `'light' | 'medium' | 'mono.light' | 'mono.medium'`). The draft `'400' | 'sans.400'` arrays do not match Dump. The failure mode is allowing mismatched font family and weight combinations across distinct fonts, or emitting CSS values as FontProps literals.

- [x] `TYP-FONT-03` `[reference]` `[unit]` —  
  **Typegen should gracefully fall back to string font props when FontRegistry is empty.**  
  Inspect `FontProps` when `FontRegistry` is an empty interface `{}`. Assert `FontProps` falls back to `{ font?: StylePropValue<string>; weight?: StylePropValue<string> }` and `StyleProps` remains fully usable. The failure mode is `[FontName] extends [never]` collapsing `ScopedFontProps` to `never` and destroying all primitive style props.

---

### Strict Token Enforcement (`TYP-STRICT-*`)

- [x] `TYP-STRICT-01` `[reference]` `[unit]` —  
  **Typegen should restrict color properties to declared tokens and CSS keywords in strict colors mode.**  
  Configure `strict: ['colors']` in `ui.config.ts`. Assert all 38 `COLOR_PROP_KEYS` (including `bg`, `color`, `borderColor`) strictly accept `ColorToken | 'white' | 'black' | 'inherit' | 'currentColor' | 'transparent'`, and reject arbitrary CSS color strings such as `'#123456'` or `'red'`. The failure mode is allowing arbitrary strings via `(string & {})` in strict mode.

- [x] `TYP-STRICT-02` `[reference]` `[unit]` —  
  **Typegen should restrict radius properties to declared tokens and keywords in strict radii mode.**  
  Configure `strict: ['radii']` in `ui.config.ts`. Assert all 14 `RADII_PROP_KEYS` (including `borderRadius`, `rounded`, `roundedTop`) strictly accept `RadiusToken | 'none' | 'inherit' | 'initial' | 'revert'`, and reject arbitrary length strings like `'16px'`. The failure mode is permitting arbitrary string values on radius props when strict radii is configured.

- [x] `TYP-STRICT-03` `[reference]` `[unit]` —  
  **Typegen should restrict spacing and rhythm properties to declared tokens and keywords in strict spacing mode.**  
  Configure `strict: ['spacing']` in `ui.config.ts`. Assert spacing properties (`m`, `mt`, `p`, `px`, `gap`) strictly accept `SpacingToken | 0 | '0' | 'auto' | 'inherit'`, and reject arbitrary dimension strings like `'13px'`. The failure mode is allowing untokenized numeric pixel strings when strict spacing is configured.

- [x] `TYP-STRICT-04` `[reference]` `[unit]` —  
  **Typegen should allow arbitrary CSS escape hatches with token autocomplete when strict mode is unconfigured.**  
  Configure `strict: []` or omit `strict` in `ui.config.ts`. Assert color, radius, and spacing properties typecheck with arbitrary strings while preserving IDE token autocompletion via `Token | (string & {})`. The failure mode is triggering type errors on arbitrary CSS values in open mode.

- [x] `TYP-STRICT-05` `[reference]` `[unit]` —  
  **Typegen should compose multiple active strict category wrappers in deterministic order.**  
  Configure `strict: ['colors', 'radii']` in `ui.config.ts`. Assert emitted `system-style-object.d.ts` wraps the base style object in declaration order (`StrictRadiiProps<StrictColorProps<BaseSystemStyleObject>>`) and deduplicates repeated entries. The failure mode is applying only the last wrapper or generating invalid nested generic syntax.

---

### Forbidden Codegen & Invariants (`TYP-FORBID-*`)

- [x] `TYP-FORBID-01` `[forbidden]` `[unit]` —  
  **Typegen must never emit atomic utility class names in generated declaration files.**  
  Run typegen on a complete `BaseSystem` and search all emitted declaration output. Assert there are zero occurrences of atomic utility class names (e.g. `.mt_2r`, `.bg_n300`, `atomic/*`, class name string unions). The failure mode is exposing internal atomic class names in public typings.

- [x] `TYP-FORBID-02` `[forbidden]` `[unit]` —  
  **Typegen must never emit a JSX component factory or styled element farm.**  
  Run typegen on a complete `BaseSystem`. Assert typegen emits zero JSX component wrappers (`styled.div`, `styled.span`, `HTMLStyledProps`, `StyledComponent`, `JsxFactory`). The failure mode is generating a jsx type farm for primitives that already exist as authored React in `@reference-ui/react`.

- [x] `TYP-FORBID-03` `[forbidden]` `[unit]` —  
  **Typegen must never emit layout pattern helper functions or types.**  
  Run typegen on a complete `BaseSystem`. Assert typegen emits zero pattern types or interfaces (`BoxProps`, `FlexProps`, `StackProps`, `GridProps`, `patterns/*`). The failure mode is generating Panda's `types/pattern` farm for layouts already covered by tag primitives.

- [x] `TYP-FORBID-04` `[forbidden]` `[unit]` —  
  **Typegen must never emit recipes as individual TypeScript module declaration files.**  
  Run typegen on a `BaseSystem` declaring multiple recipes. Assert variant types are emitted as pure data type definitions in a central types file, and no per-recipe module directory (e.g. `recipes/button.d.ts`, `recipes/badge.d.ts`) is generated. The failure mode is producing a filesystem tree of individual recipe TypeScript modules.

- [x] `TYP-FORBID-05` `[forbidden]` `[unit]` —  
  **Typegen must never emit runtime JavaScript token reflection dictionaries.**  
  Run typegen on a complete `BaseSystem`. Assert typegen emits strictly declaration files (`.d.ts`) and zero executable runtime JavaScript files (`tokens.mjs`, `token('colors.n300')` accessor functions). The failure mode is generating runtime JavaScript mirrors of token trees. `emit_dts` returns a string; production sources must not write `.mjs`.

- [x] `TYP-FORBID-06` `[forbidden]` `[unit]` —  
  **Typegen must not depend on the atomic crate or require compiled AtomSet input.**  
  Inspect `Cargo.toml` and module imports for `modules/typegen`. Assert `typegen` has zero dependencies on `atomic` and no knowledge of compiled stylesheets (`AtomSet`). StyleProps depends on `canon` (`TYP-STYLE-02`/`03`) and `base_system`; it must not depend on `atomic`. The failure mode is coupling type generation to the atomic CSS compilation pipeline.

---

## 7. Existing Proof Map

| Contract ID | Proof Harness | Test Location / Function Name | Status |
| :--- | :--- | :--- | :--- |
| `TYP-TOKEN-01` | `[unit]` | `src/tests/tokens.rs::typ_token_01_emits_color_token_union` | `[x]` Proven |
| `TYP-TOKEN-02` | `[unit]` | `src/tests/tokens.rs::typ_token_02_emits_spacing_and_rhythm_union` | `[x]` Proven |
| `TYP-TOKEN-03` | `[unit]` | `src/tests/tokens.rs::typ_token_03_emits_radius_token_union` | `[x]` Proven |
| `TYP-TOKEN-04` | `[unit]` | `src/tests/tokens.rs::typ_token_04_emits_typography_token_unions` | `[x]` Proven |
| `TYP-TOKEN-05` | `[unit]` | `src/tests/tokens.rs::typ_token_05_emits_shadow_and_z_index_unions` | `[x]` Proven |
| `TYP-TOKEN-06` | `[unit]` | `src/tests/tokens.rs::typ_token_06_emits_aggregate_tokens_interface` | `[x]` Proven |
| `TYP-STYLE-01` | `[unit]` | `packages/reference-core/src/types/generators/strict.test.ts` (`TYP-STYLE-01`); `renderSystemStyleObjectDts` | `[x]` Proven |
| `TYP-STYLE-02` | `[unit]` | `src/tests/style.rs::typ_style_02_narrows_style_props_with_aliases_and_tokens` | `[x]` Proven |
| `TYP-STYLE-03` | `[unit]` | `src/tests/style.rs::typ_style_03_filters_viewport_keys_from_style_condition_key` | `[x]` Proven |
| `TYP-STYLE-04` | `[unit]` | `src/tests/style.rs::typ_style_04_layers_dialect_props_and_omits_conflicting_css` | `[x]` Proven |
| `TYP-STYLE-05` | `[unit]` | `tests/style-05.test.ts` (`pnpm agentrs v typegen`) | `[x]` Proven |
| `TYP-RECIPE-01` | `[unit]` | `src/tests/recipes.rs::typ_recipe_01_emits_optional_variant_prop_unions` | `[x]` Proven |
| `TYP-RECIPE-02` | `[unit]` | `src/tests/recipes.rs::typ_recipe_02_emits_compound_variant_subset_unions` | `[x]` Proven |
| `TYP-RECIPE-03` | `[unit]` | `packages/reference-core/src/types/public/recipe.test.ts` (`TYP-RECIPE-03`) | `[x]` Proven |
| `TYP-FONT-01` | `[unit]` | `src/tests/fonts.rs::typ_font_01_emits_font_registry_from_dump_weight_keys` | `[x]` Proven |
| `TYP-FONT-02` | `[unit]` | `src/tests/fonts.rs::typ_font_02_narrows_font_props_to_dump_weight_keys` | `[x]` Proven |
| `TYP-FONT-03` | `[unit]` | `src/tests/fonts.rs::typ_font_03_falls_back_to_string_when_font_registry_is_empty` | `[x]` Proven |
| `TYP-STRICT-01` | `[unit]` | `src/tests/strict.rs::typ_strict_01_restricts_colors_to_tokens_and_keywords`; `tests/strict.test.ts` | `[x]` Proven |
| `TYP-STRICT-02` | `[unit]` | `src/tests/strict.rs::typ_strict_02_restricts_radii_to_tokens_and_keywords`; `tests/strict.test.ts` | `[x]` Proven |
| `TYP-STRICT-03` | `[unit]` | `src/tests/strict.rs::typ_strict_03_restricts_spacing_to_tokens_and_keywords`; `tests/strict.test.ts` | `[x]` Proven |
| `TYP-STRICT-04` | `[unit]` | `src/tests/strict.rs::typ_strict_04_open_mode_keeps_escape_hatch`; `tests/strict.test.ts` | `[x]` Proven |
| `TYP-STRICT-05` | `[unit]` | `src/tests/strict.rs::typ_strict_05_composes_wrappers_in_declaration_order`; `tests/strict.test.ts` | `[x]` Proven |
| `TYP-FORBID-01` | `[unit]` | `src/tests/mod.rs::typ_forbid_01_emits_no_atomic_class_names` | `[x]` Proven |
| `TYP-FORBID-02` | `[unit]` | `src/tests/mod.rs::typ_forbid_02_emits_no_jsx_farm` | `[x]` Proven |
| `TYP-FORBID-03` | `[unit]` | `src/tests/forbid.rs::typ_forbid_03_emits_no_layout_pattern_helpers` | `[x]` Proven |
| `TYP-FORBID-04` | `[unit]` | `src/tests/forbid.rs::typ_forbid_04_emits_recipe_types_in_one_string_not_modules` | `[x]` Proven |
| `TYP-FORBID-05` | `[unit]` | `src/tests/forbid.rs::typ_forbid_05_emits_no_runtime_token_javascript` | `[x]` Proven |
| `TYP-FORBID-06` | `[unit]` | `src/tests/forbid.rs::typ_forbid_06_does_not_depend_on_atomic` | `[x]` Proven |

---

## 8. Remaining Work Ordered by Priority

1. **Kill the Panda `SystemStyleObject` Alias (`TYP-STYLE-01`):**  
   **Landed 2026-09-15.** `packages/reference-core/src/types/public/system-style-object.ts` owns `SystemStyleObject` from `csstype.Properties` mapped through `StylePropValue`, plus canon aliases (`bg`, `p`/`mt`, `w`/`h`, `flexDir`). `renderSystemStyleObjectDts` wraps `BaseSystemStyleObject` then intersects nested condition/selector keys. Zero `@reference-ui/styled` / `StyledSystemStyleObject` in this declaration. `csstype` is a dependency of `@reference-ui/core`. Do not copy typegen's color/spacing/radius-only StyleProps into core. Proof: `pnpm agent vitest core -t "strict-token system-style-object"`.
2. **Kill the Panda Recipe Re-Exports (`TYP-RECIPE-03`):**  
   **Landed 2026-09-15.** `packages/reference-core/src/types/public/recipe.ts` owns `RecipeCreatorFn` / `RecipeDefinition` / `RecipeRuntimeFn` / `RecipeSelection` / `RecipeVariant` / `RecipeVariantProps`. Zero `@reference-ui/styled` imports. `customCvaFn` still casts into Panda `styledCva`. Style values remain `SystemStyleObject` from `./system-style-object` (STYLE-01). Proof: `pnpm agent vitest core -t "recipe"`.
3. **Token Category Unions from BaseSystem (`TYP-TOKEN-01`–`06`):**  
   **Landed 2026-09-15.** `emit_dts(&BaseSystem)` prints sorted unique category unions plus `Tokens`. Empty categories omitted (not `never`). Golden at `tests/goldens/tokens.d.ts`; refresh with `TYPEGEN_UPDATE_GOLDENS=1`.
4. **StyleProps Narrowing & Condition Sanitization (`TYP-STYLE-02`–`05`):**  
   **TYP-STYLE-02/03/04/05 landed 2026-09-15.** `StyleProps` from `canon::COLOR_PROPERTIES` plus color aliases (`bg`) and padding/margin aliases (`p`, `mt`, …) plus those canonical names. Values are `StylePropValue<ColorToken | (string & {})>` / `SpacingToken`. `StyleConditionKey` is `NAMED_CONDITIONS` plus `@${breakpoint}` from the dump (lexicographic); bare `sm`/`md`/`lg`/`smToMd` are not members. Dialect `container?: StylePropValue<string | boolean>` and `r?: StylePropValue<Record<string | number, StyleProps>>` replace omitted CSS `font`/`weight`/`container`/`r`; `FontProps` mixes in by intersection. Recursive `SystemStyleObject` is `StyleProps` plus nested condition keys and `&${string}` selectors; `tsc --noEmit` proves `_hover: { _dark: { color: 'n300' } }` and `_hover: { _dark: { '& > span': { color: 'n300' } } }` without TS2589 (`pnpm agentrs v typegen`). Dedicated dump+golden `styles.d.ts` (catalog tokens + `breakpoints: { sm, md, lg }`, empty `FontRegistry {}`); token golden stays token-only. TYP-STYLE-01 (owned `SystemStyleObject` from csstype in core) landed 2026-09-15. Typegen StyleProps still does not dump all of `csstype.Properties`.
5. **Strict Token Enforcement (`TYP-STRICT-01`–`05`):**  
   **Landed 2026-09-15.** `emit_dts` stays open-mode (`Token | (string & {})`). `emit_dts_with` takes `EmitOptions { strict }` — not a Dump field, not a `ui.config.ts` parse. Unknown / duplicate names skip in declaration order. Strict colors/radii/spacing wrap `BaseSystemStyleObject` (`StyleProps`) then intersect nested condition keys (`tsc` TS2456 if the full recursive object is the wrap argument). Radius keys are canon `*Radius` excluding `webkit*` (19 names including `borderRadius` and corner longhands); Panda `rounded*` is not printed (`is_known_style_prop("rounded")` is false). Spacing strict exists here even though core `STRICT_WRAPPER_BY_CATEGORY.spacing` is `null`. `gap` is still omitted from StyleProps (STYLE-02 box spacing only). Proof: `pnpm agentrs c typegen` **35**, `pnpm agentrs v typegen` **14**.
6. **Recipe Variant Types Derivation (`TYP-RECIPE-01`–`02`):**  
   **TYP-RECIPE-01/02 landed 2026-09-15.** `ButtonVariantProps` from `list_recipes()`; all axes optional; value unions lexicographic. `ButtonCompoundVariant` reuses those optional axis unions plus `css: { [property: string]: string }`. Compound rows whose `when` names an unknown axis or value are skipped (all-invalid dumps omit the compound type). Recipe names that cannot PascalCase to a TypeScript identifier (`123`) are skipped. `*bad*` PascalCases to `Bad` and would still emit — not a skip. TYP-RECIPE-03 landed in core (owned contracts, not typegen emit).
7. **Font Registry Typings & Discrimination (`TYP-FONT-01`–`03`):**  
   **TYP-FONT-01/02/03 landed 2026-09-15.** `FontRegistry` from `fonts.iter()`; family names quoted; dump weight **keys** (`bold`) as `'bold': true`. SPEC draft `['400','700']` / `'400' | 'sans.400'` does not match Dump. Populated dumps print mapped `FontProps` (`'bold' | 'sans.bold'` via dump keys plus a scoped template) mixed into StyleProps (`styles-fonts.d.ts`). Empty registry is `FontRegistry {}` plus `FontProps = [FontName] extends [never] ? FallbackFontProps : ScopedFontProps` so StyleProps stays usable (`styles.d.ts`). Intersecting Fallback with Scoped on a populated registry widens `weight` to `string` and would fail FONT-02 in tsc.
8. **Forbidden Codegen Verification (`TYP-FORBID-01`–`06`):**  
   **Landed 2026-09-15.** No `.mt_2r` / jsx farm / `BoxProps` / `patterns/` / `recipes/*.d.ts` / `tokens.mjs` / `atomic` crate. Multiple recipes (`button` + `badge`) share one `emit_dts` string (`recipes-two.d.ts`). `canon` is a crate dependency for StyleProps; `atomic` is still forbidden.

---

## 9. “Do Not” / Tripwires

1. **Do not import `@reference-ui/styled/types` or `@pandacss/*`:** The mandate is to own public style types. Re-exporting or aliasing Panda types is the single largest remaining tech debt in `src/types`.
2. **Do not make `typegen` depend on `atomic`:** Typegen takes `BaseSystem` and `canon`. It does not take `AtomSet` or stylesheet output. Coupling typegen to atomic compilation causes cyclic dependencies and slow compilation.
3. **Do not emit atomic class names (`.mt_2r`, `.bg_n300`) into `.d.ts`:** Atomic class names are strictly private compiler output. Users author `StyleProps` and `css()`; they never write or type class names.
4. **Do not generate a JSX component factory (`styled.div`):** Primitives are authored React in `packages/reference-core/src/system/primitives/`, wrapping the `css()` runtime. Generating a JSX factory is Panda v1/v2 cargo-culting.
5. **Do not generate layout pattern helpers (`box`, `flex`, `stack`, `grid`):** Tag primitives (`<Div>`, `<Span>`) handle layout directly. Layout patterns add zero capability while bloating the type surface.
6. **Do not emit recipes as individual TypeScript modules (`recipes/*.d.ts`):** Recipes are declared data; `recipe()` is an authored TypeScript function in core. Generating a folder of recipe modules is forbidden.
7. **Do not inherit viewport breakpoints (`sm`, `md`, `lg`) as default conditions:** Reference UI is container-query-first. Default public conditions must never be polluted with 25+ viewport media queries.
8. **Do not execute author JS in Rust:** `BaseSystem` is produced by TypeScript fragments evaluating author files. Typegen reads the structured definition; it never embeds a JS runtime.
9. **Do not allow `[FontName] extends [never]` to collapse `ScopedFontProps` to `never`:** When `FontRegistry` is unaugmented, `FontProps` must be `FallbackFontProps`, never collapsing `StyleProps` to `never`. Do not intersect Fallback with Scoped on a populated registry — that widens `weight` to `string` and FONT-02 cannot fail tsc.
10. **Do not emit a 12-file type farm:** Typegen emits clean, focused declaration modules. Do not replicate Panda's monolithic AST machinery to print string unions.
11. **Do not invent Panda `rounded*` keys:** Canon `ALIASES` has `bg` and `p`/`mt`, not `rounded`. `is_known_style_prop("rounded")` is false. Radius StyleProps use canon `*Radius` names.
12. **Do not parse `ui.config.ts` in typegen:** `strict` is `EmitOptions` on `emit_dts_with`. `emit_dts` stays open-mode so existing goldens keep the hatch.
