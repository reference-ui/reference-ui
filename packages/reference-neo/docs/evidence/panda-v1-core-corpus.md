# Panda v1 core corpus probe (`vendor/panda-v1/packages/core`)

Corpus: `vendor/panda-v1/packages/core/__tests__/` (33 Vitest files + helpers/benches). Engine: `vendor/panda-v1/packages/core/src/`.
Lib-sheet spot-check: `packages/reference-lib/.reference-ui/styled/styles.css` (~27k lines) and `global.css` (~1.7k). Counts below are `rg -c` on those files.

Existing Neo cases **not reused**: NEO-CSS-01/02, NEO-EDGE-01/02, NEO-RECIPE-01, NEO-PRIM-01, NEO-SYNC-01, NEO-SMOKE-01, NEO-SNAP-A-01, NEO-PLAY-B-01.

---

## 1. Executive summary

The core test corpus is richest in **atomic CSS emission** (`rule-processor` 40 tests / 64 snapshots, `atomic-rule` 24, `style-encoder`/`style-decoder` 26 combined) and **staticCss cartesian expansion** (`static-css` 2520 lines). Named-test counts understate volume: `utility.test.ts` is 8 tests wrapping ~27 huge Maps (token/class caches, `colorPalette` virtual tokens). Conditions, recipes, globalCss, color-mix, and MQ sort are thinner but denser in *weird* CSS. Patterns, template-literals, sva/jsx matching, import maps, and file-matcher are Panda host plumbing — mine only when the *output CSS* is interesting.

Engine stages (`src/`): **conditions** + `parse-condition` → **utility** (class names, transforms, colorPalette) → **style-encoder** (hash entries) → **style-decoder** (hash → CSS objects) → **rule-processor** (css/cva/recipe/sva/static) → **stylesheet** + **layers** (reset/base/tokens/recipes/recipes.slots/utilities/compositions) → **sort-style-rules** / **sort-at-rules** / plugins `sort-mq` `sort-css` `merge-rules`. Side engines: **breakpoints** (`@breakpoint` → `@media`, `*Down`/`*Only` ranges), **color-mix**, **serialize** (token `{}` / `token()` in global objects), **recipes**, **patterns**, **static-css**, **keyframes**/global-fontface/global-vars/global-position-try, **selector** (`:where` wrap of parent selectors), **stringify**.

Lib sheet **uses**: `@layer reset, global, base, tokens, recipes, utilities` (5 `@layer` blocks in `styles.css`); `--colors-` (5772); `color-mix` (25); `:is(` (75); `:where(` (11); `:hover`/data-hover (28/26); `@keyframes` (31); `@font-face` (3, in `global.css`); `color-palette` virtual vars (~3.3k, token layer); `!important` (4); `prefers-reduced-motion` (1). **Absent**: `@container` (0), `@supports` (0), `recipes.slots` (0), `group-hover`/`peer-`/`dir=rtl` (0).

**Ten nastiest edges (one line each):**

1. Nested `& > p` + `_ltr`/`_dark`/`sm`/`_hover` emits a four-way dark selector *and* `:where([dir=ltr])` *and* `:is(:hover,[data-hover])` in one rule (`atomic-rule` nested selector).
2. `_hover: { _disabled: { bg: { sm } } }` concatenates two `:is()` chains inside a media query (`atomic-rule` nested > nested).
3. Mixed condition arrays (`@media` + `@supports` + `&:hover`) vs equivalent nested keys must sort identically (`conditions` + `rule-processor` mixed vs at-rule).
4. `_before` nested in `_hover` must emit `::before` **last** even when source order is reversed (`conditions` pseudo-elements sort).
5. Two multi-block conditions cartesian-product 2×2 nested `@media` selectors (`rule-processor` stacking two multi-block).
6. `width: ['50px', null, '60px']` skips `sm`, emits `md:` (`atomic-rule` array gaps).
7. Shorthand `w` last-wins even over `{ base, md }` width (`atomic-rule` / `classname`).
8. `red.300/40` → `--mix-background: color-mix(in srgb, var(--colors-red-300) 40%, transparent)` (`color-mix` / `rule-processor`).
9. Recipe variant `{ base: 'solid', lg: 'outline' }` prefixes class `lg:buttonStyle--variant_outline` including hover/disabled descendants (`recipe`).
10. `p ~ p` from `'& ~ &'` on a comma selector becomes `:is(body > p) ~ :is(body > p)` (`global-css` recursive nesting).

---

## 2. File map

Helpers/benches listed last. `tests` = `test(`/`it(` titles; `snaps` = `toMatchInlineSnapshot`.

