# Panda v1 parser / extractor / config / codegen probe

Corpus: `vendor/panda-v1` (Panda CSS 1.12.1, read-only). Compared quickly against Neo `packages/reference-neo/src/config/*.ts` and Atomic stations `ATM-SITE-*` / `ATM-COND-*`. Mine edges; do not port Panda.

---

## 1. Executive summary

Panda's parser tests are a catalog of **optimistic static evaluation**: unresolvable ternaries and `useState` emit **both arms** as extra style objects (and extra utility classes). Function-call values are the real closed door (`pickRandom(...)` → empty `raw`). Reference Atomic is import-bound (`ATM-SITE-10`) and host-bound via styletrace + `jsxElements` (`ATM-SITE-08`); Panda's default `matchTag` still extracts PascalCase strangers (`Random`, `OkComponent`) and even unimported `css()` in `cssParser` (stale test title `[without import] should not parse`). Neo `defineConfig` is a **deliberate subset**: `name`, `include`, `extends` (BaseSystem fragments, later-wins deep merge), `jsxElements`, `normalizeCss` — no presets, `theme.extend`, `importMap`, `strictTokens`, `staticCss`, `jsxFramework`, or `conditions` table. Breakpoints in Panda are `@media screen and (min-width: 40rem)` families (`sm`/`smOnly`/`smToMd`/`smDown`); Atomic `ATM-COND-01` lowers named `when` tokens to **`@container (min-width: Npx)`** — differ on purpose. `css.raw` composition, `token()` inlining to hex, template-literal syntax, styled factory, and patterns pack are Panda-only; Neo cases should prove object-form `css()`/`recipe()`/JSX StyleProps and **diagnostics for dynamics**, not ghost classes. Node tests do not snapshot the generated folder; `packages/generator/__tests__/setup-artifacts.test.ts` is the inventory of record. Production `packages/reference-lib/.reference-ui/styled/` still looks like Panda's `styled-system` (css/tokens/recipes/patterns/jsx/types + `styles.css`); Neo should treat most of that as core-compat, not a host contract.

---

## 2. File map

Line counts from the vendored files. `test/it` = Vitest `test(` / `it(` (not `describe`). Family tags: EXTRACT | JSXPROPS | CONFIG-MERGE | CONDITIONS-DEF | BREAKPOINTS | OUTDIR | TYPES | STATIC-CFG | PATTERN/OUT.

### `vendor/panda-v1/packages/parser/__tests__/` (27 test files + `fixture.ts` + bench)

| Path | Lines | Tests | Coverage | Family |
|---|---:|---:|---|---|
| `output.test.ts` | 4071 | 49 | End-to-end parse→CSS: `css({})`, multi-arg, `css.raw`, recipes, arrays, importMap, matchTag, arbitrary selectors, `!important` hatch, aliases | EXTRACT, JSXPROPS, STATIC-CFG |
| `preset-patterns.test.ts` | 3387 | 42 | Preset pattern fn + JSX (`box`, `flex`, `stack`, `cq`, …) | PATTERN/OUT |
| `jsx.test.ts` | 2255 | 45 | `styled.*` props, `_hover`, arrays, `css`/`*Css`, compiled runtimes (React/Preact/Vue/Solid/Qwik) | JSXPROPS |
| `css-raw-edge-cases.test.ts` | 1407 | 18 | `css.raw` spread, ternary, fn returns (limited), null/undefined | EXTRACT |
| `pattern-raw-extraction.test.ts` | 1090 | 16 | `*.raw` on patterns | PATTERN/OUT |
| `css-raw-variants.test.ts` | 875 | 7 | `css.raw` inside cva/sva | EXTRACT / PATTERN/OUT (cva) |
| `css-2.test.ts` | 632 | 6 | Nested objects, spread-on-child, **import alias `css as nCss`**, unimported `css()` still extracted | EXTRACT |
| `vue.test.ts` | 543 | 4 | Vue SFC extract | JSXPROPS / OUT (framework) |
| `css-raw-spread.test.ts` | 499 | 7 | Identifier + cross-file `css.raw` spreads | EXTRACT |
| `cva.test.ts` | 371 | 1 | `cva({ base, variants, compoundVariants })` | EXTRACT / OUT (cva as Panda recipe-lite) |
| `svelte.test.ts` | 341 | 1 | Svelte extract | OUT |
| `svelte-runes.test.ts` | 320 | 12 | Svelte 5 runes | OUT |
| `sva.test.ts` | 314 | 4 | Slot recipes; **unresolvable `slots` identifier still extracts base** | EXTRACT |
| `token.test.ts` | 313 | 13 | `token()` / `token.var()` **inlined to hex/var** at parse | EXTRACT |
| `namespace.test.ts` | 297 | 7 | `import * as panda`; ignore non-panda namespaces | EXTRACT, JSXPROPS |
| `jsx-recipe.test.ts` | 284 | 2 | Recipe `jsx: ['Button', /WithRegex$/]`; dotted `Tabs.Root` | JSXPROPS |
| `import-map.test.ts` | 263 | 2 | Nested outdir + `importMap`; multiple maps | EXTRACT (import identity) |
| `css.test.ts` | 207 | 1 | Nested/`[dir=rtl]`/`&[data-state=closed]` keys (title says without import; file **has** import) | EXTRACT |
| `css-raw.test.ts` | 206 | 1 | `css.raw` + `recipe.raw` + `stack.raw` | EXTRACT / PATTERN/OUT |
| `static-css.test.ts` | 137 | 3 | `theme.recipes[].staticCss` and `staticCss.recipes` | STATIC-CFG |
| `styled.test.ts` | 127 | 1 | `styled()` factory | PATTERN/OUT |
| `ast-dynamic.test.ts` | 124 | 1 | Config recipe calls (`textStyle({ variant })`) | EXTRACT |
| `jsx-pattern.test.ts` | 114 | 2 | Pattern JSX tags | PATTERN/OUT |
| `patterns.test.ts` | 84 | 1 | Pattern call sites | PATTERN/OUT |
| `string-literal.test.ts` | 55 | 1 | `syntax: 'template-literal'` `styled.div\`...\`` | PATTERN/OUT |
| `css-prop.test.ts` | 26 | 1 | JSX `css` prop parse | JSXPROPS |
| `import.test.ts` | 23 | 1 | `import { css as nCss } from "@panda/css"` + `importMap: '@panda'` | EXTRACT |
| `fixture.ts` | 158 | 0 | Harness (`parseAndExtract`, parsers) | n/a |
| `ts-eval.bench.ts` | 56 | 0 | Bench | n/a |

