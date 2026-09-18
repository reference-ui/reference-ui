# Panda v1 tokens / CSS vars / types / normalisation probe

Corpus: `vendor/panda-v1` (Panda CSS 1.12.1). Read-only. Target packages: `token-dictionary`, `generator`, `shared`, `preset-base`.

## 1. Executive summary

Panda’s token dictionary is the corpus of record for refs, semantic conditions, `colorPalette` virtual tokens, composite shadows/gradients/borders/assets, CSS var naming (`--spacing-0\\.5`), and negative spacing (`calc(var(--spacing-4) * -1)`). Generator tests prove stylesheet emission: vars on `:where(html)`, dark islands on **`:where([data-theme=dark], .dark)`** (not `data-panda-theme`), while **Panda `themes`** re-declare vars under **`[data-panda-theme=<name>]`**. Production lib sheet `packages/reference-lib/.reference-ui/styled/styles.css` already uses `[data-panda-theme=light|dark]` (2 rules) plus `--colors-` (5772), `color-mix` (25), `\.` escapes (5418), `--fonts-` (48), `--animations-` (21), `color-palette` (1683); `--shadows-` / `--gradients-` / `--durations-` / `--easings-` count **0** in that sheet. Typegen analogue is `packages/reference-rs/modules/typegen` (`ColorToken`, `SpacingToken`, `StyleConditionKey`, `FontRegistry`, `SystemStyleObject`); Panda also emits `token()` JS, `ColorPalette`, `colorPalette.*` unions, `strictTokens`/`WithEscapeHatch`, and recipe variant `ConditionalValue` types. Shared helpers encode runtime merge/responsive/`!important`/hyphenate/escape; Neo `css()` currently only strips a trailing `!`, not Panda’s `/\s*!(important)?/i`. Reference authors use `tokens({ light, dark })` leaves, not Panda `semanticTokens` + `_dark` in `value`. **Gaps in this corpus:** no circular-ref tests, no missing curly-ref tests (only `token(missing, fallback)` collapsing to fallback), no real `deprecated: true` assertion, no dedicated `toResponsiveObject`/`isImportant`/`hypenate` tests (source only). Canon analogue: `packages/reference-rs/modules/canon/README.md` (language of tags/props/conditions; tokens are the utterance).

## 2. File map

Counts: `test(` / `it(` (Vitest). `checkbox.svg` is a fixture, not a test.

### token-dictionary (`vendor/panda-v1/packages/token-dictionary/__tests__/`) — 19 `.test.ts`

| Path | Lines | Tests | Coverage | Tag |
| --- | ---: | ---: | --- | --- |
| `alias.test.ts` | 73 | 1 | `{colors.pink}` chain `border`→`disabled` resolves to `#ff00ff` | TOKEN |
| `color-mix.test.ts` | 79 | 2 | `{colors.pink/30}` → `color-mix(in srgb, … 30%, transparent)`; semantic `_dark` var map | TOKEN |
| `color-palette.test.ts` | 1827 | 11 | Virtual `--colors-color-palette-*`; nested roots; `DEFAULT`; enable/include/exclude; semantic palettes | TOKEN |
| `colors.test.ts` | 199 | 2 | Nested `red.300`; semantic `@light`/`@dark` without `base` (empty originalValue) | TOKEN |
| `default.test.ts` | 40 | 1 | `DEFAULT` flattens `colors.red`; `{colors.red}` alias | TOKEN |
| `expand-references.test.ts` | 276 | 13 | `{…}` and `token()`; fallbacks; missing→fallback; nested `token()`; `0.5` escape in composite string | TOKEN |
| `format-by-category.test.ts` | 116 | 1 | `view.categoryMap` grouping + palette extensions | TOKEN |
| `format-flat.test.ts` | 33 | 1 | Flat JSON view of dictionary | TOKEN |
| `format-getter.test.ts` | 44 | 1 | Getter view for token lookup | TOKEN |
| `format-token-name.test.ts` | 40 | 1 | Custom `formatTokenName` → `$colors-red` keys | NAME |
| `format-vars.test.ts` | 46 | 1 | `view.vars` base vs `dark` maps (`--colors-brand`) | CSSVAR |
| `middleware.test.ts` | 225 | 3 | Negative tokens + hashed var `--jolVMp`; `formatTokenName` + palette | TOKEN |
| `semantic-token.test.ts` | 101 | 2 | Duplicate `{sizes.0.5}` in shadow string; nested `osDark.highCon` | TOKEN |
| `spacing.test.ts` | 408 | 3 | Negative spacing; semantic `{spacing.sm}` + `@small`; duplicate semantic case | TOKEN |
| `tokens.test.ts` | 2195 | 1 | Full fixture snapshot (spacing/colors/fonts/easings/durations/shadows/animations + vars) | TOKEN |
| `transform-asset.test.ts` | 126 | 3 | SVG data-URL, file SVG, `url("/mesh.png")` | TOKEN |
| `transform-border.test.ts` | 255 | 1 | String/object borders; `--border-widths-*`; semantic `@hover` | TOKEN |
| `transform-gradient.test.ts` | 69 | 1 | Composite linear gradient + color ref | TOKEN |
| `transform-shadow.test.ts` | 78 | 1 | Object shadow → `4px 10px 4px 0px #ff0000` | TOKEN |

### generator (`vendor/panda-v1/packages/generator/__tests__/`) — 20 files

