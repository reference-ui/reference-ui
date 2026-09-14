# Typegen SPEC

Current freeze, cases, and proof. Architectural design: [REFERENCE_SYSTEM.md](../../../../REFERENCE_SYSTEM.md) (§3.2, §4.3, §4.5, §7 B) and [atomic.md](../../docs/atomic.md).
Public types architecture: [plan.md](../../../reference-core/src/types/plan.md).
Module README: [README.md](./README.md).

Crate: `packages/reference-rs/modules/typegen`  
Test harness: `cargo test -p typegen` (`pnpm agentrs c typegen`)  
Core generators: `packages/reference-core/src/types/generators`  

---

## 1. Job of the Crate

Typegen is the pure declaration printer for Reference UI's styling system. It takes a portable `BaseSystem` definition (token categories and names, declared recipe tables, font families and weights) plus `canon` (canonical CSS properties, HTML primitive tags, Reference dialect props such as `mt`, `r`, `container`, `font`, `weight`, and pseudo/condition keys). It emits lean, strictly typed TypeScript declaration files (`.d.ts`) containing category-specific token string literal unions, recipe variant prop types, `FontRegistry` interface augmentations, and a Reference UI-owned `SystemStyleObject` and `StyleProps` narrowed by tokens over `csstype`. It must not emit an authored JSX component factory (`styled.div`), pattern helpers (`box`, `flex`, `stack`, `grid`), runtime recipe modules (`recipes/*`), runtime token dictionaries, or atomic utility class names (`.mt_2r`, `.bg_n300`), keeping atomic CSS compilation strictly an internal engine detail.

---

## 2. Legend & Status Summary

### Legend

- `[x]` A passing Cargo unit test or Vitest test title contains this case ID.
- `[ ]` Specified contract; awaiting implementation or rename in test suite. The engine may exist as a stub or prototype.

### Current Status (2026-09-14)

**Freeze: Crate stub in `packages/reference-rs/modules/typegen`; generator prototype in `packages/reference-core/src/types/generators/`.**  
The Panda codegen farm (`styled-system/`) is rejected. Public types are moving to Reference UI-owned declarations. Leftover `@reference-ui/styled/types` alias in `SystemStyleObject` and recipe re-exports are scheduled for immediate termination (`TYP-STYLE-01`, `TYP-RECIPE-03`).

| Metric | Status |
| :--- | :--- |
| Engine | Crate stub + Core generator prototype (`refreshGeneratedTypesArtefact`, `renderSystemStyleObjectDts`) |
| Named `[x]` | 1 / 28 contract IDs |
| Named `[ ]` | 27 / 28 contract IDs |
| Cargo tests | 1 (`tests::scaffold_emits_no_jsx_farm`) |
| Vitest tests | 8 (in `generators/strict.test.ts` and `generators/fonts.test.ts`; pending contract ID naming) |

**Named proven:** `TYP-FORBID-02`.  
**Remaining unproven:** `TYP-TOKEN-01`–`06`, `TYP-STYLE-01`–`05`, `TYP-RECIPE-01`–`03`, `TYP-FONT-01`–`03`, `TYP-STRICT-01`–`05`, `TYP-FORBID-01`, `TYP-FORBID-03`–`06`.

### In the Tree

- `packages/reference-rs/modules/typegen/src/lib.rs` exports `emit_dts()` stub and verifies no JSX farm is emitted (`tests::scaffold_emits_no_jsx_farm`).
- `packages/reference-core/src/types/generators/fonts.ts` builds `FontRegistry` interfaces and injects them into package `.d.ts` declarations.
- `packages/reference-core/src/types/generators/strict.ts` composes strict property wrappers (`StrictColorProps`, `StrictRadiiProps`) based on `ui.config.ts`.
- `packages/reference-core/src/types/public/` exposes `StyleProps`, `ReferenceProps`, `SafeColorProps`, and `SafeRadiiProps`.

### Defects & Leftovers to Kill

1. **Panda `SystemStyleObject` alias:** `packages/reference-core/src/types/public/system-style-object.ts` imports and re-exports `SystemStyleObject` directly from `@reference-ui/styled/types`. `generators/strict.ts` falls back to `StyledSystemStyleObject`. Both must be replaced with an owned `SystemStyleObject` constructed from `csstype` and token unions (`TYP-STYLE-01`).
2. **Panda `recipe` re-exports:** `packages/reference-core/src/types/public/recipe.ts` re-exports recipe interfaces (`RecipeCreatorFn`, `RecipeDefinition`, `RecipeVariantProps`) from `@reference-ui/styled/types/recipe` (`TYP-RECIPE-03`).
3. **Viewport breakpoint pollution:** `packages/reference-core/src/types/public/conditions.ts` still imports `Conditions` from `@reference-ui/styled/types/conditions` and manually excludes 25 viewport breakpoint keys (`TYP-STYLE-03`).

