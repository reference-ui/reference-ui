# Generated package shape probe

Source: `packages/reference-lib/.reference-ui/` (core + Panda v1, 2026-09-16 tree), consumers in `packages/reference-lib` + `matrix/`, Neo publish in `packages/reference-neo/src/{sync,primitives}`, inventory in `packages/reference-rs/PLAN.md` §3.5. Read-only; no repo writes.

## 1. Executive summary

Consumers of `@reference-ui/lib` almost never import Panda’s generated `css()`/`jsx`/`patterns` package. They import **`@reference-ui/react`** (101 HTML primitives, `css`/`recipe`, `StyleProps`/`PrimitiveProps`, color-mode + `data-layer` contexts) and **`@reference-ui/system`** (`tokens`/`font`/`keyframes`/`globalCss`). Stylesheets enter via **`@reference-ui/react/styles.css`**. `Box` is a Panda pattern, not a lib primitive.

Today’s `.reference-ui/styled/` is still a full Panda outdir (`css/`, `jsx/`, `patterns/`, `helpers.js`, `global.css`, panda banner) **plus** native `runtime-data.mjs` (~3752 style plans) and assembled `styles.css`. `react.mjs` (2781 lines) is **core-authored**, Liquid-templated primitives bundled with `forwardRef`, wrapping Panda `css`/`cva`.

`PLAN.md` §3.5 forbids executable styled machinery and obsolete Panda paths after sync. Neo already emits `styles.css`, `runtime-data.mjs`, a **styled `css.mjs` bundle**, `system/baseSystem.mjs`, and a **string-built** react entry (`index.mjs`, not `react.mjs`). Gaps: PortableBaseSystem shape, `compile-request.json`, native `styled/types`, package `exports`/filenames matching lib, authoring APIs on `@reference-ui/system`, color-mode attribute (`data-panda-theme` today vs PLAN `data-theme` vs Neo `data-color-mode`), and deleting Panda trees.

`packages/reference-core/src/system/styled` is **gitignored and absent**. `@reference-ui/types` (Tasty/Reference runtime) is a fourth generated package not listed in §3.5; lib still publishes it.

## 2. Folder census

Classification: **P** = Panda machinery (executable `css`/`cva`/`jsx`/`patterns`), **R** = Reference-owned runtime, **D** = pure data (CSS/JSON/types).