| Path | Lines | Tests | Coverage | Tag |
| --- | ---: | ---: | --- | --- |
| `cleanup-selector.test.ts` | 53 | 2 | Strip placeholder selectors from token CSS | NAME |
| `css-fn.test.ts` | 77 | 1 | Decode packed utility `prop:class/shorthand` string | RUNTIME-NORM |
| `generate-css-fn.test.ts` | 243 | 4 | `css` JS + dts (`SystemStyleObject`); template-literal `css`; breakpoints `base,sm,…` | TYPES / RUNTIME-NORM |
| `generate-keyframes.test.ts` | 69 | 2 | Default `@keyframes`; token refs in keyframe styles (`h: '4'` → `var(--sizes-4)`) | KEYF |
| `generate-pattern.test.ts` | 1016 | 1 | Pattern JS/dts generation | OUT |
| `generate-prop-types.test.ts` | 331 | 2 | `UtilityValues` token maps; `WithEscapeHatch` / `Important` / `OnlyKnown`; `globalVars` | TYPES |
| `generate-recipe.test.ts` | 548 | 1 | Recipe JS + `TextStyleVariantProps` / `ConditionalValue` dts | TYPES |
| `generate-reset.test.ts` | 556 | 3 | Preflight `@layer reset`; scoped `.pd-reset`; element scope | RESET |
| `generate-style-props.test.ts` | 16244 | 3 | Full `SystemProperties`; **`strictTokens: true`** wraps `WithEscapeHatch`; `globalVars` CssVars union. Sampled L1–300 + titles L6 / L8099 / L16192 | TYPES |
| `generate-themes.test.ts` | 131 | 1 | Theme JSON CSS under `[data-panda-theme=…]` + `@media (prefers-color-scheme: dark)` | CSSVAR |
| `generate-token-dts.test.ts` | 172 | 3 | `ColorToken`/`SpacingToken`/`Tokens`; negatives `"-1"`; `formatTokenName` | TYPES |
| `generate-token-js.test.ts` | 4169 | 3 | Runtime `token()` map (raw vs `var(--…)`); `token.var` | OUT (`token()` fn) / TYPES dts |
| `generate-token.test.ts` | 1498 | 19 | Token CSS: composites, color-mix, dark `:where([data-theme=dark], .dark)`, themes `[data-panda-theme=primary]`, multi-block cartesian, escaped `--spacing-0\\.5` | CSSVAR / TOKEN |
| `setup-artifacts.test.ts` | 319 | 2 | Artifact filter / getArtifacts | OUT |
| `spec-color-palette.test.ts` | 346 | 9 | Studio/spec JSON for palettes (jsxStyleProps) | OUT (spec) / TOKEN |
| `spec-conditions.test.ts` | 42 | 2 | Multi-block conditions as semicolon paths not JSON | TYPES / CSSVAR |
| `spec-recipes.test.ts` | 111 | 2 | Boolean variant formatting in spec | OUT |
| `spec-themes.test.ts` | 351 | 6 | Theme spec JSON | OUT |
| `spec-tokens.test.ts` | 556 | 11 | Token/semantic spec; nested conditions; **deprecated field present but asserted `undefined`** | TOKEN / OUT |
| `split-css.test.ts` | 67 | 2 | Split recipe CSS files | OUT |

There is **no** `generate-conditions-types.test.ts` / `generate-recipe-types.test.ts` as separate files: conditions dts live in `src/artifacts/js/conditions.ts`; recipe types in `generate-recipe.test.ts`; token types in `generate-token-dts.test.ts`; style/prop types in `generate-style-props` / `generate-prop-types`.

### shared (`vendor/panda-v1/packages/shared/__tests__/`) — 15 files

| Path | Lines | Tests | Coverage | Tag |
| --- | ---: | ---: | --- | --- |
| `arbitrary-value.test.ts` | 69 | 2 | Strip `[…]` arbitrary values; grid-line brackets | RUNTIME-NORM |
| `astish.test.ts` | 81 | 4 | CSS string → object; `@media`/`@container`; multiline `& span, & p` | RUNTIME-NORM |
| `cache-map.test.ts` | 37 | 1 | CacheMap | n/a |
| `css-var.test.ts` | 49 | 5 | `cssVar` escape: `-2.4`, hash, prefix, regex chars, `100%` | CSSVAR / NAME |
| `deep-set.test.ts` | 125 | 5 | Path set / nested create / overwrite | RUNTIME-NORM |
| `esc.test.ts` | 45 | 7 | CSS ident escape: `0.5`, `!`, `/`, `--a`, unicode | NAME |
| `merge-props.test.ts` | 78 | 6 | Deep merge; last-wins nested; `__proto__`/`constructor` pollution | RUNTIME-NORM |
| `pick.test.ts` | 100 | 6 | Pick nested paths | n/a |
| `property-priority.test.ts` | 82 | 3 | Shorthand vs longhand sort (`all` < `padding` < `paddingTop`) | RUNTIME-NORM |
| `slots.test.ts` | 176 | 2 | `getSlotRecipes` split / colliding slot+variant keys | OUT |
| `split-props.test.ts` | 40 | 3 | Array / predicate / mixed split | RUNTIME-NORM |
| `split.test.ts` | 10 | 1 | Color path split | TOKEN |
| `string-literal.test.ts` | 62 | 1 | Template-literal syntax helpers | OUT |
| `traverse.test.ts` | 851 | 4 | Object/array walk, path, stop | RUNTIME-NORM |
| `walk-object.test.ts` | 102 | 4 | Transform; stop at array; max depth; drop nullish after shorthand remap | RUNTIME-NORM |