---

## 3. Crosswalk: Panda Codegen vs Reference UI Typegen

Panda v1 and v2 treat codegen as an expansive file farm (`styled-system/`). Reference UI rejects the farm, authoring components and runtime in TypeScript and restricting typegen to union printing from the `BaseSystem`.

| Panda Codegen Job | Reference UI Contract ID | Disposition | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| `styled-system/types/system-style-object.d.ts` | `TYP-STYLE-01` | **Replace with owned type** | Kill the `@reference-ui/styled/types` alias. Assemble `SystemStyleObject` from `csstype` + token unions. |
| `styled-system/types/tokens.d.ts` | `TYP-TOKEN-01`–`06` | **Replace with unions** | Print category literal unions (`Colors`, `Spacing`, `Radii`) directly from `BaseSystem`. No runtime token dictionary. |
| `styled-system/types/recipes.d.ts` | `TYP-RECIPE-01`–`03` | **Replace with owned types** | Derive variant prop types (`ButtonVariantProps`) from `BaseSystem` recipe tables. Kill Panda recipe imports. |
| `styled-system/types/conditions.d.ts` | `TYP-STYLE-03` | **Replace with container-first** | Exclude viewport breakpoint keys (`sm`, `md`, `lg`, `smToMd`). Autocomplete container queries and pseudo-states. |
| `styled-system/jsx/` (`styled.div`, `HTMLStyledProps`) | `TYP-FORBID-02` | **REFUSE (Forbidden)** | Primitives are authored React (`<Div>`, `<Span>`), not generated wrappers. Style prop splitting is driven by `canon`. |
| `styled-system/patterns/` (`box`, `flex`, `stack`, `grid`) | `TYP-FORBID-03` | **REFUSE (Forbidden)** | Primitives handle layout. `box()` collapses into `css()`. No pattern helper farm. |
| `styled-system/recipes/*.d.ts` (per-recipe modules) | `TYP-FORBID-04` | **REFUSE (Forbidden)** | Recipes are declared data; `recipe()` runtime is authored TypeScript. No per-recipe module filesystem tree. |
| `styled-system/tokens/index.mjs` (runtime token dictionary) | `TYP-FORBID-05` | **REFUSE (Forbidden)** | Runtime tokens are CSS variables in `@layer tokens`. Zero runtime JS reflection dictionary. |
| Atomic utility class names in `.d.ts` (`.mt_2r`, `_mt`) | `TYP-FORBID-01` | **REFUSE (Forbidden)** | Atomic class names are strictly private compiler outputs; users never author or inspect them in types. |
| Whole-farm codegen AST in Rust (`pandacss_codegen`) | `TYP-FORBID-06` | **REFUSE (Forbidden)** | Typegen takes `BaseSystem` + `canon` and emits string unions. It does not depend on `atomic` or the compiled atom set. |
| `strictTokens` / `strictPropertyValues` | `TYP-STRICT-01`–`05` | **Replace with owned wrappers** | Composable TypeScript wrappers (`StrictColorProps`, `StrictRadiiProps`, `StrictSpacingProps`) configured via `ui.config.ts`. |

---

## 4. API & Generation Freeze Decisions