### `vendor/panda-v1/packages/extractor/__tests__/` (3 tests + helpers)

| Path | Lines | Tests | Coverage | Family |
|---|---:|---:|---|---|
| `extract.test.ts` | 7599 | 188 | Literal/ternary/logical/member/`as const`/spread/call; **both arms** vs **empty raw**; compiled JSX helpers | EXTRACT, JSXPROPS |
| `unbox.test.ts` | 4504 | 5 | `unbox()` of maps: spreads, unresolvable rest, conditions | EXTRACT |
| `declarations-files.test.ts` | 3137 | 1 | Cross-package `.d.ts` theme (`defineProperties`) | EXTRACT |
| `create-project.ts` | 48 | 0 | Test ts-morph project | n/a |
| `extract-speed.bench.ts` | 16 | 0 | Bench | n/a |

Sampled 15 extractor titles (most relevant to fail-closed vs guess): L3222 non-deterministic CallExpression → nothing; L3363 useState BindingElement → both outcomes; L3400 unresolvable ternary → both; L3540 JSX spread object; L3581 Identifier spread; L3716 CallExpression spread; L4163 unbox unresolvable spread; L4304 unbox const map; L4328 unbox nested spread last-wins; L4349 unbox conditions; L2148 ElementAccess **without** `as const` still resolves; L2545 template interpolation in access; L3153 ArrowFunction CallExpression; L4952 Identifier without initializer; L7465 unrelated local jsx helper not extracted.

### `vendor/panda-v1/packages/config/__tests__/` (12 files)

| Path | Lines | Tests | Coverage | Family |
|---|---:|---:|---|---|
| `merge-config.test.ts` | 1166 | 14 | `mergeConfigs`: tokens, `theme` vs `theme.extend`, utilities, recipes, flat+nested DEFAULT | CONFIG-MERGE |
| `validate-config.test.ts` | 832 | 27 | Breakpoint units, condition `&` / `@slot`, token paths, cycles, clashes | CONDITIONS-DEF, BREAKPOINTS, CONFIG-MERGE |
| `bundle-config.test.ts` | 539 | 15 | Bundle `.ts/.js/.cjs/.mjs` + tsconfig path aliases | CONFIG-MERGE (load) |
| `merge-presets.test.ts` | 317 | 1 | Recursive `presets[]` + async factory presets | CONFIG-MERGE |
| `merge-hooks.test.ts` | 202 | 3 | Hook sequential merge | PATTERN/OUT |
| `preset-resolved-hook.test.ts` | 136 | 3 | `preset:resolved` hook | PATTERN/OUT |
| `find-tsconfig-path.test.ts` | 80 | 6 | tsconfig discovery | n/a |
| `resolve-tsconfig.test.ts` | 46 | 5 | parse tsconfig | n/a |
| `tsconfig-project-match.test.ts` | 42 | 1 | project match | n/a |
| `bundle-n-require.test.ts` | 40 | 2 | require interop | n/a |
| `resolve-ts-base-url.test.ts` | 21 | 3 | baseUrl | n/a |
| `is-panda-config.test.ts` | 9 | 1 | filename detect | n/a |

**Not in this folder:** `prefix`, `hash`, `separator`, `cascadeLayer`, `globalVars`, `globalFontface`, `themes` multi-theme, `include`/`exclude` glob semantics — those live in types + other packages (node `glob-dirname`, generator). Cited only where tests exist.

### `vendor/panda-v1/packages/node/__tests__/` (5 files)

| Path | Lines | Tests | Coverage | Family |
|---|---:|---:|---|---|
| `diff-engine.test.ts` | 737 | 9 | Affected **artifact ids** (`tokens`, `recipes`, `create-recipe`, `patterns`, `css-fn`, …) | OUTDIR |
| `output-engine.test.ts` | 115 | 5 | Writes `styled-system/styles.css` only if content changed | OUTDIR |
| `glob-dirname.test.ts` | 107 | 3 | Glob → directory for `include` | CONFIG-MERGE |
| `config-reload.test.ts` | 59 | 1 | Reload + `import { css } from '../styled-system/css'` | OUTDIR |
| `load-tsconfig.solution.test.ts` | 37 | 2 | Solution-style tsconfig | n/a |

Full folder inventory is **not** here; see `packages/generator/__tests__/setup-artifacts.test.ts` §5.