| Path | Files (approx) | Lines / size | Exports / contents | Class |
| :--- | ---: | :--- | :--- | :--- |
| `.reference-ui/panda.config.ts` | 1 | 7737 / 260 KB | Generated driver: `defineConfig(getPandaConfig())`. **Top-level `baseConfig` keys (first 60 lines / JSON object):** `presets`, `jsxFramework`, `preflight`, `importMap`, `include`, `exclude`, `outdir`, `outExtension`, `hash`, `staticCss`. Rest of file is fragment collectors + `extendPatterns` / `extendUtilities` / `extendGlobalCss`; theme/conditions live inside `getPandaConfig()`, not as source keys. | P |
| `.reference-ui/node_modules/@pandacss/` | 3 symlinks | — | `dev`, `node`, `types` → workspace pnpm Panda 1.11.1 | P |
| `.reference-ui/styled/package.json` | 1 | 57 | name `@reference-ui/styled`; exports `.`, `./css`, `./css/{cva,cx,sva}`, `./jsx`, `./patterns`, `./patterns/box`, `./tokens`, `./tokens/*`, `./types`, `./types/*` | P+D |
| `styled/css/` | 11 | css.js 44; cva.js 87 | `css`, `cva`, `cx`, `sva` (+ `.d.ts`) | P |
| `styled/jsx/` | 49 | — | `styled` factory + pattern JSX (`box`, `flex`, `stack`, … `cq`); `HTMLStyledProps` | P |
| `styled/patterns/` | ~42 | — | Same pattern fns as jsx (class-name helpers) | P |
| `styled/recipes/` | 5 | — | `fontStyle` recipe + `create-recipe.js` | P |
| `styled/helpers.js` | 1 | 327 | Panda helper bundle: `createCss`, `splitProps`, `mergeProps`, `toHash`, … (see §5) | P |
| `styled/extensions/index.mjs` | 1 | 2597 | Core-bundled Panda config extensions (fonts, rhythm, tokens) consumed **only** by `panda.config.ts` | R (build) |
| `styled/tokens/` | 3 | — | `token()` + token **unions** (`SpacingToken`, `ColorToken`, …) | D |
| `styled/themes/` | 4 | — | `ThemeName` `'light' \| 'dark'`; `getTheme` / `injectTheme`; JSON CSS blobs | D/P |
| `styled/types/` | 14 | csstype 22 570; style-props 8174 | Native-needed typegen surface + Panda `global.d.ts` (`@pandacss/dev` module) | D (Panda-shaped) |
| `styled/styles.css` | 1 | 27 472 | Assembled sheet (`@layer reset` …); **2** `[data-panda-theme=light\|dark]` rules; copied to `react/styles.css` | D |
| `styled/global.css` | 1 | 1743 | Panda `@layer base` + `--made-with-panda: '🐼'` | P/D |
| `styled/runtime-data.mjs` + `.d.mts` | 2 | 49 905 / 3 | `NativeRuntimeArtifact`; calls `registerRuntimePlans` from `@reference-ui/react` | D (+ R hook) |
| `.reference-ui/react/package.json` | 1 | 14 | `@reference-ui/react` exports `.` → `react.mjs` / `react.d.mts`; `./styles.css` | R |
| `react/react.mjs` | 1 | 2781 | Bundled primitives + `css`/`recipe`/`useColorMode`/contexts (see §5–6) | R |
| `react/react.d.mts` | 1 | 1 | `export * from './entry/react'` | R |
| `react/entry/react.d.ts` | 1 | 8 | Re-exports primitives; `css`, `cva as recipe`; `export type *` from `types` | R |
| `react/system/primitives/` | index + tags/types/utils `.d.ts` + `shared/` | 101 `export declare const` | Tag components `A`…`Wbr`; `HTML_TAGS`; contexts | R |
| `react/types/public/` | 17 `.d.ts` | — | Authored public graph: `StyleProps`, `SystemStyleObject`, `PrimitiveProps`, fonts, recipes, … | R |
| `react/types.generated.d.mts` | 1 | 26 | `FontRegistry` interface | D |
| `react/styles.css` | 1 | 27 472 | Duplicate of `styled/styles.css` | D |
| `.reference-ui/system/package.json` | 1 | 17 | `.` → `system.mjs`; `./baseSystem` | R |
| `system/system.mjs` | 1 | 141 | `tokens`, `keyframes`, `font`, `globalCss`, `getRhythm` | R |
| `system/baseSystem.mjs` + `.d.mts` | 2 | 61 / 2 | `export const baseSystem`; types from `@reference-ui/core` | D/R |
| `system/evaluated-system.json` | 1 | — | Evaluated spec (Rust input) | D |
| `system/compile-request.json` | 1 | — | `schemaVersion`, `spec`, `jsxHosts` (`['MonoText']` here), `sourceRoot` (virtual), `declarationRoot` (staging) | D |
| `system/jsx-elements.json` | 1 | — | `{ primitives: 101, upstream: 0, local: 53, merged: 154 }` | D |
| `system/font-registry.json` | 1 | — | `sans`/`serif`/`mono` weight maps | D |
| `system/lib/fragments`, `system/system/{api,panda,primitives}` | dirs | — | Packaged core fragments / panda / primitive **types** for the system bundle | R |
| `system/types/` | same public graph as react | — | `export type * from './public'` | R |
| `.reference-ui/types/` | package `@reference-ui/types` | types.mjs 7328 | `Reference`, `createReferenceComponent`, Tasty `./manifest` `./runtime`; **not** StyleProps | R/D |
| `.reference-ui/virtual/` | 336 files | — | Sync/Book virtual sources (`src/`, `book/`, `_reference-component`) | R (workspace) |
| `.reference-ui/tmp/` | 3 | — | `config.snapshot.json`, `session.json`, `session.lock` | R (session) |
| `book-perf.jsonl` | 1 | — | Book perf log | incidental |

**§3.5 quote (intended native inventory):**