1. **BaseSystem + Canon as Exclusive Inputs:** Typegen reads token names and categories from `BaseSystem`, and platform/dialect properties from `canon`. It never accesses compiler internal tables, AST leaves, or the compiled `AtomSet`. If `n300` is declared under `colors`, `bg="n300"` typechecks regardless of whether the engine prints `.bg_n300` or `.background_n300`.
2. **Killing the Panda `SystemStyleObject` Alias:** `SystemStyleObject` must be an owned type definition authored in `packages/reference-core/src/types/` (and printed by typegen in generated packages), composed of `csstype.Properties`, Reference UI token unions, dialect property overrides, and recursive nesting. Re-exporting from `@reference-ui/styled/types` is strictly forbidden.
3. **Container-Query-First Condition Keys:** `StylePropValue<T>` supports plain `T`, responsive arrays `Array<T | null>`, and condition object maps. Default public condition keys filter out viewport breakpoints (`sm`, `md`, `lg`, etc.) in favor of container query conditions (`@sm`, `@md`), theme modes (`_dark`, `_light`), and pseudo-selectors (`_hover`, `_focusVisible`).
4. **Author-Owned FontRegistry Interface Augmentation:** Fonts declared via `font()` generate interface augmentations for `FontRegistry`. When empty, `FontProps` falls back to `string` without causing `StyleProps` to collapse to `never`. When populated, `FontProps` narrows `font` to known names and `weight` to weights registered for that specific font.
5. **Open Autocomplete by Default, Strict on Opt-In:** By default, token properties use `TokenUnion | (string & {})` to provide instant IDE autocomplete while allowing raw CSS escape hatches. When `strict: ['colors', ...]` is configured in `ui.config.ts`, the `(string & {})` escape hatch is stripped, restricting values strictly to declared tokens plus standardized CSS keywords (`white`, `black`, `currentColor`, `inherit`, `transparent`).
6. **Zero Atomic Class Names in Typings:** No type definition emitted by typegen may include generated class names (`.mt_2r`), atom identifiers, or compiler hashes.

---

## 5. Source Evidence

- `packages/reference-core/src/types/plan.md`: Mandates owning `SystemStyleObject`, using `csstype`, eliminating viewport breakpoints as public defaults, and treating generated unions as primitive ingredients.
- `packages/reference-core/src/types/public/system-style-object.ts`: Current leftover alias importing `SystemStyleObject as StyledSystemStyleObject` from `@reference-ui/styled/types`.
- `packages/reference-core/src/types/public/colors.ts`: Canonical catalog of 38 `COLOR_PROP_KEYS` and `StrictColorProps` wrapping logic.
- `packages/reference-core/src/types/public/radii.ts`: Canonical catalog of 14 `RADII_PROP_KEYS` and `StrictRadiiProps` wrapping logic.
- `packages/reference-core/src/types/public/fonts.ts`: Implementation of `FontProps` discriminated union and `[FontName] extends [never]` fallback guard.
- `packages/reference-core/src/types/generators/strict.ts`: Generator orchestrating composition of strict property wrappers based on `ui.config.ts`.
- `packages/reference-core/src/types/generators/fonts.ts`: Generator compiling `FontDefinition[]` into `FontRegistry` interface declarations.
- `vendor/panda/crates/pandacss_codegen/src/artifacts/types.rs`: Panda's codegen architecture demonstrating the failure mode of generating whole file farms (`types/jsx`, `types/pattern`, `types/recipe`, `types/system`) from compiler context.

---

## 6. Required Cases

### Token Unions (`TYP-TOKEN-*`)

- [ ] `TYP-TOKEN-01` `[reference]` `[unit]` —  
  **Typegen should emit a string literal union of color token keys from BaseSystem.**  
  Pass a `BaseSystem` declaring colors `{ n100: { value: '...' }, n300: { value: '...' }, brand: { primary: { value: '...' } } }`. Assert the emitted declaration defines `type ColorToken = 'n100' | 'n300' | 'brand.primary'`, joining nested tokens with dot notation. The failure mode is emitting `string`, using underscores, or omitting nested scales.

- [ ] `TYP-TOKEN-02` `[reference]` `[unit]` —  
  **Typegen should emit spacing and rhythm token unions preserving fractional rhythm literals.**  
  Pass a `BaseSystem` declaring spacing tokens `'1'`, `'2'`, `'4'` and rhythm fractions `'1/2r'`, `'1r'`, `'2r'`. Assert the emitted `type SpacingToken` contains `'1' | '2' | '4' | '1/2r' | '1r' | '2r'`. The failure mode is stripping the `'r'` unit or rejecting slash fractions, causing valid rhythm style props to fail typechecking.

- [ ] `TYP-TOKEN-03` `[reference]` `[unit]` —  
  **Typegen should emit border radius token unions matching declared radii.**  
  Pass a `BaseSystem` declaring radii `'none'`, `'sm'`, `'md'`, `'lg'`, `'full'`. Assert the emitted `type RadiusToken` equals `'none' | 'sm' | 'md' | 'lg' | 'full'`. The failure mode is omitting `'none'` or failing to quote numeric-named radius keys.