**Helpers named in the brief with no dedicated `__tests__` file** (source under `packages/shared/src/`): `toResponsiveObject` / `normalizeStyleObject` (`normalize-style-object.ts`), `isImportant` / `withoutImportant` (`important.ts`), `hypenateProperty` (`hypenate-property.ts`), `toHash` (`hash.ts` / classname), `filterBaseConditions` / `sortConditions` (`condition.ts` + generator `conditions.ts`), `patternFns`, `memo`, `compact`. They are still the normalisation contract.

### preset-base — 1 file

| Path | Lines | Tests | Coverage | Tag |
| --- | ---: | ---: | --- | --- |
| `packages/preset-base/__tests__/utility.test.ts` | 18 | 2 | Every utility has a `className`; class names unique | RUNTIME-NORM |

Reference canon: `packages/reference-rs/modules/canon/README.md` — “Canon is the language” (tags, CSS properties, `mt`/`bg`/`r`, conditions). Preset-base is Panda’s utility/condition dialect; canon is Reference’s.

### Lib sheet spot-check (`packages/reference-lib/.reference-ui/styled/styles.css`)

| Pattern | Count |
| --- | ---: |
| `--colors-` | 5772 |
| `color-mix` | 25 |
| `\.` (escaped dots in CSS) | 5418 |
| `data-panda-theme` | 2 (`[data-panda-theme=light]` L2194, `[data-panda-theme=dark]` L2295) |
| `--shadows-` | 0 |
| `--gradients-` | 0 |
| `--fonts-` | 48 |
| `--durations-` | 0 |
| `--easings-` | 0 |
| `--animations-` | 21 |
| `color-palette` | 1683 |
| `calc(var(--spacing` (negatives) | 368 |
| `--spacing-0\.5r` | present (Reference rhythm keys, not Panda `0.5`) |

## 3. Edge cases by family

### TOKEN — refs, semantic, palette, composite, naming, missing

**1. Curly ref → CSS var** — `expand-references.test.ts:23`  
Input: `expandReferenceInValue('{colors.red.300}')` with tokens `red.300: '#red300'`.  
Expected: `"var(--colors-red-300)"`.  
Neo: **sheet** / **rust**.

**2. `token()` with fallback** — `expand-references.test.ts:91–93`  
Input: `'token(colors.red.300, blue)'`.  
Expected: `"var(--colors-red-300, blue)"`.  
Neo: **n/a** if no `token()` runtime (Reference does not export `token()`); curly+fallback not tested in this corpus.

**3. Missing `token()` + fallback collapses (does not emit var)** — `expand-references.test.ts:96–101`  
Input: empty dict, `'token(spacing.auto, auto)'`.  
Expected: `"auto"`. Composite: `'1px solid token(sizes.123, auto)'` → `"1px solid auto"` (L109–111).  
Neo: **rust** (ref expansion). **No test** for missing `{colors.missing}` curly.

**4. Nested token() fallbacks** — `expand-references.test.ts:254–259`  
Input: `token(colors.red.300, token(colors.blue.500, token(colors.primary, token(colors.blue.700, colors.red.500))))`.  
Expected: `"var(--colors-red-300, var(--colors-blue-500, var(--colors-primary, var(--colors-blue-700, var(--colors-red-500)))))"`.  
Neo: **rust**.

**5. Duplicate decimal keys in composite string** — `expand-references.test.ts:273–275` / `semantic-token.test.ts:22–24`  
Input: sizes `0.5: '0.125rem'`; value `'0 {sizes.0.5} {sizes.0.5} rgba(92, 225, 113, 0.25)'`.  
Expected: `"0 var(--sizes-0\\.5) var(--sizes-0\\.5) rgba(92, 225, 113, 0.25)"`.  
Neo: **sheet**. Lib uses `--spacing-0\.5r` not `--sizes-0\.5`.

**6. Alias chain resolves originalValue to raw color** — `alias.test.ts:18–72`  
Input: `pink: '#ff00ff'`, `border: '{colors.pink}'`, `disabled: '{colors.border}'`.  
Expected: all three tokens `value: "#ff00ff"`; `originalValue` keeps the ref on border/disabled.  
Neo: **rust**.

**7. `DEFAULT` flattens + semantic alias** — `default.test.ts:24–38`  
Input: `colors.red.DEFAULT: '#red'`, `red.hot: '#redhot'`, semantic `error: '{colors.red}'`.  
Expected names: `colors.red` / `colors.red.hot` / `colors.error` all with `#red` / `#redhot` / `#red`.  
Neo: **sheet** / **types**.

**8. Semantic without `base` (empty originalValue)** — `colors.test.ts:57–198`  
Input: `disabled: { value: { '@light': '#333', '@dark': '#222' } }` (no `base`).  
Expected: a base token with `value: ""` plus condition tokens `@light`/`@dark`.  
Neo: **sheet** / **rust**. Reference leaves use `light`/`dark` keys on the token object, not `@light` inside `value`.

**9. Deep nested condition path `osDark:highCon`** — `semantic-token.test.ts:39–99`  
Input: `pink: { value: { base: '#fff', osDark: { highCon: 'sdfdfsd' } } }`.  
Expected: two tokens named `colors.pink`; second `extensions.condition: "osDark:highCon"`, `value: "sdfdfsd"`.  
Neo: **sheet** / **rust**.