### `vendor/panda-v1/sandbox/codegen/__tests__/` (20 files)

| Path | Lines | Tests | Snapshots | Family |
|---|---:|---:|---|---|
| `css.test.ts` | 365 | 38 | Runtime class strings + CSS for `css()` (conditions, arrays, merge, token helper) | EXTRACT / TYPES (runtime) |
| `cva.test.ts` | 77 | 5 | Generated `cva` class strings + splitVariantProps | PATTERN/OUT (keep recipes analog) |
| `recipe.test.ts` | 90 | 9 | Generated recipe classes, compoundVariants error | TYPES / EXTRACT |
| `slot-recipe.test.ts` | 66 | 5 | Slot recipe runtime | PATTERN/OUT |
| `sva.test.ts` | 101 | 5 | Generated `sva` | PATTERN/OUT |
| `styled-factory.test.tsx` | 400 | 23 | `styled()` factory | PATTERN/OUT |
| `scenarios/format-names.test.tsx` | 304 | 17 | class name format | TYPES |
| `scenarios/jsx-minimal.test.tsx` | 352 | 19 | `jsxStyleProps: 'minimal'` | JSXPROPS / PATTERN/OUT |
| `scenarios/jsx-none.test.tsx` | 352 | 19 | `jsxStyleProps: 'none'` | JSXPROPS / PATTERN/OUT |
| `scenarios/strict.test.ts` | 372 | 36 | `strictTokens`+`strictPropertyValues` types | TYPES |
| `scenarios/strict-tokens.test.ts` | 189 | 18 | `strictTokens` types + `!important` types | TYPES |
| `scenarios/strict-property-values.test.ts` | 171 | 18 | property-value strictness | TYPES |
| `frameworks/*.styled-factory.test.tsx` (preact, qwik, solid, vue) | 368–456 | 23 each | Factory per framework | PATTERN/OUT |
| `frameworks/*.style-context.test.tsx` (preact, react, solid, vue) | 62–138 | 4–6 | `createStyleContext` | PATTERN/OUT |

---

## 3. Edge cases by family

Neo relevance tags: `neo-config` | `rust-extract` | `browser` | `sheet` | `types` | `n/a`. Reference check: **match** / **differ** / **unknown**.

### EXTRACT — call-site shapes and the extractable boundary

**1. Multi-arg `css()` keeps every object (does not last-wins at extract)**  
Evidence: `output.test.ts:233–277`  
Input: `css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })`  
Extracted `data`: both objects; CSS emits `.mx_3`, `.mx_10`, `.pt_4`, `.pt_6`.  
**Neo:** `rust-extract` — **match** `ATM-SITE-02` (“Multi-arg `css()` emits every argument”). Browser merge/last-wins is a **runtime** question (`NEO-CSS-01` already paints `css()`).

**2. Unresolvable ternary → both literal arms (Panda guesses)**  
Evidence: `output.test.ts:878–920`  
Input: `css({ color: isHovered ? "blue.100" : "red.100" })` with `useState`  
JSON `data`: `{ color: "blue.100" }`, `{ color: "red.100" }`, `{}`  
CSS: both `.c_blue\.100` and `.c_red\.100`.  
Extractor twin: `extract.test.ts:3400–3425` — `conditions: [{color:"purple.900"},{color:"purple.950"}]`, `raw: {}`.  
**Neo:** `rust-extract` — **match-ish** `ATM-SITE-05` (“ternary spreads keep siblings and **both arms**”) at extract; **differ from the product fail-closed slogan** if Neo browser cases want a **diagnostic and no ghost class** for runtime-only values. Propose `NEO-SITE` that asserts both compiled classes exist **or** a diagnostic — product must pick.

**3. Non-deterministic function call → nothing (true closed door)**  
Evidence: `extract.test.ts:3223–3241`  
Input: `<ColorBox color={pickRandom(array)}>`  
Output: `{ raw: {}, conditions: [], spreadConditions: [] }`  
`css.raw` fn spread: `css-raw-edge-cases.test.ts:1073–1148` — `...getThemeStyles('dark')` does **not** merge theme into the outer `css({...})`; only `...baseStyles` identifier spread applies. Inner `css.raw` in the function **still extract as their own css sites**.  
**Neo:** `rust-extract` — **match** `ATM-SITE-04` (unknown helpers not sites). **unknown** whether a **diagnostic** is emitted today (stations say “no wants”, not error text). Browser: ghost-class absence.

**4. Identifier / const object / `as const`**  
Evidence: `extract.test.ts:2148–2168` — `colorMap["red"]` **without** `as const` still `raw.color = "red.600"`.  
`unbox.test.ts:4304–4325` — `my: spacings.md` with `const spacings = { md: 6 }` → `my: 6`.  
**Neo:** `rust-extract` — **match** `ATM-SITE-06` (top-level consts) and `ATM-SITE-11` (identifier spreads). Cross-file: **match** `ATM-SITE-16`.

**5. Spread of const / `css.raw` reuse**  
Evidence: `css-raw-edge-cases.test.ts:904–975` — `...(variant === 'primary' ? primaryStyles : secondaryStyles)` with `const isEnabled = true` **evaluates** the known boolean; `_hover` also inlines `primaryStyles`.  
`unbox.test.ts:4328–4347` — later nested spread **wins** `backgroundColor: "green.100"`, `color` from `another`.  
Unresolvable `...something`: `unbox.test.ts:4164` keeps known keys, does not crash.  
**Neo:** `rust-extract` — **match** `ATM-SITE-05`/`11`. `css.raw` itself is **Panda API** — Neo has `css.object()` (`ATM-SITE-02`), not `css.raw`.