- [ ] `TYP-TOKEN-04` `[reference]` `[unit]` —  
  **Typegen should emit discrete typography token unions for font sizes, font weights, and line heights.**  
  Pass a `BaseSystem` declaring typography tokens for sizes (`xs`, `sm`, `base`, `lg`), weights (`regular`, `medium`, `bold`), and line heights (`tight`, `normal`). Assert emitted types include `type FontSizeToken`, `type FontWeightToken`, and `type LineHeightToken` exactly matching declared keys. The failure mode is collapsing typography scales into generic strings or conflating sizes with line heights.

- [ ] `TYP-TOKEN-05` `[reference]` `[unit]` —  
  **Typegen should emit elevation, shadow, and z-index token unions.**  
  Pass a `BaseSystem` declaring shadow tokens (`sm`, `md`, `overlay`) and z-index tokens (`modal`, `toast`, `tooltip`). Assert emitted declarations define `type ShadowToken = 'sm' | 'md' | 'overlay'` and `type ZIndexToken = 'modal' | 'toast' | 'tooltip'`. The failure mode is leaking raw CSS box-shadow values into the union or dropping semantic z-index identifiers.

- [ ] `TYP-TOKEN-06` `[reference]` `[unit]` —  
  **Typegen should assemble an aggregate Tokens dictionary indexing all category unions.**  
  Pass a `BaseSystem` containing multiple categories into typegen. Assert emitted declarations export an aggregate interface `Tokens` where `Tokens['colors']`, `Tokens['spacing']`, and `Tokens['radii']` index the respective category unions. The failure mode is structural drift that breaks token indexing in consumer libraries.

---

### StyleProps & SystemStyleObject (`TYP-STYLE-*`)

- [ ] `TYP-STYLE-01` `[reference]` `[unit]` —  
  **Typegen should emit a Reference UI-owned SystemStyleObject without importing Panda styled types.**  
  Inspect the emitted `system-style-object.d.ts` declaration file. Assert `SystemStyleObject` is assembled from `csstype.Properties` and Reference UI token unions, and contains zero imports from `@reference-ui/styled` or `@pandacss/*`. The failure mode is re-exporting `StyledSystemStyleObject` or leaving Panda as an underlying dependency.

- [ ] `TYP-STYLE-02` `[reference]` `[unit]` —  
  **Typegen should narrow StyleProps properties using BaseSystem tokens while preserving canonical aliases.**  
  Inspect emitted `StyleProps` definitions for canonical props and shorthand aliases (e.g. `bg`, `backgroundColor`, `color`, `p`, `padding`, `mt`, `marginTop`). Assert color properties accept `StylePropValue<ColorToken | (string & {})>` and spacing properties accept `StylePropValue<SpacingToken | (string & {})>`. The failure mode is missing shorthand aliases or failing to provide IDE autocomplete for tokens.

- [ ] `TYP-STYLE-03` `[reference]` `[unit]` —  
  **Typegen should filter out viewport breakpoint keys from public StylePropValue condition types.**  
  Inspect `StylePropValue<T>` and `StyleConditionKey` in emitted declarations. Assert `StylePropValue<T>` allows plain `T`, array notation `Array<T | null>`, and condition objects containing pseudo-selectors (`_hover`, `_focusVisible`), color modes (`_dark`, `_light`), and container queries (`@sm`, `@md`), while excluding viewport keys (`sm`, `md`, `lg`, `smToMd`). The failure mode is polluting property autocompletion with 25+ viewport breakpoint names.

- [ ] `TYP-STYLE-04` `[reference]` `[unit]` —  
  **Typegen should layer Reference UI dialect properties on StyleProps while omitting conflicting raw CSS props.**  
  Inspect the relationship between `StyleProps`, `SystemStyleObject`, and `ReferenceProps`. Assert `StyleProps` omits raw CSS `font`, `weight`, `container`, and `r`, replacing them with typed dialect interfaces `container?: StylePropValue<string | boolean>`, `r?: StylePropValue<Record<string | number, SystemStyleObject>>`, and `FontProps`. The failure mode is allowing CSS shorthand `font` to collide with Reference UI's scoped font family prop.

- [ ] `TYP-STYLE-05` `[reference]` `[unit]` —  
  **Typegen should support recursive selector and condition nesting without compiler recursion limits.**  
  Author a deeply nested style object targeting multiple pseudos and child selectors (e.g. `_hover: { _dark: { '& > span': { color: 'n300' } } }`). Assert `SystemStyleObject` typechecks without triggering TypeScript compiler recursion depth limits (TS2589). The failure mode is unconstrained recursive expansion causing `Type instantiation is excessively deep and possibly infinite`.