**10. color-mix opacity modifier** — `color-mix.test.ts:20–38`  
Input: `{colors.pink/30}`, `{colors.border/40}`, `{colors.border/half}` with `opacity.half: 0.5`.  
Expected:  
`color-mix(in srgb, var(--colors-pink) 30%, transparent)`  
`color-mix(in srgb, var(--colors-border) 50%, transparent)` for `/half`.  
Vars: `--colors-border` stores the mix, not the raw hex.  
Neo: **sheet** (lib has 25 `color-mix`). Generator CSS twin: `generate-token.test.ts:33–44` and L857–867 (note fixture bug: `--colors-primary: color-mix(in srgb, colors.blue.300 70%, transparent)` **without** `var()` — goldens include this).

**11. color-mix on semantic `_dark`** — `color-mix.test.ts:67–77` / `generate-token.test.ts:901–917`  
Dictionary vars: `"_dark:value" => Map { "--colors-fg-default" => "var(--colors-white)" }`.  
CSS: `.light { --colors-secondary: color-mix(in srgb, var(--colors-blue-500) 32%, transparent) }` / `.dark { … 50% …}` when conditions are `.light &` / `.dark &`.  
Neo: **browser** / **sheet**.

**12. Virtual colorPalette** — `color-palette.test.ts:287–300`  
Input: `primary`, `red.300/500`, `blue.500/700`.  
Expected palettes:  
`--colors-color-palette` → `var(--colors-primary)`  
`--colors-color-palette-300` → `var(--colors-red-300)` etc.  
Types include `"colorPalette" | "colorPalette.50" | …` (`generate-token-dts.test.ts:33`).  
Neo: **sheet** (lib `color-palette` 1683) / **types**. Decide if Neo authors expose `colorPalette` prop (Panda utility).

**13. `DEFAULT` + palette** — `color-palette.test.ts:808–819`  
`brand.DEFAULT` / `brand.hot.DEFAULT` → palettes `"brand"` and `"brand.hot"` with `--colors-color-palette` pointing at DEFAULT var.  
Neo: **sheet**.

**14. Negative spacing** — `spacing.test.ts:56` / `middleware.test.ts:145` / dts L37  
Input: `spacing.sm: '40px'` + middleware.  
Expected token `spacing.-sm` value `"calc(var(--spacing-sm) * -1)"`. Semantic negatives: `spacing.-lg` → `"calc(var(--spacing-lg) * -1)"`. Hashed: `"calc(var(--jolVMp) * -1)"` (`middleware.test.ts:58`).  
Types: `SpacingToken` includes `"-1" | "-0.5" | "-gutter"` (`generate-token-dts.test.ts:37`); nested `"test.test" | "-test.test"` (L163–164).  
Neo: **sheet** / **types** / **browser** (margin negative). Lib: 368 `calc(var(--spacing`.

**15. Composite shadow object** — `transform-shadow.test.ts:57` / `generate-token.test.ts:74–81`  
Input: `{ offsetX: 4, offsetY: 10, blur: 4, spread: 0, color: '{colors.red}' }`.  
Dictionary value: `"4px 10px 4px 0px #ff0000"` (resolved).  
CSS with token refs kept: `--shadows-sm: var(--spacing-3) var(--spacing-3) 1rem var(--spacing-3) var(--colors-red);`.  
Neo: **sheet**. Lib `--shadows-` count 0 (no shadow tokens in production sheet).

**16. Shadow array under `_dark` is comma-joined, not extra blocks** — `generate-token.test.ts:666–675`  
Input: `e1.value.base = […, …]`, `_dark = […, …]`, `dark: '.dark &'`.  
Expected:  
`:where(html) { --shadows-e1: 0px 1px 2px …, 0px 1px 3px …; }`  
`.dark { --shadows-e1: … }`  
Neo: **sheet**.

**17. Composite gradient** — `transform-gradient.test.ts:59–65`  
Input: linear `to top`, stops `#ff0000` + `{colors.pink}`.  
Expected value: `"linear-gradient(to top, #ff0000 0px, #ff00ff 100px)"`.  
Neo: **sheet**. Lib `--gradients-` 0.

**18. Composite border + camelCase category** — `transform-border.test.ts:96` / `generate-token.test.ts:1253–1261`  
`md: { width: 2, style: 'solid', color: '{colors.red}' }` → `"2px solid var(--colors-red)"`.  
`borderWidths.thick` → `--border-widths-thick` (kebab of camel).  
`brand: { width: '{borderWidths.thick}', …}` → `"var(--border-widths-thick) solid #fff"`.  
Neo: **sheet**.

**19. Semantic border conditions** — `transform-border.test.ts:174–251`  
`controlBorder: { base: '{borders.sm}', '@hover': '{borders.md}' }` → base `var(--borders-sm)`, `@hover` token `var(--borders-md)`.  
Neo: **sheet**.

**20. SVG asset** — `transform-asset.test.ts:36` / `generate-token.test.ts:824–828`  
Expected: `--assets-checkbox: url("data:image/svg+xml,%3csvg …");`.  
Neo: **n/a** unless Neo tokens grow `assets`.

**21. Semantic CSS var reuse (no inlining)** — `generate-token.test.ts:720–731`  
`--colors-semantic-red: var(--colors-danger); --colors-danger: var(--colors-red);`  
Neo: **sheet**.

**22. Deep nested color paths not exploded as extra palettes (issue 769)** — `generate-token.test.ts:628–641`  
`--colors-deep-test-pool-palette-50` etc., no unnamed extra blocks.  
Neo: **sheet**.

**Circular refs:** **not in this corpus.**  
**Private `_` tokens:** **not in panda token-dictionary tests.** Reference `tokens()` documents `_private` subtrees (`packages/reference-neo/src/fragments/api/tokens.ts`); typegen golden includes `'_private.secret'` (`typegen/tests/seam.test.ts:30`).  
**deprecated:** `spec-tokens.test.ts:463–483` does not set `deprecated: true`; asserts `toBeUndefined()`.