**6. Import alias + namespace + importMap**  
Evidence: `css-2.test.ts:310–323` `import {css as nCss}` extracts `nCss({ color: 'red' })`.  
`output.test.ts:3294–3336` two aliases `css` and `css2` both extract.  
`import.test.ts:6–20` `import { css as nCss } from "@panda/css"` with `importMap: '@panda'` → `{ alias: "nCss", name: "css", mod: "@panda/css" }`.  
`namespace.test.ts:79–86` `import * as panda from "styled-system/css"; panda.css({ color: "red" })`.  
`output.test.ts:2099–2126` object `importMap` remaps css/recipes/patterns/jsx.  
**Neo:** `rust-extract` — **match** `ATM-SITE-15` (namespace + aliases). **differ** `importMap` / `@pandacss/dev` — Neo scans Reference runtime imports, not Panda outdir maps. `neo-config` has **no** `importMap` field — **deliberate differ**.

**7. Unimported `css()` still parsed by `cssParser`**  
Evidence: `css-2.test.ts:5–18` title `[without import] should not parse` but snapshot **contains** both `css` maps.  
**Neo:** `rust-extract` — **differ** `ATM-SITE-10` (parameter/local `css` is not a site; needs Reference import).

**8. Template literal interpolation**  
Evidence: `output.test.ts:65` backtick URL extracted as string; `token.test.ts:29–48` `` border: `1px solid ${token('colors.gray.400')}` `` → `"border": "1px solid #9ca3af"`.  
`string-literal.test.ts` is **tagged template CSS** under `syntax: 'template-literal'` — OUT.  
**Neo:** `rust-extract` — **match** `ATM-SITE-12` (tagged templates **not** a site, no diagnostic). Interpolated object values: **unknown** (token() inlining is Panda-specific).

**9. Condition keys in objects**  
Evidence: `output.test.ts:9–12` `{ base, md }` → `@media screen and (min-width: 48rem)` for `md`.  
`output.test.ts:923–944` computed keys `".closed > &"`, `"& + &"`, `"&[data-state='open']"`.  
`output.test.ts:3339–3381` `_weirdCondition` from `conditions.weirdCondition: ['@media ...', '&:hover', ...]`.  
`css.test.ts:20–26` `'[dir=rtl]'` and `'&[data-state=closed]'`.  
Sandbox `css.test.ts:53–54` `['&:data-panda']` → class `"[&:data-panda]:d_flex"`.  
**Neo:** `rust-extract` / `sheet` — **match** `ATM-COND-02` `_hover` → `&:is(:hover, [data-hover])` (Panda CSS uses the same `:is(:hover, [data-hover])` in `output.test.ts:199`). **differ** breakpoint `md` → Panda `@media screen`; Atomic `@container` (`ATM-COND-01`). Arbitrary `&` — **match** `ATM-COND-09`/`14`. Unknown `_hovr` — **match** `ATM-COND-12` warn + no utility.

**10. `token()` as a value is evaluated, not left as a call**  
Evidence: `token.test.ts:5–26` `token('colors.red.500')` → `"#ef4444"` in extracted data; missing path uses fallback (`token.test.ts:214–236`).  
**Neo:** `rust-extract` — **differ / unknown**. `ATM-SITE-04` would treat unknown calls as non-sites; `token()` is not an extract **site** but a **value**. If Atomic does not eval `token()`, Neo browser would show a diagnostic or unresolved value — do not copy hex inlining.

### JSXPROPS — hosts, merge, arrays, important, order

**1. Who is a host**  
Evidence: `output.test.ts:3057–3129` default `matchTag`: lowercase `<div color="red" />` **not** in json; `<Stack>` (pattern import) extracts; **`<Random fontSize="12px" />` and `<OkComponent padding="4" />` extract** without imports.  
`jsx.test.ts:59–70` `<styled.button>` / `<styled.div>` are `jsx-factory`.  
`jsxStyleProps: 'minimal'` (`jsx.test.ts:694–724`): `css` and `inputCss` extract; **`color="blue"` does not**.  
Custom `matchTag` / `matchTagMode: 'extend'|'override'` at `output.test.ts:3133–3291`.  
Recipe hosts: `jsx-recipe.test.ts` `jsx: ['Button', /WithRegex$/]`.  
**Neo:** `rust-extract` / `neo-config` — **differ** PascalCase guessing. **match** `ATM-SITE-08` (styletrace + Reference imports; local `<Foo>` not a host). **match** Neo `jsxElements?: string[]` as explicit extra hosts (`types.ts:41–45`, `validate.ts` string array). No `jsxFactory` / `jsxFramework` on Neo config — **deliberate differ**.

**2. `css` prop + style props**  
Evidence: `output.test.ts:74–88` `styled.div` with `p`, `md={{...}}`, and `css={{ md, _hover }}` merged into one jsx-factory `data` object (`css` nested, siblings `p`/`md`).  
`ATM-SITE-14`: `css={{}}` same wants as `css()`. **match**.  
Array `css={[{ color: 'blue.300' }, { backgroundColor: 'green.300' }]}` (`jsx.test.ts:529–594`) emits **both** utilities. **Neo:** `rust-extract` **unknown** (array css prop).