> | Path | Contents | Negative assertion |
> | `.reference-ui/system/evaluated-system.json` | Exact versioned Rust input | no functions, no core portable shape |
> | `.reference-ui/system/baseSystem.mjs` + `.d.mts` | `PortableBaseSystem` | no missing `cssChunks` or `runtime`; no unlabelled flattened `fragment` |
> | `.reference-ui/system/compile-request.json` | `NativeCompileRequest` | no missing `jsxHosts` / `declarationRoot` |
> | `.reference-ui/styled/styles.css` | final assembled native CSS | no `data-panda-theme`, no Panda banner |
> | `.reference-ui/styled/runtime-data.mjs` + `.d.mts` | merged native runtime data | no generated namer or fallback code |
> | `.reference-ui/styled/types/index.d.ts` | native typegen | no `@pandacss` import |
> | `.reference-ui/styled/types/csstype.d.ts` | vendored if required | no consumer-hoisted `csstype` |
> | `.reference-ui/react/**` | Core-authored runtime/primitives/types wired to data | no styled `css/cva/jsx/patterns` imports |
>
> After sync, obsolete `panda.config.ts`, `styled/global.css`, `styled/css/`, `styled/jsx/`, and `styled/patterns/` paths must not exist.

**Today vs that quote:** evaluated-system + compile-request + runtime-data already exist (hybrid). `styles.css` still has `data-panda-theme`. `styled/types/global.d.ts` imports `@pandacss/dev`. `react.mjs` **imports `@reference-ui/styled/css`**. All five obsolete paths **exist**. `baseSystem.mjs` is not yet the contract `PortableBaseSystem` (`schemaVersion`, `fragments[]`, `cssChunks[]`, `runtime`).

## 3. Consumer import census

`apps/` is absent. Commands run as specified (`from '…'` / `"…"`).

### 3.1 Specifier counts

**`packages/reference-lib/src`**

| Count | Specifier |
| ---: | :--- |
| 91 | `from '@reference-ui/react'` |
| 31 | `from '@reference-ui/system'` |
| 1 | `from "@reference-ui/react"` |

**`packages/reference-lib/scripts`:** zero `from '@reference-ui/…'` matches. (`materialize-runtime.mjs` **rewrites** those specifiers as strings when packaging dist.)

**`matrix/`**

| Count | Specifier |
| ---: | :--- |
| 54 | `from '@reference-ui/react'` |
| 14 | `from '@reference-ui/system'` |
| 1 | `from '@reference-ui/system/baseSystem'` |

**No `from '@reference-ui/styled…'` in lib `src/`.** Styled is an implementation dependency of generated `react.mjs` and of `scripts/materialize-runtime.mjs` / `tsconfig` paths (`@reference-ui/styled`, `@reference-ui/styled/jsx`, `@reference-ui/styled/*`).

**Path / CSS imports**

- `src/index.ts`: `export { baseSystem } from '../.reference-ui/system/baseSystem.mjs'`
- `scripts/build-package.mjs`: copies `baseSystem.mjs` + `.d.mts`
- Stylesheet: `import '@reference-ui/react/styles.css'` in `book/decorator/BookDecorator.tsx`, `playwright/main.tsx`; `tsconfig` + `book/vite.config.ts` alias; `src/global.d.ts` module declaration. **No consumer import of `styled/global.css` or `styled/styles.css` by those names.**

### 3.2 Named imports (aggregated, including `import type`)

**Lib `src` → `@reference-ui/react`** (298 names, 76 unique). Top:

| n | name | n | name |
| ---: | :--- | ---: | :--- |
| 77 | `Div` | 45 | `Span` |
| 25 | `Button` | 23 | `PrimitiveProps` |
| 11 | `Input`, `P` | 8 | `PrimitiveElement` |
| 6 | `H3` | 5 | `H4` |
| 4 | `H2`, `Small` | 3 | `Code`, `StyleProps`, `Label` |
| 2 | `A`, table tags, `LayerScopeContext` | 1 | remaining tags, `recipe`, `RecipeVariantProps`, `ColorModeContext`, `DocumentContext`, `PrimitiveTag` |

Lib **does not** import `css` from react (matrix does). No `Box`, `Flex`, `Stack` from react.

**Lib `src` → `@reference-ui/system`** (31 / 4 unique): `globalCss` 18, `tokens` 6, `keyframes` 6, `font` 1.

**Matrix → `@reference-ui/react`** (136 / 30): `Div` 27, `Main` 25, `H1`/`P` 15, **`css` 12**, `recipe` 7, `Button` 5, plus `StyleProps`, `RecipeVariantProps`, `FontRegistry`/`FontName`/`FontProps`/`FontWeightName`, `CssStyles`, `ResponsiveProps`, `BaseSystem`, `DivProps`, …

**Matrix → `@reference-ui/system`:** `tokens` 11, `font`/`keyframes` 2, `SystemStyleObject` 2, `globalCss`/`getRhythm`/`KeyframesConfig`/`ReferenceTokenConfig`/`TokenConfig` 1 each. **`baseSystem` from `@reference-ui/system/baseSystem`:** 1.