---

### Recipe Variant Types (`TYP-RECIPE-*`)

- [ ] `TYP-RECIPE-01` `[reference]` `[unit]` —  
  **Typegen should derive recipe variant prop types from declared BaseSystem recipe tables.**  
  Pass a `BaseSystem` declaring a recipe `button` with variants `{ size: { sm: {...}, lg: {...} }, tone: { quiet: {...}, loud: {...} } }`. Assert emitted declarations export `type ButtonVariantProps = { size?: 'sm' | 'lg'; tone?: 'quiet' | 'loud' }` with all variant keys optional. The failure mode is emitting `string` for variant keys or making variant selections mandatory.

- [ ] `TYP-RECIPE-02` `[reference]` `[unit]` —  
  **Typegen should constrain compound variant definitions to valid variant combinations.**  
  Declare a recipe with compound variants in `BaseSystem` (e.g. `compoundVariants: [{ size: 'sm', tone: 'loud', css: {...} }]`). Assert the emitted recipe type enforces that compound variant match criteria are subsets of declared variant literal unions. The failure mode is allowing arbitrary string combinations in compound variants without type validation.

- [ ] `TYP-RECIPE-03` `[reference]` `[unit]` —  
  **Typegen should provide Reference UI-owned RecipeDefinition contracts without re-exporting Panda recipe types.**  
  Inspect `packages/reference-core/src/types/public/recipe.ts`. Assert `RecipeCreatorFn`, `RecipeDefinition`, `RecipeRuntimeFn`, `RecipeSelection`, and `RecipeVariantProps` are declared as owned TypeScript interfaces, eliminating all imports from `@reference-ui/styled/types/recipe`. The failure mode is re-exporting recipe types from the Panda styled package.

---

### Font Registry (`TYP-FONT-*`)

- [ ] `TYP-FONT-01` `[reference]` `[unit]` —  
  **Typegen should emit a FontRegistry interface augmentation matching declared font families and weights.**  
  Pass a `BaseSystem` with fonts `sans` (weights `['400', '700']`) and `mono` (weights `['300', '500']`). Assert emitted declarations include `interface FontRegistry { 'sans': { '400': true; '700': true }; 'mono': { '300': true; '500': true } }`. The failure mode is omitting declared weights or generating unquoted identifier syntax that breaks non-alphanumeric font names.

- [ ] `TYP-FONT-02` `[reference]` `[unit]` —  
  **Typegen should narrow FontProps discriminated pairs and scoped weight literals.**  
  Inspect `FontProps` resolved against a populated `FontRegistry`. Assert that setting `font="sans"` restricts `weight` to `'400' | '700' | 'sans.400' | 'sans.700'`, while rejecting weights belonging only to `'mono'`. The failure mode is allowing mismatched font family and weight combinations across distinct fonts.

- [ ] `TYP-FONT-03` `[reference]` `[unit]` —  
  **Typegen should gracefully fall back to string font props when FontRegistry is empty.**  
  Inspect `FontProps` when `FontRegistry` is an empty interface `{}`. Assert `FontProps` falls back to `{ font?: StylePropValue<string>; weight?: StylePropValue<string> }` and `StyleProps` remains fully usable. The failure mode is `[FontName] extends [never]` collapsing `ScopedFontProps` to `never` and destroying all primitive style props.

---

### Strict Token Enforcement (`TYP-STRICT-*`)

- [ ] `TYP-STRICT-01` `[reference]` `[unit]` —  
  **Typegen should restrict color properties to declared tokens and CSS keywords in strict colors mode.**  
  Configure `strict: ['colors']` in `ui.config.ts`. Assert all 38 `COLOR_PROP_KEYS` (including `bg`, `color`, `borderColor`) strictly accept `ColorToken | 'white' | 'black' | 'inherit' | 'currentColor' | 'transparent'`, and reject arbitrary CSS color strings such as `'#123456'` or `'red'`. The failure mode is allowing arbitrary strings via `(string & {})` in strict mode.