**3. `_hover={{}}`, responsive, boolean**  
Evidence: `jsx.test.ts:352–361` `marginLeft={disabled ? "40px" : "50px"}` with `const disabled = true` → **only `"40px"`** (evaluated). Contrast runtime `useState` both-arms.  
`ATM-SITE-09` boolean `<Div border />` → `Bool(true)`. Panda `debug` boolean → `outline: ... !important` (`output.test.ts:187–193`).  
**Neo:** `browser` / `rust-extract` — **match** booleans; **differ** Panda `debug` utility.

**4. `!important` in values**  
Evidence: `output.test.ts:2886–2937` `strictTokens: true` + `'[rgb(51 155 240)!important]'` / `'[rgb(51 155 240)!]'` → CSS `border-color: rgb(51 155 240) !important`.  
Types: `sandbox/.../strict-tokens.test.ts:115` `important`.  
**Neo:** `sheet` / `types` — **unknown** (no ATM station titled important). Do not assume the `[…!]` hatch.

**5. Property order**  
Panda snapshots sort JSON keys alphabetically (`_hover` before `bg`). CSS class **order** in `@layer utilities` is encoder order, not source order (`output.test.ts:259–276` mx then pt).  
**Neo:** `n/a` for JSON key sort; `sheet` if cascade depends on rule order — **unknown**.

**6. Compiled JSX (automatic runtime)**  
Most of `jsx.test.ts:744–2206` and `extract.test.ts:6372+` — **n/a** for Neo worlds (TSX source, not bundled helpers). Keep as extractor corpus only.

### CONFIG-MERGE — presets / extends / theme.extend

**1. Later `theme.extend` wins on the same token; presets accumulate**  
Evidence: `merge-config.test.ts:11–55`  
Preset extend `{ red, blue: from-preset }` + config extend `{ blue: from-config }` → `red: from-preset`, `blue: from-config`.  
Multiple presets (`:58–128`): `blue` from **preset-3**, `red` from **config**.

**2. `theme.extend` from an earlier preset overrides later non-extend tokens**  
Evidence: `merge-config.test.ts:234–272` `config + preset.extend`: config `theme.tokens.colors.pink = from-config` **loses** to preset `theme.extend` `from-preset`.  
Inverse `config.extend + preset` (`:275–314`): config extend **wins** `from-config`.

**3. Arrays replace; objects deep-merge**  
Panda utilities merge (`merge-config.test.ts:997–1026`): `className: 'bg'` + extend `className: 'bgc'` → `{ className: 'bgc', values: 'colors' }`.  
Recipes extend **merges variant maps** (later keys added, not wiping the recipe) in `merge-config.test.ts:1031+` and `merge-presets.test.ts:10`.  
**Neo:** `neo-config` — **differ model, similar leaf merge**. `extends?: BaseSystem[]` are **synced fragment IIFEs**, not Panda presets. `mergeFragmentObjects` (`fragments/base/merge.ts`): plain objects recurse; **arrays and scalars replace**; later wins (`merge.test.ts:32–38`). No `theme` vs `theme.extend` split — **deliberate differ**. Duplicate keys: later fragment wins — **match spirit**, not Panda extend-after-base ordering.

**4. Validation surface**  
Panda `validate-config.test.ts:254–269` mixed breakpoint units throws  
`[breakpoints] All breakpoints must use the same unit: \`640em, 768px, 1024px\``.  
Conditions without `&` (`:274–286`): `[conditions] Selectors should contain the \`&\` character`.  
Object conditions need `'@slot'` (`:303–317`).  
**Neo:** `neo-config` — **deliberate differ**. Validator only: object export, `include` array, non-empty `name` (no `"` / newlines), `jsxElements` string[], `extends[]` BaseSystem with fragment/css/jsxElements (`validate.ts`, `validate.test.ts`). Unknown Panda fields **ignored** (`validate.test.ts:65–76`). Error prefix `reference-ui: ` (`errors.ts`). Do **not** copy Panda condition/`&` validation unless Neo grows a `conditions` table (it must not — conditions live in Rust + fragments).

**5. include / outdir / hash / prefix / staticCss**  
`static-css.test.ts:4–40` `theme.extend.recipes.textStyle.staticCss: [{ size: ['h1'] }]` emits `.textStyle--size_h1` without a call site.  
`glob-dirname.test.ts` only dirname extraction.  
**Neo:** `neo-config` — `include` **is** required (scan roots). No `exclude`, `outdir` (publish uses `.reference-ui/`), `hash`, `prefix`, `separator`, `cascadeLayer`, `staticCss`. **deliberate differ**.

### CONDITIONS-DEF

Panda: `conditions` map, `_` prefix at call sites (`_hover`, `_weirdCondition`), string or **array of selector/at-rule steps**, or nested object with `@slot`.  
**Neo:** not in `defineConfig`. Named conditions come from the compiled system / Atomic catalog (`ATM-COND-02` `_hover`, `ATM-COND-03` `_dark`, `ATM-COND-10` interaction set, `ATM-COND-12` unknown `_` warns). Custom author `&[data-x]` — **match** `ATM-COND-09`. **differ** Panda config-defined `_custom`.

### BREAKPOINTS

Evidence: `packages/core/__tests__/breakpoints.test.ts:92–119` (not in the five target dirs; required for exact strings). Fixture:

| Token | `@media` query |
|---|---|
| `sm` | `screen and (min-width: 40rem)` |
| `smDown` | `screen and (max-width: 39.9975rem)` |
| `smOnly` | `screen and (min-width: 40rem) and (max-width: 47.9975rem)` |
| `smToMd` | same as `smOnly` |
| `2xl` | `screen and (min-width: 96rem)` |
| `2xlDown` | `screen and (max-width: 95.9975rem)` |
| `2xlOnly` | `screen and (min-width: 96rem)` (open-ended) |

Parser uses those for `md:` → `48rem` (`output.test.ts:37–46`). Array index 0/1/2 → base/sm/md (`output.test.ts:2483–2502`).  
`@container` names: preset pattern `cq` / `containerNames` token (`preset-base` utilities) — **PATTERN/OUT** for the pattern pack; Atomic `ATM-COND-15`/`16` own container-query contract.  
**Neo:** `sheet` / `browser` — **differ** `ATM-COND-01` (`@container (min-width: Npx)` not `@media screen`). **match** range idea `ATM-COND-13`. Custom px keys in `r={{ 300: ... }}` — `ATM-COND-07`.

### OUTDIR / TYPES / STATIC-CFG

See §5. `diff-engine.test.ts:25–54` adding a token marks artifact set including `'tokens'`, `'css-fn'`, types, jsx, … `output-engine.test.ts:51` writes `styled-system/styles.css`.  
Sandbox `css.test.ts` snapshots **class name strings** (`"d_flex"`, `"hover:bg_yellow.100"`) not `.d.ts` text. Strict scenarios are **type-level** (`assertType` / `@ts-expect-error`).  
**Neo:** `types` — Panda `strictTokens` **n/a** unless Neo typegen grows it. `staticCss` **n/a**.

---

## 4. Proposed Neo cases

Existing IDs avoided: `NEO-CSS-01/02`, `NEO-EDGE-01/02`, `NEO-RECIPE-01`, `NEO-PRIM-01`, `NEO-SYNC-01`, `NEO-SMOKE-01`, `NEO-SNAP-A-01`, `NEO-PLAY-B-01`.