| Path | Lines | Tests | Snaps | Family | One-line |
|---|---:|---:|---:|---|---|
| `__tests__/atomic-rule.test.ts` | 696 | 24 | 26 | CSS-CORE / COND / RESP / IMPORTANT | Atomic `css()`: important, shorthands, negatives, arrays/`null`/`base`, nested `&`, `_hover`+`_dark`+media, `@supports` sort, hideFrom/Below |
| `__tests__/rule-processor.test.ts` | 2414 | 40 | 64 | MERGE / COND / RECIPE / TOKEN / NAME | Full pipeline: css/cva/recipe/sva, hash, nulls, unitless, conflicts, mixed-condition cartesian, boolean utilities |
| `__tests__/style-decoder.test.ts` | 2743 | 11 | 17 | CSS-CORE / RECIPE | Hash → CSS object: `{colors.x}`, `base` key, recipes/cva/sva/boolean |
| `__tests__/style-encoder.test.ts` | 780 | 15 | 24 | CSS-CORE / RECIPE / STATIC | Style object → hash entries; compound variants; static recipes; JSON roundtrip |
| `__tests__/utility.test.ts` | 2896 | 8 | 27 | TOKEN / CSS-CORE | Utility cache: hideFrom/Below, values fn, arbitrary values, colorPalette maps, empty-category skip |
| `__tests__/static-css.test.ts` | 2520 | 18 | 12 | STATIC / RESP / RECIPE | Wildcard `*`, conditions×properties cartesian, recipes/slots/patterns, `@container` names, cache |
| `__tests__/conditions.test.ts` | 327 | 6 | 14 | COND | Normalize at-rule/parent/self/mixed; sort breakpoints vs `:is()`; `::before` last; theme `[data-panda-theme]` |
| `__tests__/color-mix.test.ts` | 259 | 14 | 14 | TOKEN | `red/30`, token `/`, `{colors.x/30}`, opacity tokens, invalid `/` passthrough |
| `__tests__/recipe.test.ts` | 284 | 3 | 7 | RECIPE | Named recipes, defaultVariants, responsive variant objects, dark tooltip selector soup |
| `__tests__/recipe-nesting.test.ts` | 112 | 1 | 2 | RECIPE / COND | Recipe variant `&:first-child:hover` + `{ base, md }` color |
| `__tests__/atomic-recipe.test.ts` | 82 | 1 | 1 | RECIPE | `cva()` flattens to atomic utilities (not `@layer recipes`) |
| `__tests__/slot-recipe.test.ts` | 129 | 2 | 2 | RECIPE / OUT | `checkbox__slot--size_sm` in `@layer recipes.slots` + JSX names |
| `__tests__/global-css.test.ts` | 315 | 8 | 8 | GLOBAL | Nested `&`, `_focus`+`_hover`, `!important`, `& ~ &` `:is()`, nested `@media`/`@supports` |
| `__tests__/global-fontface.test.ts` | 84 | 3 | 3 | GLOBAL / KEYF | `@font-face` single/multi src, multi-weight arrays |
| `__tests__/global-vars.test.ts` | 41 | 1 | 1 | GLOBAL / TOKEN | `:where(html)` vars + `@property` |
| `__tests__/global-position-try.test.ts` | 39 | 2 | 2 | GLOBAL / OUT | `@position-try` (CSS anchor positioning) |
| `__tests__/serialize.test.ts` | 243 | 12 | 12 | TOKEN / GLOBAL | `{a.b}` / `token()` in objects, missing tokens escaped, `@container` token in query, `divideY` |
| `__tests__/classname.test.ts` | 151 | 8 | 12 | NAME / IMPORTANT | Class grammar: cond prefixes, `!`, spaces→`_`, negatives, CSS var casing |
| `__tests__/prefix.test.ts` | 35 | 1 | 4 | NAME | `prefix` + hash: frontend class === backend selector |
| `__tests__/breakpoints.test.ts` | 162 | 3 | 5 | RESP | Sorted ranges, `mdDown` 0.0025rem epsilon, `@breakpoint` expand |
| `__tests__/sort-mq.test.ts` | 263 | 4 | 4 | MERGE / RESP | min-width then max-width; same for `@container`; nested `@layer` |
| `__tests__/sort-css.test.ts` | 141 | 2 | 2 | MERGE | Property/selector sort; `:where(:hover)` after base; animation-name last |
| `__tests__/sort-style-rules.test.ts` | 284 | 2 | 4 | MERGE / RECIPE | Atomic vs recipe rule order: conditions, `[data-attr='test']` escape |
| `__tests__/sort-at-rule.test.ts` | 38 | 1 | 0 | MERGE | Mobile-first at-rule comparator (no CSS snapshot) |
| `__tests__/composition.test.ts` | 111 | 4 | 6 | TOKEN / LAYER / KEYF | `textStyle` / `animationStyle` into `@layer utilities { @layer compositions }` |
| `__tests__/gradient.test.ts` | 86 | 4 | 4 | CSS-CORE / TOKEN | `bgGradient` token / `to-r` stops / `{colors}` in gradient / `textGradient` clip |
| `__tests__/complex-rule.test.ts` | 32 | 1 | 1 | COND / RESP | `_dark: { base, sm: { md } }` nested media inside dark |
| `__tests__/custom-utility.test.ts` | 86 | 2 | 5 | CSS-CORE / NAME | Custom utility shorthands share one className |
| `__tests__/selectors.test.ts` | 14 | 2 | 2 | COND | Multi parent selectors collapse to `:where(.dark, [data-theme="dark"])` |
| `__tests__/stringify.test.ts` | 33 | 2 | 3 | CSS-CORE | camelCase → kebab; `@scope` `&` rewrite |
| `__tests__/template-literal.test.ts` | 352 | 4 | 16 | OUT | `syntax: 'template-literal'` native CSS nesting |
| `__tests__/file-matcher.test.ts` | 227 | 12 | 46 | OUT | Import/jsx/pattern/recipe/sva matching (parser host) |
| `__tests__/import-map.test.ts` | 403 | 20 | 18 | OUT | `importMap` + `baseUrl`/`outdir` resolution |
| `__tests__/fixture.ts` | 15 | 0 | 0 | — | Shared `createRuleProcessor` / `processRecipe` |
| `__tests__/create-anatomy.ts` | 54 | 0 | 0 | OUT | Slot anatomy helper for sva tests |
| `__tests__/static-css-perf.bench.ts` | 219 | 0 | 0 | STATIC | Wildcard expansion benches |
| `__tests__/static-css-real-world.bench.ts` | 437 | 0 | 0 | STATIC | Real-world staticCss benches |

**Test-title totals (33 `*.test.ts` files): 215 `test(`/`it(` cases, 322 inline snapshots.**

---

## 3. Edge cases by family

Lib-sheet column: **yes** = feature string found in `styles.css`/`global.css`; **no** = 0 hits; **tokens-only** = present as generated token CSS, not necessarily author API.

### CSS-CORE

**1. Shorthand last-wins vs responsive object** — `atomic-rule.test.ts:39` “should resolve shorthand” — **rust** / **sheet** — lib: yes (`width` utilities)

Input:
```ts
{ width: { base: '50px', md: '60px' }, w: '70px' }
```
Expected:
```css
@layer utilities {
  .w_70px { width: 70px; }
}
```

**2. Negative spacing token** — `atomic-rule.test.ts:57` — **browser** — lib: yes (`calc(var(--spacing-*) * -1)` likely via utilities)

Input: `{ mx: -2 }`
Expected:
```css
.mx_-2 { margin-inline: calc(var(--spacing-2) * -1); }
```

**3. Unitless: z-index vs width px** — `rule-processor.test.ts:1215` “unitless” — **browser** / **rust** — lib: yes

Input: `{ '--foo': 42, width: 42, opacity: 1, zIndex: 0 }`
Expected (trimmed):
```css
.--foo_42 { --foo: 42; }
.op_1 { opacity: 1; }
.z_0 { z-index: 0; }
.w_42 { width: 42px; }
```

**4. Null / undefined / false dropped** — `rule-processor.test.ts:1205` — **sheet** — lib: n/a (absence)

Input: `{ font: undefined, color: null, background: false }` → CSS `""`.

**5. Arbitrary nested combinators + comma pseudo** — `atomic-rule.test.ts:416` “outlier” — **sheet** / **browser** — lib: yes (`:is(:hover)`)