## 4. Type surface

### 4.1 `styled/types/` (Panda typegen; `index.d.ts` re-exports)

| File | Top-level exports (names) |
| :--- | :--- |
| `index.d.ts` | re-exports conditions, pattern, recipe, system-types, jsx, style-props; side-import `global.d.ts` |
| `system-types.d.ts` | `Pretty`, `DistributiveOmit`, `DistributiveUnion`, `Assign`, `ModernCssProperties`, `CssProperty`, `CssProperties`, `CssKeyframes`, `NestedCssProperties`, **`SystemStyleObject`**, `GlobalStyleObject`, `ExtendableGlobalStyleObject`, `CompositionStyleObject`, `GlobalFontfaceRule`, `FontfaceRule`, `GlobalFontface`, `ExtendableGlobalFontface`, `JsxStyleProps`, `PatchedHTMLProps`, `OmittedHTMLProps`, `JsxHTMLProps` |
| `style-props.d.ts` | `CssVarProperties`, **`SystemProperties`** (huge ConditionalValue map, 8174 lines) |
| `conditions.d.ts` | **`Conditions`**, **`ConditionalValue`**, **`Nested`** |
| `recipe.d.ts` | `RecipeVariantRecord`, `RecipeSelection`, `RecipeVariantFn`, `RecipeVariantProps`, `RecipeVariant`, `RecipeRuntimeFn`, `RecipeCompoundSelection`, `RecipeCompoundVariant`, `RecipeDefinition`, `RecipeCreatorFn`, `RecipeConfig`, slot-recipe twins |
| `pattern.d.ts` | `PatternProperty`, `PatternHelpers`, `PatternProperties`, `PatternDefaultValue(Fn)`, `PatternConfig` |
| `jsx.d.ts` | `DataAttrs`, `UnstyledProps`, `AsProps`, `ComponentProps`, `StyledComponent`, `JsxFactoryOptions`, `JsxRecipeProps`, `JsxElement`, `JsxFactory`, `JsxElements`, `Styled`, **`HTMLStyledProps`**, `StyledVariantProps` |
| `prop-type.d.ts` | `UtilityValues`, `WithEscapeHatch`, `OnlyKnown` |
| `csstype.d.ts` | vendored csstype (`Properties`, `Globals`, `Pseudos`, hyphen/fallback variants, …) |
| `composition.d.ts` | `TextStyle(s)`, `LayerStyle(s)`, `AnimationStyle(s)`, `CompositionStyles` |
| `selectors.d.ts` | `AnySelector`, `Selectors` |
| `static-css.d.ts` | `CssRule`, `RecipeRule(Object)`, `PatternRule`, `StaticCssOptions` |
| `parts.d.ts` | `Part`, `Parts` |
| `global.d.ts` | **`declare module '@pandacss/dev'`** — forbidden by §3.5 |

`tokens/tokens.d.ts`: `Token`, `ColorPalette`, `SpacingToken`, `ColorToken`, `RadiusToken`, `FontToken`, `AnimationToken`, `FontWeightToken`, `Tokens`, `TokenCategory`.

### 4.2 `.reference-ui/types/` (`@reference-ui/types`)

Not the StyleProps graph. Barrel: `Reference`, `createReferenceComponent`, runtime providers/hooks, Tasty `manifest` / `runtime`. Used by the Reference component / docs, not by ordinary part styling.

### 4.3 Consumer-facing types (on `@reference-ui/react` / `system`, from `types/public/`)

`BaseSystem`, `CssFunction`, `CssRawFunction`, `CssStyles`, color/radii strict+safe, `FontName`, `FontProps`, `FontWeightName`, `FontWeightValue`, `ScopedFontWeight`, `FontRegistry`, `ColorModeProps`, `ContainerProps`, `ResponsiveProps`, `VariantProps`, variant registry types, `HTMLStyledProps`, `PrimitiveComponent`, `PrimitiveCssProps`, `PrimitiveElement`, **`PrimitiveProps`**, `PrimitiveTag`, recipe creator/runtime types, `StylePropValue`, **`StyleProps`** (`Omit<SystemStyleObject, 'font'\|'weight'\|'container'\|'r'> & ReferenceProps`), **`SystemStyleObject`**.

`StyleProps` for primitives is **Reference-authored**, wrapping generated `SystemStyleObject` (which currently imports `styled/types/csstype`).

## 5. Runtime-data / helpers / react

### `runtime-data.mjs`