| ID | README first line | World | Assertion | Panda evidence |
|---|---|---|---|---|
| **NEO-SITE-01** | Two `css()` arguments both become utilities | `css({ color: 'red' }, { mt: '1r' })` | Sheet contains both; second does not delete the first at extract | `output.test.ts:233` |
| **NEO-SITE-02** | Literal ternary both arms compile (or the product diagnostic fires) | `css({ color: flag ? 'red' : 'blue' })` with module `const flag` vs runtime | If `const flag = true`, only red (**Panda jsx.test evaluated const**); if `useState`, decide both-classes vs diagnostic | `output.test.ts:878`; `jsx.test.ts:352`; `extract.test.ts:3400` |
| **NEO-SITE-03** | Local const style object is resolved | `const box = { p: '1r' }; css(box)` | Same utilities as inline | `ATM-SITE-06`; extractor unbox L4304 |
| **NEO-SITE-04** | Identifier spread unpacks known keys | `css({ color: 'red', ...rest })` `const rest = { mt: '1r' }` | Both color and mt | `ATM-SITE-11`; `unbox.test.ts:4328` |
| **NEO-SITE-05** | Import alias `css as c` is a site | `import { css as c } from '…'` | `c({ display: 'flex' })` paints | `css-2.test.ts:310`; `ATM-SITE-15` |
| **NEO-SITE-06** | Namespace import `import * as ui` is a site | `ui.css({ … })` | Extracts | `namespace.test.ts:79`; `ATM-SITE-15` |
| **NEO-SITE-07** | A local function named `css` is not a site | `function css(x){}`; `css({ color: 'red' })` | No utility / diagnostic | `ATM-SITE-10`; **differ** Panda `cssParser` unimported |
| **NEO-SITE-08** | Dynamic call value does not mint a ghost class | `css({ color: pick() })` | No `.c_*` for unknown; compiler diagnostic | `extract.test.ts:3223`; `css-raw-edge-cases.test.ts:1073` |
| **NEO-SITE-09** | Nested condition objects `_hover` + `sm` | `css({ _hover: { color: 'red' }, sm: { mt: '1r' } })` | Hover selector + container/media query | `sandbox/css.test.ts:34–60`; `ATM-COND-02`/`01` |
| **NEO-SITE-10** | Arbitrary `&` selector key | `css({ '&[data-x]': { color: 'red' } })` | Rule scopes `[data-x]` | `output.test.ts:923`; `ATM-COND-09` |
| **NEO-SITE-11** | String `@media` key is an at-rule not a selector | `css({ '@media (min-width: 400px)': { p: '1r' } })` | Printed as `@media` | `ATM-COND-11`; sandbox token-in-condition L76 |
| **NEO-SITE-12** | Tagged template is not an extract site | `` css`color: red` `` | No wants, no crash | `ATM-SITE-12`; `string-literal.test.ts` OUT |
| **NEO-SITE-13** | Cross-file const resolution | `styles.ts` export object imported into `app.tsx` | Same as local const | `ATM-SITE-16`; `css-raw-spread.test.ts:423` |
| **NEO-SITE-14** | Logical `&&` spread of a const object | `css({ p: '1r', ...(ok && extra) })` | When `ok` is const true, extra lands; when runtime, both-or-diagnostic | `extract.test.ts` logical; `ATM-SITE-05` |
| **NEO-JSX-01** | StyleProps on `Div` / `Button` primitives | `<Div bg="red" />` | Paints; not a DOM attribute leak | `ATM-SITE-01`; `NEO-PRIM-01` sibling |
| **NEO-JSX-02** | `css={{}}` on a primitive equals `css()` | `<Div css={{ mt: '1r' }} />` | Same utilities | `ATM-SITE-14`; `jsx.test.ts:410` |
| **NEO-JSX-03** | `_hover={{ color: 'red' }}` on a primitive | `<Div _hover={{ color: 'red' }} />` | `:is(:hover,[data-hover])` | `jsx.test.ts` conditions; `ATM-COND-02` |
| **NEO-JSX-04** | Configured `jsxElements` is a StyleProps host | `jsxElements: ['Chart']`; `<Chart p="1r" />` | Extracts; unlisted `<Foo p>` does not | `output.test.ts:3057` **anti-pattern**; `ATM-SITE-08`; Neo `jsxElements` |
| **NEO-JSX-05** | Unlisted PascalCase is not a host | `<Random fontSize="12px" />` | No `.fs_12px` | **differ** Panda default matchTag L3057 |
| **NEO-JSX-06** | Lowercase DOM tag is not a StyleProps host | `<div color="red" />` | No extract (Panda match) | `output.test.ts:3063` |
| **NEO-JSX-07** | `css` prop plus sibling StyleProps | `<Div p="1r" css={{ color: 'red' }} />` | Both paint | `output.test.ts:74–88` |
| **NEO-JSX-08** | Boolean style attribute | `<Div border />` | `Bool(true)` utility | `ATM-SITE-09` |
| **NEO-JSX-09** | Array responsive value on JSX | `<Div p={['1r', '2r']} />` | Base + next breakpoint | `output.test.ts:2357–2503` |
| **NEO-JSX-10** | Important marker on a StyleProp if the dialect supports it | `<Div color="red!" />` or documented hatch | `!important` in sheet **or** diagnostic | `output.test.ts:2886` |
| **NEO-CONFIG-01** | `extends` later fragment wins on the same token leaf | Two BaseSystems + local `tokens()` | Computed color is the later value | `merge-config.test.ts:11`; Neo `mergeFragmentObjects` |
| **NEO-CONFIG-02** | `extends` arrays replace, they do not concat | Upstream `weights: ['400']`, local `['700']` | Only 700 | Neo `merge.test.ts:32`; Panda arrays replace |
| **NEO-CONFIG-03** | Missing `include` error text | `defineConfig({ name: 'x' })` | Throws `/must have an 'include' array/i` | Neo `validate.test.ts:32`; not Panda |
| **NEO-CONFIG-04** | Missing `name` error text | include only | `/must have a non-empty 'name'/i` | Neo `validate.test.ts:40` |
| **NEO-CONFIG-05** | Unsafe `name` quotes/newlines | `name: 'bad"x'` | `/safe for CSS @layer/` | Neo `validate.test.ts:49` |
| **NEO-CONFIG-06** | `jsxElements` must be string[] | `jsxElements: [1]` | invalidConfig | Neo `validate.ts:57–63` |
| **NEO-CONFIG-07** | `extends` entry without synced data | `{ name: 'up' }` | must include fragment/css/jsxElements | Neo `validate.ts:122–126` |
| **NEO-CONFIG-08** | `include` globs actually scan | `include: ['src/**/*.ts']` vs file outside | Outside file’s `css()` not in sheet | Panda `include` (no unit test in config/); Neo load |
| **NEO-CONFIG-09** | Unknown Panda keys are ignored | `strictTokens: true` in ui.config | Loads; does not enable Panda strict | Neo `validate.test.ts:65` |
| **NEO-BP-01** | Named `sm` lowers to the host query family | `css({ sm: { p: '1r' } })` | `@container`/`@media` string matches Atomic, **not** Panda `screen and (min-width: 40rem)` unless product changes | `breakpoints.test.ts:108`; `ATM-COND-01` |
| **NEO-BP-02** | `smOnly` / `smToMd` bounded queries | `css({ smOnly: { p: '1r' }, smToMd: { mt: '1r' } })` | Equal bounded queries if both exist; else diagnostic | `breakpoints.test.ts:110–113`; `ATM-COND-13` |
| **NEO-BP-03** | `smDown` max-width family | `css({ smDown: { p: '1r' } })` | max-width query | `breakpoints.test.ts:109` |
| **NEO-BP-04** | `2xl` open-ended min-width | `css({ '2xl': { p: '1r' } })` | min-width only | `breakpoints.test.ts:94–96` |
| **NEO-BP-05** | Custom numeric `r` key | `r={{ 300: { p: '1r' } }}` | concrete container/media | `ATM-COND-07` |
| **NEO-BP-06** | Named container query needs a container root | `@container card (min-width: …)` without root | compiler says so | `ATM-COND-15`; Panda `cq` PATTERN/OUT |
| **NEO-BP-07** | Array syntax indexes the breakpoint scale | `p={['1r', '2r', '3r']}` | base / sm / md | `output.test.ts:2441`; sandbox css L64 |

---

## 5. Generated folder comparison

Panda inventory from `vendor/panda-v1/packages/generator/__tests__/setup-artifacts.test.ts:129–317` (`getArtifacts()`), plus node’s `styled-system/styles.css` write. Reference listing: `packages/reference-lib/.reference-ui/styled/` (core production host, not Neo).