Input (essentials):
```ts
{
  '&:focus, &:hover': { boxShadow: 'none' },
  ':focus > &': { color: 'white' },
  '@media (min-width: 768px)': { backgroundColor: 'green', '&:hover': { backgroundColor: 'yellow' } },
}
```
Expected (trimmed):
```css
.\[\&\:focus\,\ \&\:hover\]\:bx-sh_none:focus,
.\[\&\:focus\,\ \&\:hover\]\:bx-sh_none:hover { box-shadow: none; }
:focus > .\[\:focus_\>_\&\]\:c_white { color: var(--colors-white); }
@media (min-width: 768px) {
  .\[\@media_\(min-width\:_768px\)\]\:bg-c_green { background-color: green; }
  .\[\@media_\(min-width\:_768px\)\]\:\[\&\:hover\]\:bg-c_yellow:hover { background-color: yellow; }
}
```

**6. Gradient token refs** — `gradient.test.ts:55` — **browser** — lib: check via `linear-gradient` (present in keyframes/utilities)

Input: `{ bgGradient: 'linear-gradient({colors.red.200}, {colors.blue.300})' }`
Expected:
```css
.bg-grad_linear-gradient\(\{colors\.red\.200\}\,\_\{colors\.blue\.300\}\) {
  background-image: linear-gradient(var(--colors-red-200), var(--colors-blue-300));
}
```

**7. Custom utility shared className** — `custom-utility.test.ts` — **n/a** unless Neo exposes custom utilities — lib: n/a

Input: `{ cbd: 'red' }` / `{ cbxxp: 'red' }` both emit `.cbd_red { border: 1px solid red; }`.

### COND

**1. `_hover` → `:is(:hover, [data-hover])`** — `atomic-rule.test.ts:317` — **browser** — lib: **yes** (`:is(` 75, `data-hover` 26)

Input: `{ _hover: { bg: 'pink.400' } }`
Expected:
```css
.hover\:bg_pink\.400:is(:hover, [data-hover]) {
  background: var(--colors-pink-400);
}
```

**2. `_hover` × `_dark` × `sm` composition order** — `atomic-rule.test.ts:331` — **browser** / **sheet** — lib: dark theme selectors exist in recipes/global; atomic `dark:` utilities sparse

Input: `{ _hover: { bg: { sm: { _dark: 'red.300' } }, color: 'pink.400' } }`
Expected (trimmed):
```css
.hover\:c_pink\.400:is(:hover, [data-hover]) { color: var(--colors-pink-400); }
@media screen and (min-width: 40rem) {
  [data-theme=dark] .hover\:sm\:dark\:bg_red\.300:is(:hover, [data-hover]),
  .dark .hover\:sm\:dark\:bg_red\.300:is(:hover, [data-hover]),
  .hover\:sm\:dark\:bg_red\.300:is(:hover, [data-hover]).dark,
  .hover\:sm\:dark\:bg_red\.300:is(:hover, [data-hover])[data-theme=dark] {
    background: var(--colors-red-300);
  }
}
```

**3. Chained `:is()` for hover+disabled** — `atomic-rule.test.ts:351` — **browser** — lib: yes (recipes use `:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])` in Panda fixture; lib global.css uses `:is(:hover,[data-hover])`)

Input: `{ _hover: { _disabled: { bg: { sm: 'red.300' } } } }`
Expected:
```css
@media screen and (min-width: 40rem) {
  .hover\:disabled\:sm\:bg_red\.300:is(:hover, [data-hover]):is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
    background: var(--colors-red-300);
  }
}
```

**4. Parent selector `input:hover &`** — `atomic-rule.test.ts:231` — **browser** — lib: no (`group-hover` 0)

Input: `{ 'input:hover &': { bg: 'red400', fontSize: { sm: '14px', lg: '18px' } } }`
Expected (trimmed):
```css
input:hover .\[input\:hover_\&\]\:bg_red400 { background: red400; }
@media screen and (min-width: 40rem) {
  input:hover .\[input\:hover_\&\]\:sm\:fs_14px { font-size: 14px; }
}
```

**5. Deep nest `& > p` + rtl + dark + sm + hover** — `atomic-rule.test.ts:189` — **sheet** / **rust** — lib: `:where(` 11; `dir=rtl` **no**

Input:
```ts
{ '& > p': { font: { _rtl: 'sans', _ltr: { _dark: { sm: { _hover: 'serif' } } } } } }
```
Expected (the killer rule):
```css
@media screen and (min-width: 40rem) {
  [data-theme=dark] :where([dir=ltr], :dir(ltr)) .\[\&_\>_p\]\:ltr\:dark\:sm\:hover\:font_serif > p:is(:hover, [data-hover]),
  .dark :where([dir=ltr], :dir(ltr)) .\[\&_\>_p\]\:ltr\:dark\:sm\:hover\:font_serif > p:is(:hover, [data-hover]),
  :where([dir=ltr], :dir(ltr)) .\[\&_\>_p\]\:ltr\:dark\:sm\:hover\:font_serif > p.dark:is(:hover, [data-hover]),
  :where([dir=ltr], :dir(ltr)) .\[\&_\>_p\]\:ltr\:dark\:sm\:hover\:font_serif > p[data-theme=dark]:is(:hover, [data-hover]) {
    font: serif;
  }
}
```

**6. `_light` / `_dark` four-way selector** — `atomic-rule.test.ts:119` — **browser** — lib: theme classes exist in global recipes

Input: `{ color: { _light: 'red', _dark: 'green' } }`
Expected:
```css
[data-theme=light] .light\:c_red,.light .light\:c_red,.light\:c_red.light,.light\:c_red[data-theme=light] { color: red; }
[data-theme=dark] .dark\:c_green,.dark .dark\:c_green,.dark\:c_green.dark,.dark\:c_green[data-theme=dark] { color: green; }
```

**7. `::before` after mixed hover** — `conditions.test.ts:207` — **rust** / **sheet** — lib: `::before` in reset layer

Input (condition defs): `hover: ['@media (hover: hover) and (pointer: fine)', '&:is(:hover, [data-hover]):not(:active, :disabled)']`, sort `['_before', '_hover']`.
Expected raw order:
```
@media (hover: hover) and (pointer: fine)
&:is(:hover, [data-hover]):not(:active, :disabled)
&::before
```

**8. Mixed `@media`+`@supports`+`&:hover` vs nested keys** — `conditions.test.ts:44`, `rule-processor.test.ts:1928` — **sheet** / **rust** — lib: `@supports` **no**

Input:
```ts
{ width: { _mdHover: '6px', md: '4.5px', _hover: { md: '5px' } } }
// mdHover: ['@media screen and (min-width: 48em)', '@supports (display: flex)', '&:hover']
```
Expected (trimmed):
```css
@media screen and (min-width: 48em) {
  @supports (display: flex) {
    .mdHover\:w_6px:hover { width: 6px; }
  }
}
@media screen and (min-width: 48rem) {
  .md\:w_4\.5px { width: 4.5px; }
  .hover\:md\:w_5px:is(:hover, [data-hover]) { width: 5px; }
}
```