- [ ] `TYP-STRICT-02` `[reference]` `[unit]` —  
  **Typegen should restrict radius properties to declared tokens and keywords in strict radii mode.**  
  Configure `strict: ['radii']` in `ui.config.ts`. Assert all 14 `RADII_PROP_KEYS` (including `borderRadius`, `rounded`, `roundedTop`) strictly accept `RadiusToken | 'none' | 'inherit' | 'initial' | 'revert'`, and reject arbitrary length strings like `'16px'`. The failure mode is permitting arbitrary string values on radius props when strict radii is configured.

- [ ] `TYP-STRICT-03` `[reference]` `[unit]` —  
  **Typegen should restrict spacing and rhythm properties to declared tokens and keywords in strict spacing mode.**  
  Configure `strict: ['spacing']` in `ui.config.ts`. Assert spacing properties (`m`, `mt`, `p`, `px`, `gap`) strictly accept `SpacingToken | 0 | '0' | 'auto' | 'inherit'`, and reject arbitrary dimension strings like `'13px'`. The failure mode is allowing untokenized numeric pixel strings when strict spacing is configured.

- [ ] `TYP-STRICT-04` `[reference]` `[unit]` —  
  **Typegen should allow arbitrary CSS escape hatches with token autocomplete when strict mode is unconfigured.**  
  Configure `strict: []` or omit `strict` in `ui.config.ts`. Assert color, radius, and spacing properties typecheck with arbitrary strings while preserving IDE token autocompletion via `Token | (string & {})`. The failure mode is triggering type errors on arbitrary CSS values in open mode.

- [ ] `TYP-STRICT-05` `[reference]` `[unit]` —  
  **Typegen should compose multiple active strict category wrappers in deterministic order.**  
  Configure `strict: ['colors', 'radii']` in `ui.config.ts`. Assert emitted `system-style-object.d.ts` wraps the base style object in declaration order (`StrictRadiiProps<StrictColorProps<BaseSystemStyleObject>>`) and deduplicates repeated entries. The failure mode is applying only the last wrapper or generating invalid nested generic syntax.

---

### Forbidden Codegen & Invariants (`TYP-FORBID-*`)

- [ ] `TYP-FORBID-01` `[forbidden]` `[unit]` —  
  **Typegen must never emit atomic utility class names in generated declaration files.**  
  Run typegen on a complete `BaseSystem` and search all emitted declaration output. Assert there are zero occurrences of atomic utility class names (e.g. `.mt_2r`, `.bg_n300`, `atomic/*`, class name string unions). The failure mode is exposing internal atomic class names in public typings.

- [x] `TYP-FORBID-02` `[forbidden]` `[unit]` —  
  **Typegen must never emit a JSX component factory or styled element farm.**  
  Run typegen on a complete `BaseSystem`. Assert typegen emits zero JSX component wrappers (`styled.div`, `styled.span`, `HTMLStyledProps`, `StyledComponent`, `JsxFactory`). The failure mode is generating Panda's `types/jsx` farm for primitives that already exist as authored React in `@reference-ui/react`.

- [ ] `TYP-FORBID-03` `[forbidden]` `[unit]` —  
  **Typegen must never emit layout pattern helper functions or types.**  
  Run typegen on a complete `BaseSystem`. Assert typegen emits zero pattern types or interfaces (`BoxProps`, `FlexProps`, `StackProps`, `GridProps`, `patterns/*`). The failure mode is generating Panda's `types/pattern` farm for layouts already covered by tag primitives.

- [ ] `TYP-FORBID-04` `[forbidden]` `[unit]` —  
  **Typegen must never emit recipes as individual TypeScript module declaration files.**  
  Run typegen on a `BaseSystem` declaring multiple recipes. Assert variant types are emitted as pure data type definitions in a central types file, and no per-recipe module directory (e.g. `recipes/button.d.ts`, `recipes/badge.d.ts`) is generated. The failure mode is producing a filesystem tree of individual recipe TypeScript modules.

- [ ] `TYP-FORBID-05` `[forbidden]` `[unit]` —  
  **Typegen must never emit runtime JavaScript token reflection dictionaries.**  
  Run typegen on a complete `BaseSystem`. Assert typegen emits strictly declaration files (`.d.ts`) and zero executable runtime JavaScript files (`tokens.mjs`, `token('colors.n300')` accessor functions). The failure mode is generating runtime JavaScript mirrors of token trees.

- [ ] `TYP-FORBID-06` `[forbidden]` `[unit]` —  
  **Typegen must not depend on the atomic crate or require compiled AtomSet input.**  
  Inspect `Cargo.toml` and module imports for `modules/typegen`. Assert `typegen` depends only on `base_system` and `canon`, with zero dependencies on `atomic` or knowledge of compiled stylesheets. The failure mode is coupling type generation to the atomic CSS compilation pipeline.