- Header: generated by reference-core; `import { registerRuntimePlans } from '@reference-ui/react'`.
- Shape (first ~80 lines): `recipes` → one table `reference-ui__summaryChip` (`base`, `className`, `combinations`, `compoundVariants`, `defaultVariants`, `qualifiedName`, `variantKeys`, `variantMap`); `schemaVersion: 1`; `stylePlans[]` with `{ declarations[{ className, slot }], important, prop, system, value, when }`.
- Parsed counts: **recipes: 1**, **stylePlans: 3752** (101 unique `prop`s, `system: "reference-ui"`), **stylePropNames: 873**.
- Footer: `registerRuntimePlans(runtimeData)`.
- `.d.mts`: `import type { NativeRuntimeArtifact } from '@reference-ui/react'` + `export declare const runtimeData: NativeRuntimeArtifact`.

Contract type (`reference-rs/contracts`): `{ schemaVersion: 1, stylePlans, recipes, stylePropNames }`.

### `helpers.js`

Panda codegen helpers (comments still say `src/assert.ts`, `src/compact.ts`, …). Exports: `compact`, `createCss`, `createMergeCss`, `filterBaseConditions`, `getPatternStyles`, `getSlotCompoundVariant`, `getSlotRecipes`, `hypenateProperty`, `isBaseCondition`, `isObject`, `mapObject`, `memo`, `mergeProps`, `patternFns`, `splitProps`, `toHash`, `uniq`, `walkObject`, `withoutSpace`, plus later `normalizeHTMLProps`, `__spreadValues`, `__objRest`. **PLAN: this file must not remain as the css engine.**

### React package

- **101 primitives** from the tag list (`Div`, `Span`, `Button`, `Svg`, `Obj`/`Var` specials, …). **No `Box`/`Flex`/`Grid` components** (those are Panda patterns).
- Runtime: **`React.forwardRef`** per tag; `data-layer` via core `layers.ts`; color mode **`data-panda-theme`** (`DATA_COLOR_MODE_ATTR` in core).
- Exports (bundle): all tags, `HTML_TAGS`, `css` (wrapper around `@reference-ui/styled/css`), `recipe` (wrapper around `cva`), `useColorMode`, `ColorModeContext`, `DocumentContext`, `LayerScopeContext`.
- **Liquid:** core `primitives/generate/generate.ts` renders `primitives.liquid`. The **checked-in `react.mjs` is the bundled result**, not the template.
- Size: 2781 lines JS + 27k-line CSS copy.

## 6. Neo delta

`PortableBaseSystem` (contracts): `schemaVersion`, `name`, `fragments[]`, `cssChunks[]`, `runtime`, `jsxElements[]`.

Neo `publish.ts` `baseSystem` today: `{ name, fragment` (singular string), `css`, `jsxElements }` — missing version, chunks, runtime artifact.

Neo `publishRuntimeBundle`: writes `styled/runtime-data.mjs` **and** bundles **`styled/css.mjs`** (`css`+`recipe` pre-registered). Neo `publishReactBundle`: `react/index.mjs` + `index.d.mts`; primitives via **`createPrimitive`** (ref-as-prop), **`data-layer`**, color attr **`data-color-mode`**; shares css via `../styled/css.mjs`. String generator, **not Liquid**. `linkGeneratedPackages`: `system`/`styled`/`react` junctions.