**9. Attribute selector quotes + `_expanded` + `.target &`** — `rule-processor.test.ts:259` “css” — **sheet** / **browser** — lib: `[data-state=` yes in recipes/global

Input (essentials):
```ts
{ "&[data-attr='test']": { _expanded: { '.target &': { color: { base: 'cyan', _open: 'orange', xl: 'pink' } } } } }
```
Expected (trimmed):
```css
.target .\[\&\[data-attr\=\'test\'\]\]\:expanded\:\[\.target_\&\]\:c_cyan[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) { color: cyan; }
.target .\[\&\[data-attr\=\'test\'\]\]\:expanded\:\[\.target_\&\]\:open\:c_orange[data-attr='test']:is([aria-expanded=true], [data-expanded], [data-state="expanded"]):is([open], [data-open], [data-state="open"], :popover-open) { color: orange; }
```

**10. Multi-block condition cartesian product** — `rule-processor.test.ts:2358` — **sheet** / **rust** — lib: no (no `@media (hover: hover)` stacking like this)

Input:
```ts
{ _hoverActive: { _lightDark: { background: 'red' } } }
// hoverActive: { '@media (hover: hover)': { '&:is(:hover,[data-hover])': '@slot' }, '@media (hover: none)': { '&:is(:active,[data-active])': '@slot' } }
// lightDark: prefers-color-scheme light/dark × [data-mode]
```
Expected: four nested `@media` blocks (hover×scheme) with matching `:is()` / `[data-mode]`.

**11. Parent selectors → `:where`** — `selectors.test.ts:5` — **rust** — lib: `:where(` **yes** (11)

Input: `'&&.dark, .dark &, &[data-theme=dark], [data-theme="dark"] &'`
Expected: `:where(.dark, [data-theme="dark"])`

**12. Nested dark + sm + md media** — `complex-rule.test.ts:9` — **browser** — lib: `@media` 1 in styles.css (almost unused in atomic sheet; breakpoints live in recipes?)

Input: `{ color: { _dark: { base: 'green500', sm: { md: 'red200' } } } }`
Expected nested:
```css
@media screen and (min-width: 40rem) {
  @media screen and (min-width: 48rem) {
    [data-theme=dark] .dark\:sm\:md\:c_red200, ... { color: red200; }
  }
}
```

### RESP

**1. Responsive array** — `atomic-rule.test.ts:67` — **browser** — lib: `@media` rare in utilities; still Neo-relevant

Input: `{ width: ['50px', '60px'] }`
Expected: `.w_50px` + `@media screen and (min-width: 40rem) { .sm\:w_60px { width: 60px } }`

**2. Array `null` hole** — `atomic-rule.test.ts:83` — **browser** / **rust**

Input: `{ width: ['50px', null, '60px'] }`
Expected: base + **md** (48rem), no sm rule.

**3. `base` key vs `_` skip** — `atomic-rule.test.ts:167`, `style-decoder.test.ts:69` — **browser**

Input: `{ left: { base: '20px', md: '40px' } }` / `{ base: { color: 'blue' }, md: { color: 'red' } }`
Expected: unprefixed class + `@media (min-width: 48rem)`.

**4. Array with `undefined`/`null` skips + `xl`** — `rule-processor.test.ts:265` `w: [1, 2, undefined, null, 3]` — **rust**

Classnames include `w_1`, `sm:w_2`, `xl:w_3` (no md/lg).

**5. Inner vs outer responsive + RTL** — `atomic-rule.test.ts:99` / `142` — **browser** — lib: `dir=rtl` **no**

Input: `{ ml: { _ltr: { sm: '4' }, _rtl: '-4' } }`
Expected: `:where([dir=rtl], :dir(rtl)) .rtl\:ml_-4 { margin-left: calc(var(--spacing-4) * -1); }` and ltr+sm media.

**6. Breakpoint `mdDown` epsilon** — `breakpoints.test.ts:143` — **rust** / **browser** — lib: `prefers-reduced-motion` only extra MQ

Input: `@breakpoint mdDown { .foo { color: red } }`
Expected: `@media screen and (max-width: 47.9975rem)` (not 48rem).

**7. hideFrom / hideBelow** — `atomic-rule.test.ts:671` — **browser** — n/a if Reference has no helpers (Panda utilities)

Input: `{ hideFrom: 'sm' }` → `@media screen and (min-width: 40rem) { .hide_sm { display: none } }`
`{ hideBelow: 'lg' }` → `@media screen and (max-width: 63.9975rem) { .show_lg { display: none } }`

**8. Named `@container`** — `static-css.test.ts:2162` — **browser** — lib: `@container` **no** (Reference `container: true` macro is authoring — **must prove**)

Input: `conditions: ['@pb/sm', '@pb/md']` with `containerNames: ['pb']`
Expected:
```css
@container pb (min-width: 24rem) { .\@pb\/sm\:fs_7xl { font-size: var(--font-sizes-7xl); } }
@container pb (min-width: 28rem) { .\@pb\/md\:fs_7xl { ... } }
```

**9. Token in `@container` query** — `serialize.test.ts:47` — **rust**

Input: `'@container (min-width: {sizes.4xl})'` → `'@container (min-width: 56rem)'`

**10. MQ sort min then max** — `sort-mq.test.ts:11` / `atomic-rule.test.ts:533` — **sheet** / **rust** — lib: n/a until many MQs exist

`@supports` blocks emit **before** `@media`; min-width ascending then max-width descending.

### TOKEN

**1. Curly token in shorthand** — `style-decoder.test.ts:43` — **browser** — lib: `--colors-` **yes**

Input: `{ border: '2px solid {colors.red.300}' }`
Expected class `.bd_2px_solid_\{colors\.red\.300\}` → `border: 2px solid var(--colors-red-300)`

**2. Missing token escaped, not dropped** — `serialize.test.ts:29` — **sheet** / **rust**

Input: `{ border: '2px solid {colors.red.xxx}', bg: '{colors.xxx}' }`
Expected: `"border": "2px solid colors\\.red\\.xxx"`, `"background": "colors\\.xxx"`

**3. `token()` + nested fallbacks** — `serialize.test.ts:205` — **n/a** if Reference does not expose `token()` JS; **rust** if compiler still parses the string in CSS values

Input: `token(colors.red.300, token(colors.blue.300, colors.green.300))`
Expected: `var(--colors-red-300, var(--colors-blue-300, var(--colors-green-300)))`

**4. color-mix native / token / curly** — `color-mix.test.ts:41,73,152` — **browser** — lib: `color-mix` **yes (25)**