| Area | Panda `styled-system/` | Reference `.reference-ui/styled/` | Note |
|---|---|---|---|
| Root CSS | `styles.css` (via node OutputEngine) | `styles.css`, **`global.css`** | Reference extra global dump |
| Helpers | `helpers.mjs` | `helpers.js` | Extension `.js` vs `.mjs` |
| css fn | `css/{css,cva,sva,cx,conditions,index}.{mjs,d.ts}` | `css/{css,cva,sva,cx,conditions,index}.{js,d.ts}` | Same shape; still Panda-like |
| tokens | `tokens/{index,tokens}.d.ts`, `index.mjs` | `tokens/{index.js,index.d.ts,tokens.d.ts}` | Match |
| recipes | `recipes/create-recipe.mjs`, `index`, per-recipe files | `recipes/{create-recipe,font-style,index}.{js,d.ts}` | Reference slimmed recipe set |
| patterns | `patterns/{index,box,flex,…,cq}.{mjs,d.ts}` | `patterns/` still present (box, flex, …) | **Not dropped in lib**; Neo OUT |
| jsx factory | `jsx/{factory,box,flex,…,create-style-context,is-valid-prop,index}` | `jsx/` same pattern components | **Not dropped in lib**; Neo OUT |
| types | `types/{jsx,global,index,prop-type,style-props,conditions,csstype,static-css,selectors,composition,recipe,pattern,parts,system-types}.d.ts` | **identical filenames** under `types/` | Core still Panda typegen |
| themes | (artifact `themes/` in generator when configured) | `themes/{index,theme-dark.json,theme-light.json}` | Reference extra JSON themes |
| package | optional `emitPackage` | `package.json` | Present |
| extra | — | `runtime-data.mjs` / `.d.mts`, `extensions/index.mjs` | Reference-only |

**Neo publish** should not treat patterns/jsx/cva/sva as required. Node tests never listed this tree; they only prove skip-unchanged writes and diff artifact **ids**.

---

## 6. Out of scope (do not mint Neo cases)

| Topic | Covering files | Why |
|---|---|---|
| `styled()` factory / `styled.div` | `parser/.../styled.test.ts`, `output.test.ts` factory tests, `sandbox/.../styled-factory.test.tsx`, frameworks/* | Neo primitives, not Panda factory |
| Patterns pack (`stack`, `box`, `cq`, …) | `preset-patterns.test.ts`, `patterns.test.ts`, `jsx-pattern.test.ts`, `pattern-raw-extraction.test.ts` | PATTERN/OUT |
| JSX factory + `jsxFramework` + compiled runtimes | most of `jsx.test.ts` from L744, extractor L6372–7529, vue/svelte tests | Worlds are source TSX |
| `cva` / `sva` as author APIs | `cva.test.ts`, `sva.test.ts`, `css-raw-variants.test.ts`, sandbox cva/sva | Neo `recipe()` (`ATM-SITE-03`, `NEO-RECIPE-01`) |
| Template-literal syntax | `string-literal.test.ts`, `output.test.ts` “string literal - factory/css” | `ATM-SITE-12` already refuses |
| Studio / hooks / preset-resolved | `merge-hooks.test.ts`, `preset-resolved-hook.test.ts` | Host plugins |
| Panda `importMap` / `@pandacss/dev` | `import-map.test.ts`, `output.test.ts` import map, `import.test.ts` | Neo Reference imports only |
| `strictTokens` / `strictPropertyValues` typegen | sandbox `scenarios/strict*.ts` | types n/a for browser cases |
| `staticCss` config | `static-css.test.ts` | No Neo field |
| `matchTag` / PascalCase guessing | `output.test.ts:3057+` | Anti-goal; `NEO-JSX-05` proves the opposite |
| `css.raw` / `recipe.raw` | `css-raw*.test.ts` | Use `css.object()` / objects |
| `token()` parse-time hex inlining | `token.test.ts` | Don’t port |
| `colorPalette` / `debug` utilities | `output.test.ts:1009`, L187 | Dialect-specific |
| Slot recipes / `Tabs.Root` dotted matching | `jsx-recipe.test.ts:196`, `sva.test.ts` unresolvable slots | Unless Neo slots exist |
| Config bundling formats `.cts/.mts/.cjs` | `bundle-config.test.ts` | Neo `ui.config.ts` + esbuild already |
| DiffEngine / OutputEngine skip-write | `node/__tests__/*` | Infra, not browser |
| Extractor `.d.ts` theme packages | `declarations-files.test.ts` | Fragments eval in Node instead |
| Preact/Qwik/Solid/Vue style-context | `sandbox/codegen/__tests__/frameworks/*` | One React |

---

## Appendix — Neo vs Panda config fields

| Panda | Neo `ReferenceUIConfig` | Stance |
|---|---|---|
| `presets` / `extends` (config) | `extends?: BaseSystem[]` | **Differ** (synced systems, not presets) |
| `include` / `exclude` | `include: string[]` required | **Match include**; no exclude |
| `outdir` | publish `.reference-ui/` | **Differ** |
| `importMap` | — | **Differ** |
| `jsxFactory` / `jsxFramework` / `jsxStyleProps` | `jsxElements?: string[]` | **Differ**; explicit host list |
| `conditions` | Atomic + fragments | **Differ** |
| `theme.breakpoints` | fragment tokens / Atomic when | **Differ** queries (`@container`) |
| `strictTokens`, `hash`, `prefix`, `separator`, `cascadeLayers` | — | **Differ** (ignored if present) |
| `staticCss` | — | **Differ** |
| `name` | required `name` | **Match purpose** (layer / data-layer) |
| `syntax: template-literal` | — | **Differ** (refused) |