| Artefact | Today (core/Panda) | Neo today | Neo must (§3.5 + census) | Gap |
| :--- | :--- | :--- | :--- | :--- |
| Published names | `@reference-ui/{system,styled,react}` (+ `types`) | same three names, version `0.0.0-neo` | names unchanged | `types` unscoped in Neo |
| `system` `.` export | `system.mjs`: `tokens`,`font`,`keyframes`,`globalCss`,`getRhythm` | `.` → `baseSystem` only | lib+matrix authoring APIs on `@reference-ui/system` | **authoring API missing** |
| `system/baseSystem` | exists; typed as core `BaseSystem` | stub object, local interface | `PortableBaseSystem` + `cssChunks`/`runtime`/`fragments[]` | **shape** |
| `evaluated-system.json` | yes | yes | yes, versioned spec only | ok |
| `compile-request.json` | yes (`jsxHosts`, roots) | **not written** | required | **missing** |
| `styled/styles.css` | assembled; `data-panda-theme`; panda global elsewhere | native stylesheet | assembled native; **no** panda theme/banner | attr + cleanup |
| `styled/runtime-data` | native artifact + register from react | artifact + `systemName`; register in **css.mjs** | data only; no namer | **executable css.mjs in styled** vs “data package” |
| `styled/css|jsx|patterns|helpers|global.css|panda.config` | present | stub `global.css`; **no** panda trees; **adds css.mjs** | **must not exist** (css impl not in styled) | Neo still writes `global.css`; must not add panda; move css binding |
| `styled/types` | Panda typegen + `@pandacss/dev` | none | native typegen + vendored csstype; no pandacss import | **missing typegen publish** |
| `react` filenames | `react.mjs` / `react.d.mts` + `./styles.css` | `index.mjs` / `index.d.mts`; no styles.css export | **consumer paths:** `react.mjs` or equivalent `exports["."]` + **`./styles.css`** | **filename + CSS export** |
| `react` css wiring | imports `@reference-ui/styled/css` | external `../styled/css.mjs` | primitives + `css()`/`recipe()` consume **generated native data**; no Panda fns; §3.5: no styled css/cva/jsx imports | relocate bound `css` (react or tiny helper); drop Panda |
| primitives | Liquid + `forwardRef`; 101 tags | string gen + `createPrimitive`; same tags | same tag set; `StyleProps`/`css`/`colorMode`/`variant` | types are `unknown` vs Reference `StyleProps` |
| `data-layer` | yes | yes | yes (identity) | ok |
| color-mode attr | `data-panda-theme` | `data-color-mode` | PLAN: **`data-theme` only** | **three-way mismatch** |
| `recipe()` | `cva as recipe` on react | `recipe` from neo runtime tables | bound recipe over owner `name` | wiring ok in spirit; not on public react entry types fully |
| node_modules links | panda symlinks in `.reference-ui/node_modules` | `linkGeneratedPackages` to project `node_modules/@reference-ui/*` | no Panda; keep generated package links | panda links must die |
| `virtual/` `tmp/` | core session | Neo does not emit | not consumer-import contracts | optional chassis |

## 7. Must not regress (10 consumer-visible contracts)

1. **Package names** `@reference-ui/react`, `@reference-ui/system`, `@reference-ui/styled` stay the import map / node_modules names (lib `tsconfig` paths and matrix already resolve them).
2. **`import { Div, Span, Button, … } from '@reference-ui/react'`** — the 101 tag components (no polymorphic `as`; no `Box` as a primitive).
3. **`css` and `recipe` from `@reference-ui/react`** (matrix uses both; lib uses `recipe` + primitives). Same `SystemStyleObject` for style values; `variant` / `colorMode` stay metadata, not `css()` keys.
4. **Type names** `StyleProps`, `PrimitiveProps`, `PrimitiveElement`, `PrimitiveTag`, `RecipeVariantProps`, `SystemStyleObject`, `CssStyles`, font registry types — importable from react (and system where today).
5. **`@reference-ui/system`:** `tokens`, `font`, `keyframes`, `globalCss`, and matrix’s `getRhythm` + config types; **`@reference-ui/system/baseSystem`** (`baseSystem` value). Lib also re-exports `baseSystem` from `.reference-ui/system/baseSystem.mjs`.
6. **`import '@reference-ui/react/styles.css'`** (Book, Playwright CT, tsconfig). File can be a copy or re-export of `styled/styles.css`, but the **specifier** is `react/styles.css`.
7. **DOM:** first primitive in a tree stamps **`data-layer="<system name>"`**; nested inherit. Color-mode attribute must be **one** name shared by CSS selectors and primitives (campaign: `data-theme`; do not leave `data-panda-theme` in sheets).
8. **`runtime-data` ABI:** `{ schemaVersion: 1, recipes, stylePlans, stylePropNames }` with owner-qualified class names; `stylePropNames` excludes `variant`/`colorMode`.
9. **`@reference-ui/styled` is not a lib-src import**, but generated **react** must not keep depending on Panda `css`/`cva`/`jsx`/`patterns`. After cutover those directories (and `panda.config.ts`, `global.css` panda banner) must be **absent**.
10. **Entry filenames / `package.json` `exports`:** today’s consumers resolve `.` to **`react.mjs`/`react.d.mts`** and **`system.mjs`/`system.d.mts`**. Neo’s `index.mjs` only works if `exports["."]` is updated **and** every rewrite (`materialize-runtime.mjs`, tsup) is updated in lockstep — prefer matching `react.mjs` / `system.mjs` unless all resolvers change together.