```ts
{ bg: 'red/30' }
{ bg: 'red.300/30' }
{ color: '{colors.pink.400/30}' }
```
Expected:
```css
.bg_red\/30 {
  --mix-background: color-mix(in srgb, red 30%, transparent);
  background: var(--mix-background, red);
}
.bg_red\.300\/30 {
  --mix-background: color-mix(in srgb, var(--colors-red-300) 30%, transparent);
  background: var(--mix-background, var(--colors-red-300));
}
.c_\{colors\.pink\.400\/30\} {
  color: color-mix(in srgb, var(--colors-pink-400) 30%, transparent);
}
```

**5. Opacity token `red/half`** — `color-mix.test.ts:229` — **browser**

`color-mix(in srgb, red 50%, transparent)` from `opacity.half: 0.5`.

**6. Invalid mix passthrough** — `color-mix.test.ts:169–214` — **sheet**

`bg: 'red/abc'` → `background: red/abc` (no color-mix). Decimal `red/0.33` **does** mix but uses `0.33%` (Panda quirk).

**7. CSS var casing preserved** — `rule-processor.test.ts:1244` — **browser** — lib: mixed `--` names

`--testVariable0` / `--test-Variable-1` stay as authored in both class escape and declaration.

**8. colorPalette virtual tokens** — `utility.test.ts` classNames map; `static-css.test.ts:179` — **browser** if Reference authors `colorPalette` — lib: **tokens-only** (`--colors-color-palette-*` generated; no `colorPalette` prop in lib src)

`.c_colorPalette\.200 { color: var(--colors-color-palette-200); }` plus light/dark variants when staticCss `color: ['*']`.

**9. Custom formatTokenName / formatCssVar** — `atomic-rule.test.ts:641` — **n/a** (Panda hook)

`$blue-400` → `var(--colors---blue---400)`.

### IMPORTANT

**1. `!important` vs `!` suffix** — `atomic-rule.test.ts:10` — **browser** — lib: `!important` **yes (4)** in `styles.css`

Input: `{ color: 'red !important', fontSize: '30px!' }`
Expected:
```css
.c_red\! { color: red !important; }
.fs_30px\! { font-size: 30px !important; }
```
Classnames (`classname.test.ts:65`): `"c_red! fs_30px!"`

**2. Case-insensitive `!IMPORTANT` + token** — `rule-processor.test.ts:1268` — **browser**

`background: 'white!IMPORTANT  '` → `.bg_white\! { background: var(--colors-white) !important; }`

**3. Important inside globalCss nesting** — `global-css.test.ts:115` — **browser**

`userSelect: 'none !important'` → `-webkit-user-select: none !important; user-select: none !important;`
Shorthand `border` then `borderColor !important` — longhand after shorthand in same rule.

### MERGE

**1. Border shorthand vs longhand order** — `rule-processor.test.ts:1318` — **browser** / **rust** — lib: yes (utilities)

Input: `{ borderWidth: '1px', borderTopRadius: '0px', borderBottomWidth: '3px', overflow: 'hidden', base: { borderWidth: '2px' } }`
Expected class order: `bd-w_1px`, `ov_hidden`, `bd-w_2px`, `bdr-t_0px` (two radius longhands), `bd-b-w_3px`. Later `bd-w_2px` wins width; `bd-b-w_3px` still last for bottom.

**2. More-specific last (red then blue)** — `rule-processor.test.ts` “more specific should always be last” — **browser**

**3. `:where(:hover)` after unconditioned** — `sort-css.test.ts:11` — **sheet** — lib: `:where(` **yes**

**4. Recipe condition order** — `sort-style-rules.test.ts` recipe snapshot — **sheet**

`.btn:is(:hover):is(:disabled)` after `.btn:is(:focus)`; variant `.btn--size_sm:is(:hover)` later.

### LAYER

**1. Layer stack** — `src/layers.ts` + every atomic snapshot — **sheet** — lib: **yes** `@layer reset, global, base, tokens, recipes, utilities` (Reference adds **global** vs Panda default)

Panda emission: `@layer utilities`, `@layer recipes { @layer _base {…} }`, `@layer recipes.slots`, `@layer utilities { @layer compositions }`.

**2. textStyle compositions layer** — `composition.test.ts:56` — **n/a** if no `textStyles` — lib: compositions not named in layer list

```css
@layer utilities {
  @layer compositions {
    .textStyle_headline\.h2 {
      font-size: 1.5rem;
      font-weight: var(--font-weights-bold);
    }
    @media screen and (min-width: 64rem) {
      .textStyle_headline\.h2 { font-size: 2rem; }
    }
  }
}
```

**3. animationStyle** — `composition.test.ts:99` — **KEYF** / **n/a** unless exposed

`.animationStyle_scale-fade-in { transform-origin: var(--transform-origin); animation-name: scale-in, fade-in; }`

### RECIPE

**1. Default variants always emitted** — `recipe.test.ts:187` / `rule-processor.test.ts:419` — **browser** — lib: `@layer recipes` **yes (25)**

`processRecipe('buttonStyle', { variant: 'solid' })` still emits `--size_md` from `defaultVariants`.

**2. Responsive variant object** — `recipe.test.ts:226` — **browser** — **do not duplicate NEO-RECIPE-01** (that covers compound); this is **responsive variant axis**

Input: `{ variant: { base: 'solid', lg: 'outline' } }`
Expected: `.buttonStyle--variant_solid` + `@media (min-width: 64rem) { .lg\:buttonStyle--variant_outline {…} .lg\:buttonStyle--variant_outline:is(:hover, [data-hover]) {…} }`

**3. Complex dark selectors on recipe base** — `recipe.test.ts:74` tooltipStyle — **sheet**

Four-way dark × `[data-tooltip]` **and** descendant `[data-tooltip]`.

**4. cva is atomic, not recipes layer** — `atomic-recipe.test.ts:10` — **browser** — aligns with Reference `recipe()`/`cva()` object

`_hover` on a variant becomes `.hover\:c_green:is(:hover, [data-hover])` under `@layer utilities`.

**5. Boolean cva variants `'true'/'false'`** — `rule-processor.test.ts:1162` — **browser**

```ts
variants: { checked: { true: { display: 'block' }, false: { display: 'none' } } }
```
Emits **both** `.d_block` and `.d_none` (static expansion of the recipe definition, not a single selection).

**6. Boolean *utility* truncate** — `rule-processor.test.ts:1134` — **sheet**

`truncate: false` → class `trunc_false` and **empty CSS**; `true` → overflow/ellipsis/nowrap.

**7. Recipe nested `&:first-child:hover` + responsive color** — `recipe-nesting.test.ts:55` — **browser**