### CSSVAR — `:root` / conditions / themes / media

**Panda default token layer selector is `:where(html)`, not `:root`.** Dark semantic (fixture): **`:where([data-theme=dark], .dark)`** (`generate-token.test.ts:533–538`). Nested: `[data-color=material]:where([data-theme=dark], .dark)` (L545). `@media screen and (min-width: 64rem) { :where(html) { --spacing-gutter: var(--spacing-5) } }` (L559–562). Forced-colors: `@media (forced-colors: active) { :where([data-theme=dark], .dark) { --colors-complex: … } }` (L565–568).

**Panda `themes` feature** uses **`[data-panda-theme=primary]`** (`generate-token.test.ts:1042`) and theme JSON (`generate-themes.test.ts:56`):  
`[data-panda-theme=default] { --colors-primary: blue; … }` + `@media (prefers-color-scheme: dark) { [data-panda-theme=default] { --colors-text: var(--colors-blue-400) } }`.

**Reference production** uses **`[data-panda-theme=light]` / `[data-panda-theme=dark]`** to re-declare semantic colour vars (lib sheet L2194 / L2295) — closer to Panda **themes** selector spelling than to Panda’s default `_dark` condition (`[data-theme=dark]`).

**Custom condition `.dark &`:** rules emit `.dark { --shadows-e1: … }` (L672) — no `:where`, no `data-theme`.

**Multi-block `@slot`:** one rule per path (`generate-token.test.ts:1297–1317`):  
`@media (hover: hover) { :is(:hover, [data-hover]) { --colors-accent: var(--colors-blue-500) } }` and hover-none twin.  
Stacked `_dark` + `_hoverActive` cartesian (L1354–1374): `.dark:is(:hover, [data-hover])`.  
N×M two multi-blocks (L1413–1451).  
Selector-only (L1492–1494): `[data-theme="dark"],[data-dark-theme] { --colors-surface: var(--colors-zinc-700) }`.

**Escaped numeric vars in default fixture CSS** — `generate-token.test.ts:451`: `--spacing-0\\.5: 0.125rem;` `--sizes-0\\.5: 0.125rem;`.

**cssVar helper** — `css-var.test.ts:5–10`: `cssVar('-2.4', { prefix: 'vc-spacing' })` → `{ var: "--vc-spacing--2\\.4", ref: "var(--vc-spacing--2\\.4)" }`. Percent: `--sizes-100\\%`. Hash: `--bLdQLg`.

Neo: **sheet** / **browser** (toggle `data-panda-theme` / `.dark`). **types** for condition keys.

### FONT / KEYF / RESET / GLOBAL

**Fonts as tokens:** fixture emits `--fonts-sans: ui-sans-serif, …` (`generate-token.test.ts:132–134`); `FontToken = "sans" | "serif" | "mono"` (dts L25). Reference additionally has **`font()` registry** (`reference-neo/src/fragments/api/font.ts`) and `FontRegistry` in typegen — not these Panda tests. Lib `--fonts-` 48; `--font-weights-mono-*` beside theme islands.

**Keyframes:** default spin/ping/pulse/bounce in `@layer tokens` (`generate-keyframes.test.ts:14–47`). Tokenised: `roll: { from: { h: '4' }, to: { h: '8' } }` → `height: var(--sizes-4)` / `var(--sizes-8)` (L56–67).  
Neo: **sheet** / **browser**. Existing Neo has `keyframes()` collector tests, not a NEO-KEYF case.

**Reset:** `@layer reset { html,:host { … box-sizing: border-box on *,::before,… } }` (`generate-reset.test.ts:16–37`). Scope: `.pd-reset *` (L193+).  
Neo: **sheet** only if Neo publishes preflight (confirm vs globalCss).

**globalCss:** not covered in these four packages’ tests (Panda generator has other suites). Neo already has `globalCss()`.

### TYPES

**Token unions (verbatim excerpt)** — `generate-token-dts.test.ts:7–43`:

```
export type Token = `aspectRatios.${AspectRatioToken}` | … | `colors.${ColorToken}` | `spacing.${SpacingToken}` | …

export type ColorPalette = "current" | "black" | … | "surface"

export type SpacingToken = "0" | "1" | … | "0.5" | … | "gutter" | "-1" | … | "-0.5" | "-gutter"

export type Tokens = { … spacing: SpacingToken … } & { [token: string]: never }
```

**css() dts** — `generate-css-fn.test.ts:10–30`: `css` overloads taking `SystemStyleObject | undefined | null | false`; `css.raw` returns `SystemStyleObject`.

**ConditionalValue** — `generator/src/artifacts/js/conditions.ts:70–75` (no dedicated test file; `spec-conditions.test.ts` covers spec strings):

```
export type ConditionalValue<V> =
  | V
  | Array<V | null>
  | { [K in keyof Conditions]?: ConditionalValue<V> }
```

Reference typegen (`styles.d.ts:32`): `StylePropValue<T> = T | Array<T | null> | { [K in StyleConditionKey]?: T }` — same array-null + condition map idea; condition keys are `_hover`/`@sm` not Panda `Conditions` interface.