---

## 7. Existing Proof Map

| Contract ID | Proof Harness | Test Location / Function Name | Status |
| :--- | :--- | :--- | :--- |
| `TYP-TOKEN-01` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-TOKEN-02` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-TOKEN-03` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-TOKEN-04` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-TOKEN-05` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-TOKEN-06` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-STYLE-01` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-STYLE-02` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-STYLE-03` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-STYLE-04` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-STYLE-05` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-RECIPE-01` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-RECIPE-02` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-RECIPE-03` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-FONT-01` | `[unit]` | `none` (prototype in `generators/fonts.test.ts`) | `[ ]` Pending contract rename |
| `TYP-FONT-02` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-FONT-03` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-STRICT-01` | `[unit]` | `none` (prototype in `generators/strict.test.ts`) | `[ ]` Pending contract rename |
| `TYP-STRICT-02` | `[unit]` | `none` (prototype in `generators/strict.test.ts`) | `[ ]` Pending contract rename |
| `TYP-STRICT-03` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-STRICT-04` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-STRICT-05` | `[unit]` | `none` (prototype in `generators/strict.test.ts`) | `[ ]` Pending contract rename |
| `TYP-FORBID-01` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-FORBID-02` | `[unit]` | `packages/reference-rs/modules/typegen/src/lib.rs::tests::scaffold_emits_no_jsx_farm` | `[x]` Proven |
| `TYP-FORBID-03` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-FORBID-04` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-FORBID-05` | `[unit]` | `none` | `[ ]` Pending implementation |
| `TYP-FORBID-06` | `[unit]` | `none` | `[ ]` Pending implementation |

---

## 8. Remaining Work Ordered by Priority

1. **Kill the Panda `SystemStyleObject` Alias (`TYP-STYLE-01`):**  
   Replace `export type SystemStyleObject = StyledSystemStyleObject` in `packages/reference-core/src/types/public/system-style-object.ts` with an owned `SystemStyleObject` assembled from `csstype` and token unions. Update `strict.ts` to wrap this owned type rather than Panda's.
2. **Kill the Panda Recipe Re-Exports (`TYP-RECIPE-03`):**  
   Replace re-exports from `@reference-ui/styled/types/recipe` in `packages/reference-core/src/types/public/recipe.ts` with owned `RecipeDefinition` and `RecipeVariantProps` interfaces.
3. **Token Category Unions from BaseSystem (`TYP-TOKEN-01`–`06`):**  
   Implement pure union printer taking `BaseSystem` and generating `ColorToken`, `SpacingToken`, `RadiusToken`, typography unions, and the composite `Tokens` dictionary.
4. **StyleProps Narrowing & Condition Sanitization (`TYP-STYLE-02`–`05`):**  
   Wire canon properties and aliases to token unions. Eliminate the `@reference-ui/styled/types/conditions` import in `conditions.ts` by deriving `StyleConditionKey` directly from `canon::conditions`.
5. **Strict Token Enforcement (`TYP-STRICT-01`–`05`):**  
   Expand `generators/strict.ts` to support strict spacing (`StrictSpacingProps`), and add comprehensive unit tests validating open vs. strict token rejection.
6. **Recipe Variant Types Derivation (`TYP-RECIPE-01`–`02`):**  
   Emit recipe variant prop types from declared recipe tables in `BaseSystem`.
7. **Font Registry Typings & Discrimination (`TYP-FONT-01`–`03`):**  
   Unify font registry codegen under the `TYP-FONT-*` contract, proving discriminated weight narrowing and empty-registry safety.
8. **Forbidden Codegen Verification (`TYP-FORBID-01`, `03`–`06`):**  
   Implement negative assertion tests in `typegen/src/lib.rs` proving no atomic class names, no layout patterns, no recipe modules, no runtime token mirrors, and no dependency on `atomic`.

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
9. **Do not allow `[FontName] extends [never]` to collapse `ScopedFontProps` to `never`:** When `FontRegistry` is unaugmented, `FontProps` must safely intersect with `unknown` / `FallbackFontProps`, never collapsing `StyleProps` to `never`.
10. **Do not emit a 12-file type farm:** Typegen emits clean, focused declaration modules. Do not replicate Panda's monolithic AST machinery to print string unions.