```css
.text--variant_sm:first-child:hover { color: var(--colors-red-200); }
@media screen and (min-width: 48rem) {
  .text--variant_sm:first-child:hover { color: var(--colors-gray-300); }
}
```
(same class, two declarations — **not** an extra `md:` prefix on the recipe stem)

**8. Compound variants in staticCss** — `static-css.test.ts:2100` — **browser** / **sheet**

`withCompound: ['*']` emits recipe size + **atomic** `.hover\:fs_4px` and `.hover\:dark\:fs_5px` for compound CSS.

**9. Slot recipe class grammar** — `slot-recipe.test.ts:6` — **n/a** unless lib needs slots — lib: `recipes.slots` **0**, no `sva(` in `reference-lib/src`

```css
@layer recipes.slots {
  @layer _base { .checkbox__root {…} .checkbox__control {…} }
  .checkbox__control--size_sm { width: var(--sizes-8); }
}
```

**10. sva encoder** — `style-encoder.test.ts` “sva” / “sva + compound variants” — **OUT** as API; CSS same family as slots.

### STATIC

**1. Conditions × properties cartesian** — `static-css.test.ts:42` — **sheet** (generation) / **n/a** if Neo has no staticCss — Reference **does** pregenerate utilities (the lib sheet *is* a static dump)

`margin: ['20px','40px']` × `['sm','md']` → base + sm + md classes each.

**2. `color: ['*']` + light/dark** — same test — expands all color tokens **including `colorPalette.200`**.

**3. `recipes: { buttonStyle: ['*'] }`** — `static-css.test.ts:343` — all variant combos + defaults.

**4. Arbitrary condition strings** — `static-css.test.ts:2312` — **sheet**

`conditions: ['@media (min-width: 24rem)', '.mobile &']` → parent `.mobile .\[\.mobile_\&\]\:fs_7xl` + escaped media class.

**5. Cache hit/miss / wildcard memo** — tests at end of file — **n/a** (engine perf, not CSS).

### GLOBAL

**1. `_focus` + nested `_hover` + responsive `sm` key** — `global-css.test.ts:13` — **browser** — lib: **yes** (global.css button `:where` + `:is(:hover)`)

Expected: `.btn:is(:focus, [data-focus]):is(:hover, [data-hover])` and `sm` → `@media (min-width: 40rem) { .btn { font-size: 12px } }`.

**2. Recursive `& ~ &` + comma** — `global-css.test.ts:243` — **browser** / **sheet**

Input: `{ 'body > p, body > ul': { '& ~ &': { marginTop: 10 } } }`
Expected: `:is(body > p) ~ :is(body > p),body > ul ~ body > ul { margin-top: var(--spacing-10); }`
(numeric `10` became **spacing token** — Panda treats bare numbers as tokens in globalCss.)

**3. Nested `@media` + `@supports`** — `global-css.test.ts:285` — **browser** — lib: `@supports` **no**

**4. `@font-face` multi-src / multi-weight** — `global-fontface.test.ts` — **sheet** — lib: `@font-face` **yes (3)** in `global.css`

**5. `@property` + `:where(html)`** — `global-vars.test.ts:15` — **sheet** — lib: `:where(` yes

**6. divideX in global hover** — `global-css.test.ts:91` — **PATTERN-ish** / **n/a** if no divide utilities

`.btn:hover > :not([hidden]) ~ :not([hidden]) { border-inline-start-width: 40px; }`

### KEYF

Covered by `composition` animationStyle and lib `@keyframes` (31). No dedicated core `keyframes.test.ts` — generation lives in `packages/generator`. Core still emits `animation-name` lists.

### NAME

**1. Spaces in selectors → underscores** — `classname.test.ts:75` — **sheet**

`{ '& span': { fontSize: '20px' }, '@media print': { fontSize: '40px' } }` → `"[&_span]:fs_20px [@media_print]:fs_40px"`

**2. Prefix + hash consistency** — `prefix.test.ts:14` — **n/a** unless Neo hashes — frontend `"tw-wxtrg"` === backend `.tw-wxtrg`

**3. Hash custom `toHash`** — `rule-processor.test.ts:206` — **n/a**

**4. Hex color class escape** — boolean cva `#fff` → `.c_\#fff`

### PATTERN

Panda `divideY` serialize (`serialize.test.ts:223`) and static-css “simple pattern” / “all recipes”. **OUT** as authoring pack. Output CSS (`& > :not([hidden]) ~ :not([hidden])`) only if Reference keeps sibling-gap utilities.

---

## 4. Proposed Neo cases

World = small `css()` / `recipe()` / `tokens()` / `globalCss()` / `font()` / `keyframes()` tree. Assertion = Playwright computed style and/or stylesheet text. Skip IDs already shipped.