**strictTokens** — `generate-style-props.test.ts:8099–8124`: properties become `ConditionalValue<WithEscapeHatch<CssProperties["WebkitAppearance"]>>` instead of `| AnyString`. `generate-prop-types.test.ts:291–314`: `WithEscapeHatch<T> = T | \`[${string}]\` | WithColorOpacityModifier<T> | WithImportant<T>`; `ImportantMark = "!" | "!important"`. Reference strict: `SystemStyleObject = StrictSpacingProps<StrictRadiiProps<StrictColorProps<BaseSystemStyleObject>>> & { [K in StyleConditionKey]?: SystemStyleObject }` (`typegen/tests/goldens/styles-strict.d.ts:311`).

**Recipe types** — `generate-recipe.test.ts:112–141`: `TextStyleVariantProps` with `[key]?: ConditionalValue<TextStyleVariant[key]>`; `splitVariantProps`. Pattern/jsx types: **OUT**.

**globalVars** — CssVars becomes `"var(--random-color)" | "var(--button-color)"` (`generate-style-props.test.ts:16217–16221`).

Neo: **types** (harness `typecheck` hook).

### RUNTIME-NORM / NAME

**toResponsiveObject (source only)** — `shared/src/normalize-style-object.ts:6–16`: arrays zip to `breakpoints[index]`; **`if (current != null)` skips `null`/`undefined` holes** (no key). `normalizeStyleObject` walks and stops at arrays, optionally remaps shorthands.

**isImportant (source only)** — `shared/src/important.ts:1–8`: `/\s*!(important)?/i` → `red !important`, `red!`, `red!important` all important; `withoutImportant` strips. Neo `css.ts:39–43` only `endsWith('!')` — **does not honour ` !important`**.

**hypenateProperty (source only)** — `shared/src/hypenate-property.ts:6–8`: `--foo` unchanged; `WebkitBoxOrient` → `webkit-box-orient` via `/([A-Z])/g` then `.toLowerCase()`; `msFoo` → `-ms-foo` via `/^ms-/`.

**esc** — `esc.test.ts:16–41`: `m_0.5` → `m_0\\.5`; `m_0.5!` → `m_0\\.5\\!`; `w:_$-1/2` → `w\\:_\\$-1\\/2`; `--a` → `\\--a`; `w_1/3` → `w_1\\/3`.

**mergeProps** — later object wins at leaf; nested objects merge (`merge-props.test.ts:14–24`); `textStyle` object replaces string (L27–37); `__proto__` dropped (L40–48).

**walkObject** — stop at array treats `[1,2,3]` as leaf `"value is 1,2,3"` (L42–49); nullish after `getKey` shorthand remap dropped so `flexDir: 'row'` + `flexDirection: undefined` → `{ flexDirection: "row" }` only (L96–100).

**splitProps** — `splitProps(obj, ['a','b'], ['c'])` → `[{a,b},{c},{d}]` (L5–11).

**astish** — CSS text to nested objects (`astish.test.ts:19–31`).

**sortConditions** — generator `conditions.ts:44–51`: non-conditions sort before conditions.

Neo: **browser** / **rust** (class names) / **n/a** for Panda-only class hashing.

## 4. Proposed Neo cases

Do not reuse: NEO-CSS-01/02, NEO-EDGE-01/02, NEO-RECIPE-01, NEO-PRIM-01, NEO-SYNC-01, NEO-SMOKE-01, NEO-SNAP-A-01, NEO-PLAY-B-01.