| ID | README first line | World | Assertion | Panda evidence |
|---|---|---|---|---|
| NEO-CSS-03 | shorthand last-wins over a responsive object | `css({ width: { base, md }, w })` on a box | computed `width` is the shorthand px at all viewports; sheet has one `.w_*` | `atomic-rule` should resolve shorthand |
| NEO-CSS-04 | negative token spacing is `calc(var × -1)` | `mx: -2` or `-{spacing.4}` | computed margin-inline matches negated token | `atomic-rule` negative tokens |
| NEO-CSS-05 | unitless numbers: opacity vs px width | `{ opacity: 1, width: 42, zIndex: 0 }` | opacity 1, width 42px, z-index 0 | `rule-processor` unitless |
| NEO-CSS-06 | null holes omit declarations | `{ color: null, background: false }` | no color/background rules in sheet | `rule-processor` ignores null |
| NEO-CSS-07 | gradient string interpolates token refs | `backgroundImage: 'linear-gradient({colors.a}, {colors.b})'` | computed image uses resolved colors | `gradient` token references |
| NEO-COND-01 | `_hover` paints via `:hover` and `[data-hover]` | one box with `_hover: { color }` | hover + `data-hover` both apply the color | `atomic-rule` simple grouped condition; **extends NEO-EDGE-01** toward `:is()` dual selector |
| NEO-COND-02 | `_hover` then `_dark` then `sm` wraps media outside dark | `_hover: { bg: { sm: { _dark } } }` | at sm + dark + hover, bg is the dark token | `atomic-rule` nested > property |
| NEO-COND-03 | chained `:is()` hover+disabled | `_hover: { _disabled: { color } }` | only when both states; sheet concatenates `:is()` | `atomic-rule` nested > nested |
| NEO-COND-04 | `_light`/`_dark` four-way selectors | `color: { _light, _dark }` | toggling `.dark` / `[data-theme]` both flip color | `atomic-rule` respect color mode |
| NEO-COND-05 | parent combinator `input:hover &` | input + sibling styled via `'input:hover &'` | hovering input paints sibling | `atomic-rule` parent selector |
| NEO-COND-06 | descendant `& > p` keeps child combinator on the class | `{ '& > p': { color } }` | only direct `p` children paint | `atomic-rule` [pseudo] nested |
| NEO-COND-07 | attribute quotes + `_expanded` + `_open` | `"&[data-attr='test']"` nest | expanded/open data attrs match Panda `:is([aria-expanded],…)` | `rule-processor` css |
| NEO-COND-08 | `::placeholder` / `::before` after hover | `_hover: { _before: { content, color } }` | `::before` is last in the selector | `conditions` pseudo-elements sort |
| NEO-COND-09 | mixed `@supports` + `@media` + hover | named condition array | sheet nests at-rules then `:hover`; computed only when all match | `rule-processor` mixed vs at-rule |
| NEO-COND-10 | RTL `:where([dir=rtl], :dir(rtl))` | `_rtl` / `_ltr` margin | `dir=rtl` on html flips margin | `atomic-rule` inner responsive |
| NEO-COND-11 | comma `&:focus, &:hover` splits to two selectors | one class, two matchers | focus **or** hover applies box-shadow none | `atomic-rule` outlier |
| NEO-COND-12 | `:focus > &` parent-of-self | child styled when parent focused | computed color on the child | `atomic-rule` outlier |
| NEO-RESP-01 | responsive array maps index to breakpoints | `width: ['50px','60px']` | resize across 40rem changes width | `atomic-rule` responsive array |
| NEO-RESP-02 | `null` in a responsive array skips a breakpoint | `['50px', null, '60px']` | sm does **not** change width; md does | `atomic-rule` array with gaps |
| NEO-RESP-03 | `base` key is the unprefixed class | `{ base, md }` | default + md media | `atomic-rule` skip `_` notation; `style-decoder` css with base |
| NEO-RESP-04 | nested `sm: { md: }` emits nested `@media` | `_dark: { sm: { md } }` | both min-widths required | `complex-rule` |
| NEO-RESP-05 | `mdDown` uses 0.0025rem epsilon | hideBelow/mdDown style | max-width 47.9975rem not 48rem | `breakpoints` breakpoint down |
| NEO-RESP-06 | mobile-first then max-width descending | several min/max `@media` keys | stylesheet order | `atomic-rule` should sort mobile first; `sort-mq` |
| NEO-RESP-07 | named `@container` conditions | `container: true` + `@pb/sm` fontSize | computed font-size inside named container | `static-css` container query; **lib currently 0 `@container` — this is a gap to prove** |
| NEO-RESP-08 | `{sizes.x}` inside `@container` query | global or css at-rule with token | query min-width is resolved rem | `serialize` in media query |
| NEO-TOKEN-01 | `{colors.x}` in a multi-value shorthand | `border: '2px solid {colors.red.300}'` | computed border-color is the token | `style-decoder` should resolve references |
| NEO-TOKEN-02 | missing token is escaped, not empty | `{colors.missing}` | declaration contains escaped path, not `var(--undefined)` | `serialize` skip non-existent |
| NEO-TOKEN-03 | `color-mix` from `red.500/40` | `bg: 'red.300/40'` | computed background uses color-mix / fallback | `color-mix` config token; `rule-processor` color mix; **lib already has 25 color-mix** |
| NEO-TOKEN-04 | curly mix `{colors.pink.400/30}` | color property | color-mix without `--mix-*` wrapper | `color-mix` curly brackets |
| NEO-TOKEN-05 | opacity token in `/name` modifier | `red/half` with opacity tokens | 50% mix | `color-mix` opacity token |
| NEO-TOKEN-06 | invalid `/abc` does not invent color-mix | `bg: 'red/abc'` | background is the literal string | `color-mix` wrong opacity |
| NEO-TOKEN-07 | authored CSS variable casing survives | `--testVariable0` vs `--test-Variable-1` | both set on the element | `rule-processor` preserves casing |
| NEO-TOKEN-08 | `colorPalette` virtual `--colors-color-palette-*` | `colorPalette: 'red'` + `bg: 'colorPalette.500'` | background follows palette | `utility` colorPalette maps; **lib tokens-only today** |
| NEO-TOKEN-09 | multiple `{spacing}` in one padding value | `padding: '{spacing.3} {spacing.5}'` | two vars in one declaration | `serialize` expand multiple references |
| NEO-IMP-01 | `!important` and `!` suffix | `color: 'red !important', fontSize: '30px!'` | both declarations important | `atomic-rule` respect important syntax |
| NEO-IMP-02 | `!IMPORTANT` after a token name | `background: 'white!IMPORTANT'` | token + important | `rule-processor` parses !important |
| NEO-IMP-03 | important + `_hover` | hover color important | wins vs non-important sibling | combine `atomic-rule` important + conditions |
| NEO-MERGE-01 | later border-width utility wins, longhand last | borderWidth then borderBottomWidth | computed bottom width 3px | `rule-processor` border example |
| NEO-MERGE-02 | same property red then blue: blue last in sheet | two color utilities on one node | computed color blue | `rule-processor` more specific last |
| NEO-MERGE-03 | `@supports` blocks before `@media` | mixed at-rules | sheet order | `atomic-rule` should sort mobile first |
| NEO-LAYER-01 | utilities sit in `@layer utilities` after recipes | css() + recipe() in one world | cascade: recipe base then utility override | `layers.ts`; lib order `reset, global, base, tokens, recipes, utilities` |
| NEO-LAYER-02 | recipe `_base` inner layer | recipe base vs variant | variant wins same specificity via layer | `recipe.test.ts` @layer _base |
| NEO-RECIPE-02 | defaultVariants emit even when omitted | recipe({ size omitted }) | default size height paints | `recipe` should process recipe with conditions |
| NEO-RECIPE-03 | responsive variant `{ base, lg }` prefixes `lg:` | `variant: { base: 'solid', lg: 'outline' }` | lg viewport switches outline + hover | `recipe` buttonStyle responsive variant |
| NEO-RECIPE-04 | boolean true/false variants | `checked: { true, false }` | selecting true vs false display | `rule-processor` cva boolean variant |
| NEO-RECIPE-05 | recipe nested `&:first-child:hover` responsive color | variant sm first-child | first child hover color changes at md **without** `md:` class prefix | `recipe-nesting` |
| NEO-RECIPE-06 | cva/recipe hover lives on the variant class | `recipe()` with `_hover` in variant | hover does not require a separate atomic hover class | `recipe` solid hover darkblue; contrast `atomic-recipe` which *does* flatten |
| NEO-RECIPE-07 | compound variant still atomic when defined as css block | recipe compound `_hover`+`_dark` | both predicates required | `static-css` recipe + compoundVariants; **NEO-RECIPE-01 already covers a compound — keep this as dark+hover compound** |
| NEO-STATIC-01 | static expansion of conditions×values | tokens + css() unused props still in sheet | sheet contains sm/md copies | `static-css` works |
| NEO-STATIC-02 | wildcard colors include palette token | static color `*` | `.c_colorPalette.200` present | `static-css` works css results |
| NEO-GLOBAL-01 | global `_focus` nested `_hover` | `globalCss({ '.btn': { _focus: { _hover } } })` | focus+hover computed on `.btn` | `global-css` direct nesting |
| NEO-GLOBAL-02 | `'& ~ &'` on a comma selector uses `:is()` | `body > p` siblings | sibling margin-top | `global-css` complex recursive nesting |
| NEO-GLOBAL-03 | nested `@media` then `@supports` in globalCss | body color only when both match | computed + sheet nest | `global-css` nested at-rule |
| NEO-GLOBAL-04 | `@font-face` src lists | `font({ Inter: { src: [...] } })` | stylesheet `@font-face` src comma list | `global-fontface` multiple src; lib already 3 faces |
| NEO-GLOBAL-05 | `:root` / `html` token color in `@media` | `globalCss({ '@media…': { ':root': { color: 'red.200' } } })` | root color inside media | `global-css` with at-rule |
| NEO-GLOBAL-06 | important inside `&.class` global nest | `html.dragging-ew` userSelect | computed user-select none important | `global-css` classic style object |
| NEO-NAME-01 | nested selector class omits spaces | `{ '& span': { fontSize } }` | class contains `[&_span]` not `[& span]` | `classname` omit spaces |
| NEO-NAME-02 | important bang is part of the class stem | `color: 'red !important'` | class `c_red!` / escaped `c_red\!` | `classname` should respect important |
| NEO-NAME-03 | print media encoded in the class | `'@media print': { fontSize }` | `@media print` rule + `[@media_print]` class | `classname` omit spaces |
| NEO-KEYF-01 | animation-name list from keyframes fragment | `keyframes` + `animationName: 'a, b'` | computed animation-name two idents | `composition` animation styles |
| NEO-CSS-08 | `@scope` `&` rewrite if exposed | stringify-only unless authors can nest `@scope` | sheet `@scope (.parent > .scope)` | `stringify` convert @scope — **only if Neo emits @scope** |