| id | README first line | World | Assertion | Panda v1 evidence |
| --- | --- | --- | --- | --- |
| NEO-TOKEN-01 | Curly token refs become CSS variables | `tokens({ colors: { pink: { value: '#ff00ff' }, border: { value: '{colors.pink}' } } })` and `css({ color: 'border' })` | Sheet contains `--colors-border` referencing `--colors-pink`; computed color `#ff00ff` | `alias.test.ts` “resolve aliases”; `expand-references.test.ts` “curly ref” |
| NEO-TOKEN-02 | DEFAULT keys flatten to the parent token name | `colors.red.DEFAULT` + `colors.red.hot` + alias `{colors.red}` | Unions/types include `red` not `red.DEFAULT`; sheet `--colors-red` and `--colors-red-hot` | `default.test.ts` “tokens / with default” |
| NEO-TOKEN-03 | Semantic light/dark redeclare the same var | Token leaf `{ value: '#fff', dark: '#000' }` (Reference shape) | Base var on `:root`/html; dark island redeclares `--colors-*` | `format-vars.test.ts`; `generate-token.test.ts` “[css] should generate css” |
| NEO-TOKEN-04 | Nested colour-mode conditions compile | Semantic nested high-contrast under os-dark | Two condition-scoped var (or class) outcomes | `semantic-token.test.ts` “deeply nested” |
| NEO-TOKEN-05 | Colour mix slash opacity | `{colors.pink/30}` and opacity token `/half` | Sheet `color-mix(in srgb, var(--colors-pink) 30%, transparent)` | `color-mix.test.ts`; `generate-token.test.ts` “color-mix” |
| NEO-TOKEN-06 | Colour mix under dark | Semantic `_dark`/`dark` mix vs opaque | Light vs dark computed `color-mix` vs solid | `generate-token.test.ts` “color-mix in semanticTokens conditions” |
| NEO-TOKEN-07 | Decimal token keys escape in var names | `spacing['0.5']` or Reference `0.5r` | CSS `--spacing-0\.5` (or `--spacing-0\.5r`) and `var(--spacing-0\.5)` | `generate-token.test.ts:451`; `semantic-token.test.ts` special characters |
| NEO-TOKEN-08 | Negative spacing is calc(-1) of the positive var | `mt: '-4'` / `-sm` | Computed margin uses `calc(var(--spacing-4) * -1)` | `spacing.test.ts` “should add negative spacing”; dts negatives |
| NEO-TOKEN-09 | Composite shadow object flattens | Shadow token with offset/blur/color refs | `--shadows-*` is a single box-shadow list | `transform-shadow.test.ts`; `generate-token.test.ts` “shadow tokens - composite” |
| NEO-TOKEN-10 | Shadow arrays under dark stay one declaration | Semantic shadow `base`/`dark` as two arrays | Comma-joined shadows; `.dark` or theme island redeclares one var | `generate-token.test.ts` “should not extract shadow array…” |
| NEO-TOKEN-11 | Composite gradient token | Linear stops with `{colors.pink}` | `--gradients-*` linear-gradient text | `transform-gradient.test.ts` |
| NEO-TOKEN-12 | Composite border and borderWidths kebab | Object border + `{borderWidths.sm}` | `--border-widths-sm` and `--borders-*` | `transform-border.test.ts`; `generate-token.test.ts` “border widths” |
| NEO-TOKEN-13 | Semantic tokens alias via var, not inlined hex | `danger: '{colors.red}'` and `semanticRed: '{colors.danger}'` | `--colors-danger: var(--colors-red)` | `generate-token.test.ts` “should reuse css variable in semantic token alias” |
| NEO-TOKEN-14 | Missing token() fallback drops the var | Only if Neo supports `token()` in values; else skip | Missing path + fallback emits fallback literal | `expand-references.test.ts` “non existing token and fallback” |
| NEO-TOKEN-15 | colorPalette virtual vars | Palette-enabled colour scale + `colorPalette: 'red'` utility if exposed | `--colors-color-palette-500: var(--colors-red-500)` | `color-palette.test.ts` “should generate virtual palette” |
| NEO-TOKEN-16 | DEFAULT participates in colorPalette | `brand.DEFAULT` + `brand.hot` | `--colors-color-palette` → `--colors-brand` | `color-palette.test.ts` “DEFAULT keyword” |
| NEO-TOKEN-17 | Deep colour trees do not spawn unnamed blocks | Nested `deep.test.pool.palette.50` | Only dashed path vars | `generate-token.test.ts` issue 769 |
| NEO-TOKEN-18 | Private `_private` tokens stay in-package | `_private.secret` colour used in-world | Typecheck allows it in owner world; document extender stripping separately | Reference `tokens.ts` header; typegen `'_private.secret'` — **no Panda test** |
| NEO-TOKEN-19 | Semantic spacing at a breakpoint | `gutter: { value, @md }` or Reference media | `--spacing-gutter` changes under `@media` | `spacing.test.ts` “with semantic spacing”; `generate-token.test.ts` gutter 64rem |
| NEO-CSSVAR-01 | Dark island selector is data-panda-theme in Reference | Semantic colours + `data-panda-theme=dark` on html | Computed styles follow lib’s `[data-panda-theme=dark]` (not `[data-theme=dark]` unless we opt in) | lib sheet L2295 vs Panda `generate-token.test.ts:533` |
| NEO-CSSVAR-02 | Nested data-attribute + dark | `[data-color=material]` + dark | Cartesian selector redeclares surface var | `generate-token.test.ts` fixture CSS L541–547 |
| NEO-CSSVAR-03 | Multi-block hoverActive semantic colour | Custom condition object with two `@media` `@slot`s | Two media rules both set `--colors-accent` | `generate-token.test.ts` “semantic tokens emit one rule per @slot path” |
| NEO-CSSVAR-04 | Stacked dark × multi-block is cartesian | `_dark: { _hoverActive: … }` | `.dark:is(:hover)` under hover media | `generate-token.test.ts` “multi-block stacked under a parent-nesting condition” |
| NEO-CSSVAR-05 | Selector-only multi-block ORs attributes | `data-theme=dark` OR `data-dark-theme` | One rule list `[data-theme="dark"],[data-dark-theme]` | `generate-token.test.ts` “selector-only multi-block” |
| NEO-CSSVAR-06 | Theme pack uses data-panda-theme + prefers-color-scheme | If Neo grows Panda `themes`; else fold into CSSVAR-01 | `[data-panda-theme=pink]` + os-dark nested | `generate-themes.test.ts` “generateThemes” |
| NEO-FONT-01 | font() registry emits family vars and FontRegistry | `font('sans', { … })` + `css({ font: 'sans' })` | `--fonts-*` / computed font-family; `typecheck` `FontRegistry` | Panda `--fonts-sans` in `generate-token.test.ts`; Reference typegen `FontRegistry` |
| NEO-FONT-02 | Font weights from registry not only tokens.fontWeights | Registry weights `mono.bold` | `--font-weights-mono-bold` style | lib sheet L2188–2191 (production analogue) |
| NEO-KEYF-01 | keyframes() emit @keyframes in the token layer | Named spin-like animation | Stylesheet contains `@keyframes` body | `generate-keyframes.test.ts` “default keyframes” |
| NEO-KEYF-02 | Keyframe styles resolve size tokens | `from: { h: '4' }` | `height: var(--sizes-4)` or Reference spacing equivalent | `generate-keyframes.test.ts` “should allow tokens” |
| NEO-RESET-01 | Preflight box-sizing and margin reset | Enable reset if Neo ships it | `* { box-sizing: border-box }` in reset layer | `generate-reset.test.ts` “basic” |
| NEO-RESET-02 | Reset can be parent-scoped | `preflight.scope` analogue if exposed | Selectors prefixed `.pd-reset` | `generate-reset.test.ts` “with parent scope” |
| NEO-TYPE-01 | Token unions list dotted colour paths and 0.5 spacing | Minimal token tree | `typecheck`: `ColorToken` / `SpacingToken` match expected literals | `generate-token-dts.test.ts` “[dts] full token types” |
| NEO-TYPE-02 | Negative spacing names appear in SpacingToken | Spacing tokens present | `'-4'` assignable to spacing-typed props | `generate-token-dts.test.ts` “[dts] negative tokens” |
| NEO-TYPE-03 | StylePropValue allows null holes in arrays | `css({ m: [null, '4'] })` types | Compiles; runtime skips base | Panda `ConditionalValue` array `V \| null`; `toResponsiveObject` |
| NEO-TYPE-04 | Strict token mode rejects unknown colours | `strictTokens` / Reference strict goldens | `typecheck` fails on `color: 'not-a-token'` | `generate-style-props.test.ts` “with stricTokens true”; typegen `styles-strict.d.ts` |
| NEO-TYPE-05 | Recipe variant props are ConditionalValue | Small recipe `size: sm\|lg` | Variant may be `{ _hover: 'lg' }` | `generate-recipe.test.ts` `TextStyleVariantProps` |
| NEO-TYPE-06 | StyleConditionKey lists _dark and @sm | Default conditions | `typecheck` world uses `_hover` / `_dark` | typegen `styles.d.ts` `StyleConditionKey`; `spec-conditions.test.ts` |
| NEO-TYPE-07 | colorPalette names enter ColorToken if enabled | Palette on | `'colorPalette.500'` in union | `generate-token-dts.test.ts` ColorToken `colorPalette.*` |
| NEO-TYPE-08 | Escape hatch and important in strict types | If Neo mirrors `WithEscapeHatch` | `'red!'` / `'[123px]'` allowed under strict | `generate-prop-types.test.ts` `WithImportant` / `WithEscapeHatch` |
| NEO-NORM-01 | Responsive arrays skip null holes | `css({ px: [null, '4'] })` with bp keys | Only sm+ rule; no base padding | `normalize-style-object.ts` `toResponsiveObject` |
| NEO-NORM-02 | !important parsing matches Panda | `css({ color: 'red !important' })` and `'red!'` | Both mark important; Neo today only `endsWith('!')` | `shared/src/important.ts`; gap vs `css.ts` |
| NEO-NORM-03 | css() deep-merges later objects | Two `css` args nested `_hover` | Last-wins leaf; nested merge | `merge-props.test.ts` “can merge with getKey” |
| NEO-NORM-04 | Shorthand remap drops undefined longhand | `flexDir` + `flexDirection: undefined` | Only row direction class | `walk-object.test.ts` “should not set prop with nullish value” |
| NEO-NORM-05 | Array-valued shadows are leaves | `boxShadow: [a, b]` not indexed as responsive | One shadow declaration | `walk-object.test.ts` “stop at array”; shadow array CSS test |
| NEO-NORM-06 | Class/ident escaping for 0.5 and 1/2 | Utility class for spacing 0.5 | Escaped `\.` / `\/` in selector | `esc.test.ts` “decimal” / “flametest” |

**~42 cases.** Fold CSSVAR-06 into CSSVAR-01 if Neo will not implement Panda `themes` JSON. Fold TOKEN-14 if `token()` stays out of scope. RESET cases only if Neo emits preflight.

## 5. Out of scope

| Feature | Why out | Covering tests |
| --- | --- | --- |
| JSX factory / styled | Reference primitives, not Panda `jsx`/`styled` | `generate-pattern.test.ts` (also patterns); no jsx test in this set |
| Patterns pack | Neo/Reference patterns ≠ Panda pattern codegen | `generate-pattern.test.ts`; `slots.test.ts` (`getSlotRecipes`) |
| Studio / spec JSON / artifacts | Not the browser case loop | `spec-*.test.ts`, `setup-artifacts.test.ts`, `split-css.test.ts` |
| Runtime `token()` / `token.var` | **Reference does not export `token()`** (`rg` in `reference-core` / `reference-neo` / `reference-lib/src`: no accessor). Authors use `tokens()` collector + CSS vars. | `generate-token-js.test.ts` (4169 lines) |
| `textStyles` / `layerStyles` / `animationStyles` | **No matches** in `packages/reference-lib/src` or `packages/reference-core/src` | Panda `merge-props.test.ts` “text styles”; `generate-style-props` `textStyle?` prop; fixture `textStyle` recipe |
| `formatTokenName` `$` prefix / `hash: true` var names | Reference naming is dotted paths + `--kebab`; hashed `--jolVMp` is Panda opt-in | `format-token-name.test.ts`; `middleware.test.ts` hash; `css-var.test.ts` hash |
| Template-literal `css` syntax / `astish` as author API | Neo `css()` is object-only | `generate-css-fn.test.ts` string-literal; `astish.test.ts`; `string-literal.test.ts` |
| Assets SVG data-URL tokens | Not in Neo `tokens()` surface | `transform-asset.test.ts`; `generate-token.test.ts` “assets svg” |
| Panda `themes` injectTheme JS | Theme *islands* matter (CSSVAR); JSON loader/`injectTheme` does not | `generate-themes.test.ts` |
| `cleanupSelectors` placeholder scrubbing | Generator plumbing | `cleanup-selector.test.ts` |
| Circular token refs | **No test in corpus** — do not invent Panda behaviour | — |
| Preset-base exhaustive utility list as Neo cases | Canon already owns aliases/class prefixes | `preset-base/__tests__/utility.test.ts`; `modules/canon/README.md` |

---

*Probe date: 2026-09-17. No repository files were modified.*