**Count: 61 proposed cases** (plus existing 10). Prioritize COND/RESP/TOKEN/IMPORTANT/RECIPE-02..05/GLOBAL/container; demote STATIC cache, NAME hashing, LAYER internals, colorPalette if authors never set it.

---

## 5. Out of scope (not parity)

| Feature | Why Reference will not chase it | Corpus files |
|---|---|---|
| **sva / slot recipes** | No `sva(` in `reference-lib/src`; lib sheet has **0** `recipes.slots`. Flag: do **not** add slots unless a multi-part primitive needs per-slot class stems (`checkbox__label--size_sm`). | `slot-recipe.test.ts`, `style-encoder` sva, `style-decoder` sva, `rule-processor` slot recipe/sva, `static-css` slot recipe, `file-matcher` sva aliases, `create-anatomy.ts` |
| **`styled()` / jsx factory** | Authoring is `css()` + primitives StyleProps, not `styled.div` | `file-matcher` is jsx factory / match tag; `import-map` |
| **Template-literal `css\`…\``** | Not in the authoring surface | `template-literal.test.ts` |
| **Panda patterns pack** (`stack`, `circle`, `divider`, `float`, …) | Not used; `divideY`/`divideX` only interesting as **output** sibling selectors | `static-css` simple pattern; `serialize` divide utility; `file-matcher` is valid pattern; `src/patterns.ts` |
| **`textStyles` / `layerStyles` as first-class** | Verify: no `textStyles`/`layerStyles` keys in lib src. `textStyle` *utility* in Panda compositions is a different API. Do not require `@layer compositions` unless Neo grows text styles. | `composition.test.ts`; recipe `textStyle` in fixture (that's a **recipe named textStyle**, not theme textStyles) |
| **`token()` JS helper** | Authors use `{colors.x}` and `tokens()`. String `token()` in CSS values is compiler sugar — optional rust case, not a Neo world API. | `serialize.test.ts` token() describe; `rule-processor` token() with formatTokenName |
| **`cx()`** | Not in surface | (not in core tests; parser/shared) |
| **Import maps / FileMatcher / outdir+baseUrl** | Host/packager, not CSS | `import-map.test.ts`, `file-matcher.test.ts` |
| **staticCss cache / benches** | Perf of Panda's expander | `static-css` cache tests; `*.bench.ts` |
| **prefix + hash / custom toHash / formatTokenName hooks** | Panda config hooks; Neo class grammar should be its own, proven by NAME cases without copying `tw-wxtrg` | `prefix.test.ts`, `rule-processor` hash tests, `atomic-rule` formatCssVar |
| **`@position-try` / CSS anchor globalPositionTry** | Not in Reference authoring | `global-position-try.test.ts` |
| **Panda themes → `_themePrimary`** | `[data-panda-theme=…]` | `conditions` theme conditions |
| **Boolean `truncate` utility empty CSS for `false`** | Panda-specific boolean utilities | `rule-processor` css boolean utility |
| **hideFrom / hideBelow** | Panda helper utilities; only if Reference ships them | `atomic-rule` responsive helpers; `utility` hideFrom |
| **Encoder `fromJSON` wire format** | Panda's `color]___[value:red` hashes — Neo uses frozen `EvaluatedSystemSpec`, not this | `rule-processor` fromJSON; `style-encoder` fromJSON |
| **@scope stringify** | Unless authors can write `@scope` in style objects | `stringify.test.ts` |

**sva verdict for the plan:** lib sheet does **not** need slot recipes today. If a future primitive is a multi-part anatomy with independent variant CSS per part, revisit `NEO-SLOT-*` then — not before.

---

## Engine stage cheat-sheet (`src/`)

`conditions.ts`, `parse-condition.ts` → `utility.ts`, `color-mix.ts` → `style-encoder.ts` → `style-decoder.ts` → `rule-processor.ts` → `stylesheet.ts`, `layers.ts` → `sort-style-rules.ts`, `sort-at-rules.ts`, `plugins/sort-mq.ts`, `plugins/sort-css.ts`, `plugins/merge-rules.ts`. Also: `breakpoints.ts`, `recipes.ts`, `patterns.ts`, `static-css.ts`, `serialize.ts`, `stringify.ts`, `selector.ts`, `global-fontface.ts`, `global-vars.ts`, `global-position-try.ts`, `file-matcher.ts`, `import-map.ts`, `jsx.ts`, `unitless.ts`, `context.ts`.
