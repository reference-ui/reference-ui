# Probe: `packages/reference-lib/.reference-ui/styled/styles.css`

Ground truth for Panda CSS v1 output consumed by `@reference-ui/lib`. File is **27,472 lines**. Counts from `rg` / targeted reads, not a linear pass. Paths relative to that file.

---

## 1. Executive summary

1. Cascade is declared as `@layer reset, global, base, tokens, recipes, utilities` but **only four layers have bodies**: `reset`, `global`, `tokens`, `utilities`. **`base` and `recipes` are empty** (order reserved, never opened).
2. **~90% of the sheet is `@layer utilities`** (~6,162 rules / ~6,139 unique first selectors). Eleven colour properties alone emit **~5,099 atoms** (`bg_`, `c_`, `bd-c_`, `bg-c_`, `ring-c_`, `fill_`, `stroke_`, plus four side-border colours), including **153 `colorPalette.*` classes per property** (Panda virtual colour). That is `staticCss` / token-wildcard expansion, not authored usage.
3. Component look-and-feel is **not Panda recipes** (no `.button--variant_solid`). It is **`@layer global` HTML-tag recipes**: **90 unique `.ref-*` stems** (`.ref-button`, `.ref-input`, …) with variants as **`[data-variant]`**, slots as **`[data-slot]`**, and machine state as **`:is(:hover, [data-hover])`** dual selectors.
4. Tokens live on `:where(:root, :host)` (**373 custom properties**) plus **`[data-panda-theme=light|dark]`** islands (**98 semantic colour vars each**). No `[data-theme]`, `.dark`, `data-color-mode`, or `prefers-color-scheme`. Rhythm is `--spacing-root: 0.25rem` with an `Nr` / fractional `1/2r` scale (19 spacing vars). Fonts: Inter / Literata / JetBrains Mono via **3 `@font-face`**.
5. **Responsive CSS is almost absent**: a **single `@media`** (`prefers-reduced-motion: reduce` in reset). **Zero `@container` queries**, **zero `@supports`**, **zero `print` / `forced-colors` / breakpoint `sm:` classes**, despite `container-type: inline-size` on `html`/`body`.
6. Condition grammar on utilities is Panda’s: `.hover\:bg_gray\.800:is(:hover, [data-hover])`, `.focusVisible\:…:is(:focus-visible, [data-focus-visible])`, plus escaped descendant/child arbitrary selectors `.\[\&_\[data-slot\=\"description\"\]\]\:op_0\.75`.
7. **`color-mix(in oklch, …)`** is the opacity language (25 uses), not Tailwind `red.500/50`. Escaped `/` in classes is **fractional rhythm** (`p_1\/2r` → `var(--spacing-1\/2r)`), not colour opacity.
8. Group/peer (`group-hover`, `:where(.peer) ~ &`) **do not appear**. Sibling `+` combinators do not appear as selectors. Child `>` and `:has()` **do**, mainly around `[data-reference-field]` and `.ref-button`.
9. **`!important` is only the preflight reduced-motion kill-switch** (4 declarations). No utility `!important`.
10. The sheet also encodes **Panda bugs / passthroughs** Neo should not blindly clone: `background: ui.panel.background`, `.size_md { width: md; height: md; }`, `.focus_true { focus: true; }`, `{colors.ui.focus.ring}` left inside a class name + `var()` fallback.

---

## 2. `@layer` order and contents

**Layer statement (verbatim, line 70):**

```css
@layer reset, global, base, tokens, recipes, utilities;
```

Opened bodies:

| Line | Opening | Notes |
|------|---------|--------|
| 1 | `@layer reset {` | Preflight |
| 72 | `@layer global{` | (no space before `{`) `.ref-*` + field compounds + transform CSS vars + `@font-face` |
| 1817 | `@layer tokens{` | Custom properties, theme islands, `@keyframes` |
| 2761 | `@layer utilities{` | Atomic classes through EOF (27472) |

| Layer | What lives there | Approx. rule count (`{` in span) |
|-------|------------------|----------------------------------|
| `reset` | Andy Bell–style preflight; `box-sizing`; list role reset; `html:focus-within`; img/input inherit; **reduced-motion `!important`** | ~12 |
| `global` | `:root` `--made-with-panda` / `--spacing-root`; body container; **90 `.ref-*` element recipes**; `[data-reference-field]` compounds; checkbox/range/progress/meter vendor pseudos; `*,::before,::after,::backdrop` transform/filter CSS variable defaults; **3 `@font-face`** | ~222 |
| `base` | **Nothing** (declared only) | 0 |
| `tokens` | `:where(:root, :host)` primitives + semantic aliases; `[data-panda-theme=light\|dark]`; **31 `@keyframes`**; `--animations-*` shorthands | ~105 braces (mostly token blocks + keyframe frames) |
| `recipes` | **Nothing** (declared only). “Recipes” are global `.ref-*` + `[data-variant]` | 0 |
| `utilities` | Panda atomic classes (`p_4r`, `bg_gray\.950`, condition prefixes, `staticCss` colour/spacing wildcards) | ~6,162 |

---

## 3. Feature-family inventory

| Family | Count | Example rule(s) with line numbers | Likely authoring construct | Notes |
|--------|------:|-----------------------------------|----------------------------|-------|
| **`@layer` declaration + order** | 1 order stmt + 4 bodies | L70: `@layer reset, global, base, tokens, recipes, utilities;` · L1 `@layer reset {` · L2761 `@layer utilities{` | Panda `layers` config (default names; `global` is Reference’s dump of `globalCss`) | Empty `base`/`recipes` still occupy cascade rank so utilities win over tokens. |
| **Reset / preflight** | ~12 rules, 1 media | L1–8 `*, *::before, *::after { box-sizing: border-box; }` · L21–24 `ul[role='list'], ol[role='list'] { list-style: none; }` · L54–67 `@media (prefers-reduced-motion: reduce)` with `animation-duration: 0.01ms !important` | Panda `preflight: true` / reset layer | Also sets `body { container-type: inline-size }` (L34) — container **type** without `@container` rules. |
| **`:root` / host token vars** | **373** decls in `:where(:root, :host)` (L1818–2192); **2** `:root` selectors total (global L73 + this) | L1818–1821 `:where(:root, :host) { --spacing-px: 1px; --spacing-r: var(--spacing-root);` · L1838 `--colors-slate-50: oklch(98.4% 0.003 247.858);` · L2173–2179 `--fonts-sans: "Inter", …;` `--font-weights-sans-normal: 400;` | `tokens({ spacing, colors, fonts, radii, animations, fontWeights })` | Global `:root` only adds `--made-with-panda: '🐼'` and `--spacing-root: 0.25rem` (L73–75). `:host` included for shadow-DOM consumers. |
| **Semantic tokens** | ~73 `--colors-ui-*`, ~39 `--colors-design-*`, ~6 `--colors-reference-*`, ~5 `--colors-text-*` in the default block (then **reassigned** in theme islands) | L2209 `--colors-design-text-base: var(--colors-gray-950);` (light island) · L2220 `--colors-ui-selection-background: var(--colors-gray-900);` | Semantic `tokens.colors` / `semanticTokens` pointing at palettes | Default `:where(:root,:host)` also **inlines dark-looking semantics** (e.g. L2384 `--colors-ui-focus-ring: var(--colors-gray-50);`) then light/dark islands override. |
| **Light/dark islands** | **2** selectors, **98** colour vars each | L2194 `[data-panda-theme=light] {` · L2295 `[data-panda-theme=dark] {` · L2200 `--colors-design-background: oklch(100% 0 0);` | Panda `_light` / `_dark` on semantic tokens + `data-panda-theme` condition | **No** `[data-theme]`, `.dark`, `[data-color-mode]`, `prefers-color-scheme`. Theme is an attribute island, not a class. |
| **`--fonts-*` + type scale** | 5 `--fonts-*` (sans/serif/mono + `reference-*` aliases); 17 `--font-weights-*` | L2173 `--fonts-sans: "Inter", ui-sans-serif, sans-serif;` · L2177 `--font-weights-sans-normal: 400;` · L2183 `--font-weights-serif-normal: 373;` (optical size leftover) | `tokens.fonts` + `font()` / font-weight tokens | Odd 373/393 weights look like variable-font axis metadata, not CSS keywords. |
| **Rhythm / spacing scale** | **19** `--spacing-*` decls | L75 `--spacing-root: 0.25rem;` · L1822 `--spacing-0\.5r: calc(0.5 * var(--spacing-root));` · L1823 `--spacing-1\/2r: calc(var(--spacing-root) / 2);` · L1831 `--spacing-4r: calc(4 * var(--spacing-root));` | Reference rhythm tokens (`r`, `4r`, `0.5r`, `1/2r`) not Tailwind `4` | **940** `--spacing-` *mentions* file-wide (mostly `var()` in utilities). Scale: `px`, `r`, `0.5r`, `1/2r`…`1/6r`, `1r`–`12r`, `8.5r`. |
| **Radii / other token cats** | 4 radii; 21 `--animations-*`; **no** `--shadows-*`, `--sizes-*`, `--blurs-*`, `--z-index-*` token decls | L `--radii-sm: 0.27rem;` … `--radii-full: 9999px;` · L `--animations-spin-fast: spin 1s linear infinite;` | Sparse token tree; shadows often **arbitrary** `bx-sh_0_2px_8px_rgba\(...\)` | Missing size tokens is why `.size_md { width: md }` happens (utility looks up `md` as a size token, fails, emits identifier). |
| **`@media` breakpoints** | **1** media query total | L54 `@media (prefers-reduced-motion: reduce) {` | Reset only | **Distinct queries:** `(prefers-reduced-motion: reduce)` ×1. **No** `min-width`/`sm`/`md`/`lg` at-rules. **0** `sm\:` / `md\:` classes. |
| **`@container`** | **0** queries | — | `container: true` / `container-type` on body (L34, L79) **does not** emit `@container` rules in this sheet | Type is set; no container-query utilities were generated. |
| **Motion / print / hover MQ / forced-colors / `@supports`** | reduced-motion **1**; others **0** | L54–67 reset block | `preflight` reduced-motion | No `@media print`, `(hover: hover)`, `forced-colors`, `@supports`. |
| **Pseudo-classes (raw, `rg -F`)** | `:hover` 28 · `:focus` 45 · `:focus-visible` 31 · `:focus-within` 2 · `:active` 11 · `:disabled` 6 · `:checked` 3 · `:not(` 25 · `:is(` 75 · `:where(` 11 · `:has(` 8 · `:first-child` 1 · `:last-child` 3 · `:only-child` 3 · `:root` 2 · `:host` 1 | L475 `.ref-button:where([data-variant="default"], :not([data-variant])):is(:hover, [data-hover])` · L461 `.ref-button:is(:focus-visible, [data-focus-visible])` · L436 `:has(> [data-slot="icon"]:only-child, > svg:only-child)` | `css({ _hover, _focusVisible, _disabled })` and `globalCss` with Panda conditions; `:is/:where/:has` from compiler, not author | **Absent:** `:nth-child`, `:empty`, `:indeterminate`, `:invalid` (invalid uses `[aria-invalid]` / `[data-invalid]`), `:visited`. `:focus` 45 includes vendor `::-moz` / range focus. |
| **Pseudo-elements** | `::before` 6 · `::after` 4 · `::placeholder` 1 · `::selection` 1 · `::marker` 3 · `::backdrop` 1 · `::file-selector-button` 3 | L97 `[class*=" ref-"]::selection` · L543 checkbox `::before` tick · L1641 `.ref-ul ::marker` · L1735 `*,::before,::after,::backdrop` | `globalCss` `_before` / `::selection` / list markers; Panda transform-var reset on `::backdrop` | Plus **vendor**: `::-webkit-details-marker`, `::-webkit-slider-*`, `::-moz-range-*`, `::-webkit-progress-*`, `::-webkit-meter-*`, `::-moz-meter-bar`, `:-moz-meter-optimum`. |
| **Attribute conditions** | `[data-focus-visible]` 48 · `[data-hover]` 31 · `[data-focus]` 15 · `[data-disabled]` 11 · `[data-active]` 8 · `[data-state="checked"]` 6 · `[data-checked]` 3 · `[data-placeholder]` 3 · `[data-variant=…]` 12 · `[disabled]` 5 · `[aria-disabled=true]` 10 · `[aria-checked=true]` 3 · `[aria-invalid="true"]` 2 · `[data-invalid]` 2 · `[data-readonly]` / `[readonly]` · `[data-status="warning"]` 3 · `[open]` 1 | L454 `:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])` · L538 `:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"])` · L1044 `[data-reference-field]:has([aria-invalid="true"])` | Dual native+data conditions (Panda `_hover` → `:hover, [data-hover]`); Reference field machine attrs | **No** `[dir=rtl]`, `[data-orientation]`, `[data-layer]`, `[data-color-mode]`. `[data-panda-theme]` only on token islands. |
| **Reference-specific attrs** | `[data-reference-field]` 40 · `[data-reference-number-field]` 8 · `[data-reference-switch]` 7 · `[data-reference-slider-thumb]` 6 · `[data-slot="icon"|check|description|row]` | L1029 `[data-reference-field]:has(:is(input, textarea, select, .ref-input, …):focus)` · L1071 `[data-reference-field]:not([data-reference-number-field]) > .ref-button` | Component `globalCss` / `css({ '& > …': })` on field bezel; `data-slot` from parts | This **is** the “slot recipe” surface, implemented as global CSS + attributes, not `@layer recipes`. |
| **Parent / sibling / group / peer** | group/peer **0**; child `>` **14** selector lines; sibling `+` **0** as combinator; descendant arbitrary **~10** utility classes | L442 `.ref-button > [data-slot="icon"]` · L27355 `.\[\&_\>_\:last-child\]\:bd-b-w_0 > :last-child` · L27331 `.\[\&_\[data-slot\=\"description\"\]\]\:op_0\.75 [data-slot="description"]` | `css({ '& > *':, '& [data-slot=…]': })` → escaped `[&_…]\:` utilities; global child selectors | No `.group:hover &` / peer `~`. Nesting is either compiled global selectors or **escaped class + expanded selector**. |
| **`!important`** | **4** (all reset reduced-motion) | L62–65 `animation-duration: 0.01ms !important;` etc. | Preflight | Utilities do not use `!important`. |
| **Class-name grammar / escaping** | `\\.` **5418** file / **8288** in utilities (dots in `gray\.950`); `\\:` **35/48**; `\\/` **376/371**; `\\[` `\\]` **10/28**; `\\(` **63**; `\\%` **11**; `\\{` **3** | L2771 `.bg_gray\.950` · L4863 `.p_1\/2r` · L8113 `.ff_system-ui\,_-apple-system\,_…` · L27446 `.hover\:bg_color-mix\(in_oklch\,_currentColor_14\%\,_transparent\)` · L27410 `\{colors\.ui\.focus\.ring\}` inside a class | Panda `utility` class generation: `prop_value`, `.` → `\.`, `/` → `\/`, conditions `hover:` | Arbitrary values: `rgba\(…\)`, `color-mix\(…\)`. **Negative:** `.size_-4r` → `calc(var(--spacing-4r) * -1)` (L17944 area). **No** leading `.-m_` classes. |
| **`{token.path}` refs** | **3** | L8308 `.c_\{colors\.design\.text\.light\} { color: var(--colors-design-text-light); }` · L8326 `.c_\{colors\.green\.600\}` · L27410 class still contains `{colors.ui.focus.ring}` **and** `var(--colors-ui-focus-ring, var(--colors-ui-focus-ring))` | Author wrote `color: '{colors.design.text.light}'` / `token()` string; one **failed** lower | Almost always resolved to `var(--…)`. The row/`ring-c` case is a compiler leftover. |
| **`color-mix` / opacity** | **25** `color-mix(` | L477 `color-mix(in oklch, var(--colors-ui-table-row-muted-background) 80%, var(--colors-gray-300))` · L481 `… 15.2%, transparent` (press ring) · L27447 utility `color-mix(in oklch, currentColor 14%, transparent)` | `_hover` colour mixing in `globalCss`; one arbitrary utility | **Not** `red.500/50` class opacity. All mixes `in oklch`. **246** `oklch(` mentions (token primitives). |
| **Shorthand / alias expansion** | `px_` 41 → `padding-inline`; `py_` 43 → `padding-block`; `mx_`/`my_`; `bd-c_` → `border-color`; `bg-c_` → `background-color`; `bdr_` → `border-radius`; `d_` → `display`; `c_` → `color`; `fs_` → `font-size`; `size_` → `width`+`height`; `ring-*` → `outline-*` | L5152 `.px_3\.5r { padding-inline: calc(3.5 * var(--spacing-root)); }` · L5161 `.px_4r { padding-inline: var(--spacing-4r); }` · L7984 `.d_flex { display: flex; }` · L5127 `.bdr_lg { border-radius: var(--radii-lg); }` | Panda utilities / property map (`px`, `bg`, `rounded`→`bdr`) | `.bdr_none { border-radius: none; }` (L5123) is **invalid CSS**. `.size_*` expands to both axes. |
| **Recipes / compound variants** | **0** `@layer recipes` rules; **90** `.ref-*` stems; `.ref-button` **32** selector hits | L469–511 `[data-variant="default"\|"primary"\|"ghost"]` + hover/active compounds · L436 icon-only `:has()` | `globalCss` on tagged elements, **not** `recipe()` / `slotRecipes` | Compound = `:where([data-variant=…]):is(:hover,[data-hover])`. No `.button--variant_solid` grammar. |
| **Patterns (`d_flex`, truncate, srOnly, textStyles)** | `d_flex/inline-flex/grid/block` **4**; **no** `.truncate` / `.srOnly` / `textStyle` / `layerStyle` class stems | L7984 `.d_flex` · L8076 `.d_inline-flex` · L8145 `.d_grid` | `css({ display: 'flex' })` or pattern `flex` → `d_flex` | `ls_*` is **letter-spacing**, not layerStyle (`.ls_tight { letter-spacing: tight; }` — unresolved). No `srOnly` clip pattern found. |
| **`@keyframes`** | **31** names, inside **tokens** layer | L2396 `ping` · L2418 `glow` · L2430 `shimmer` · L2650 `slideUp` · L2710 `spin` · L2750 `wigglewiggle` | `keyframes()` fragment / token `animations` | Names: ping, flash, glow, shimmer, bounce, bounceIn, bounceOut, shake, fadeIn, fadeOut, fadeInUp/Down/Left/Right, scaleIn/Out/Up/Down, pulse, heartbeat, slideUp/Down/Left/Right, slideUpOut, slideDownOut, spin, spinReverse, rotate90, rotate180, wigglewiggle. |
| **`@font-face`** | **3** (in **global**, after recipes) | L1771 Inter woff2, `font-weight: 100 900` · L1784 Literata + `size-adjust: 104%; descent-override: 47%;` · L1801 JetBrains Mono `size-adjust: 101%` | `font({ family, src, … })` | Remote `fonts.gstatic.com` URLs. Variable-font weight ranges. |
| **Static CSS / unused colour atoms** | **~5,099** colour utilities; **~153 `colorPalette.*` per colour property** (11×153 ≈ **1,683**, matches `colorPalette` mention count); spacing `w_` 62, `p_` 47, `size_` 46 (incl. **full negative rhythm**) | L2771 `.bg_gray\.950` · L4243 `.bg_colorPalette\.50 { background: var(--colors-color-palette-50); }` · L17884 `.size_-px { width: calc(var(--spacing-px) * -1); }` | `staticCss: { css: [{ properties: { backgroundColor: ['*'], … } }] }` + virtual `colorPalette` | **Estimate:** of ~6,162 utility rules, **≥5,000 look static-generated** (full palettes × bg/color/fill/stroke/border/ring). Authored-looking remainder: layout, arbitrary shadows, condition prefixes (~dozens), escaped `[&…]`. |
| **Virtual `colorPalette`** | 153 classes × 11 properties; **no** `--colors-color-palette-*` **declarations** in tokens | L4243–4280 map `.bg_colorPalette.N` → `var(--colors-color-palette-N)` | Panda `colorPalette` / recipe virtual colours | Vars are **referenced but not defined** in this sheet unless a parent sets `--colors-color-palette-*` at runtime. |
| **Condition-prefixed utilities** | `hover\:` **13** · `focus\:` **6** · `focusVisible\:` **11** · `active\:` **1** · `disabled\:` **0** | L27418 `.hover\:bg_gray\.800:is(:hover, [data-hover])` · L27390 `.focusVisible\:ring-o_2px:is(:focus-visible, [data-focus-visible])` · L27470 `.active\:bg_ui\.table\.row\.mutedBackground:is(:active, [data-active])` | `css({ _hover: { bg: 'gray.800' } })` | Compiler **always dual-binds** native pseudo + `data-*`. |
| **Vendor / form-control CSS** | `-webkit-` **29** · `-moz-` **10** | L811 range `::-webkit-slider-runnable-track` (linear-gradient + `var(--range-percent)`) · L848 `::-moz-range-track` · L1137 `::-webkit-progress-bar` · L1200 `:-moz-meter-optimum::-moz-meter-bar` | `globalCss` for native `input[type=range\|file\|color]`, `progress`, `meter` | Hardest native-control family; includes `color-scheme: dark` on `.ref-progress` (L1129). |
| **Transform/filter CSS variables** | 1 giant rule | L1735–1768 `*,::before,::after,::backdrop { --blur: /*-*/ /*-*/; --translate-x: 0; … --scale-y: 1; }` | Panda default “css var” reset for `transform` / `filter` utilities | Comment placeholders `/*-*/ /*-*/` are Panda’s empty token trick. |
| **Boolean / `container: true`-like leaks** | 4 classes | L8564 `.focus_true { focus: true; }` · L8568 `.isolation_true { isolation: true; }` · L8572 `.inert_true { inert: true; }` · L8576 `.scroll_true { scroll: true; }` | Style props / macros (`isolation`, `inert`, `scroll`, `focus`) treated as CSS utilities | Invalid/meaningless CSS. **`container: true` does not appear as a class**; container is only `container-type` on body. |
| **Unresolved token passthroughs** | ~15 dotted identifiers + size keywords | L2929 `background: ui.panel.background;` · L3064 `background: design.bg.muted;` · L8096 `.size_md { width: md; height: md; }` · L8628 `.bx-sh_lg { box-shadow: lg; }` · L27435 `background: ui.button.mutedBackground;` | Missing semantic tokens still emit utilities | **Do not treat as required parity** unless the live Book actually uses those classes; they are compiler failures. |

### Pseudo-class / element counts (complete `rg -F`)

| Token | Count | Token | Count |
|-------|------:|-------|------:|
| `:is(` | 75 | `:focus` | 45 |
| `:focus-visible` | 31 | `:hover` | 28 |
| `:not(` | 25 | `:where(` | 11 |
| `:active` | 11 | `:has(` | 8 |
| `:disabled` | 6 | `::before` | 6 |
| `::after` | 4 | `:checked` | 3 |
| `:last-child` | 3 | `:only-child` | 3 |
| `::marker` | 3 | `::file-selector-button` | 3 |
| `:focus-within` | 2 | `:root` | 2 |
| `:first-child` | 1 | `:host` | 1 |
| `::placeholder` | 1 | `::selection` | 1 |
| `::backdrop` | 1 | `:nth-child` / `:empty` / `:indeterminate` / `:invalid` | 0 |

---

## 4. Hardest families to reproduce (top 12)

1. **Cascade occupancy of empty `base`/`recipes`** — utilities must still win; emitting those layer names in the same order is load-bearing even if empty.
2. **Dual native + `data-*` conditions** — every `_hover` is `:is(:hover, [data-hover])` (same for focus/focus-visible/active/disabled/checked). Miss one side and machine-driven components go visually dead.
3. **`[data-reference-field]` + `:has()` compound field CSS** — parent bezel reacts to descendant focus, `aria-invalid`, `readonly`, inner buttons; selector lists are long and easy to desync from utilities.
4. **Escaped nested utilities** (`[&_[data-slot="…"]]:…`, `[&:focus-visible > [data-slot="row"]]:…`) — class grammar, expansion to a **second** selector, and quoted `\"` inside `\[data-slot\=…]` must round-trip.
5. **`color-mix(in oklch, …)` hover/active recipes** — including awkward 15.2% press rings and dual-token mix fallbacks `var(--x, var(--x))` on range tracks.
6. **Native form-control vendor pseudos** (WebKit/Mozilla range, progress, meter, color-swatch, file-selector-button) plus `--range-percent` gradient — not expressible as simple atoms.
7. **Virtual `colorPalette` atoms without token decls** — 1.6k classes pointing at `--colors-color-palette-*` that this sheet never defines; runtime/parent must inject them or classes are no-ops.
8. **StaticCss cardinality vs authored CSS** — ~5k colour atoms + negative spacing `size_-Nr` must exist if lib classNames hash against them, even if unused in source.
9. **Theme islands vs default `:where(:root,:host)`** — 373 base vars (often dark-leaning) then 98 light/98 dark overrides on `[data-panda-theme=…]`; wrong default theme looks like a token bug.
10. **Rhythm token grammar** (`4r`, `0.5r`, `1/2r`, escaped `1\/2r` / `0\.5r`) plus `calc(N * var(--spacing-root))` when the class is `3.5r` without a named var.
11. **Panda class escaping + arbitrary values** (`gray\.800`, `hover\:`, `rgba\(…\)`, `color-mix\(in_oklch\,_…\%\,_…\)`) — one escaping mismatch and generated `class` strings miss the stylesheet.
12. **HTML-tag “recipes” in `global` not `recipes`** — parity is “90 `.ref-*` stems + `[data-variant]` compounds”, not `recipe()` slot classnames; putting them in the wrong layer would restyle under utilities.

---

## 5. Ten weirdest / most surprising rules

1. **L70 vs missing bodies** — cascade lists `base, … recipes` but those layers are never opened.

2. **L74** — `--made-with-panda: '🐼';` (Panda watermark on `:root`).

3. **L8096–8098** — invalid size tokens emitted as CSS identifiers:
   ```css
   .size_md {
     width: md;
     height: md;
   }
   ```

4. **L8564–8577** — boolean style props as fake CSS properties:
   ```css
   .focus_true { focus: true; }
   .isolation_true { isolation: true; }
   .inert_true { inert: true; }
   .scroll_true { scroll: true; }
   ```

5. **L2928–2929** — unresolved semantic path:
   ```css
   .bg_ui\.panel\.background {
     background: ui.panel.background;
   }
   ```

6. **L27410** — nested selector + leftover `{token}` **inside** the class and a tautological `var` fallback:
   ```css
   .\[\&\:focus-visible_\>_\[data-slot\=\"row\"\]\]\:ring-c_var\(--colors-ui-focus-ring\,_\{colors\.ui\.focus\.ring\}\):focus-visible > [data-slot="row"] {
     outline-color: var(--colors-ui-focus-ring, var(--colors-ui-focus-ring));
   }
   ```

7. **L27434–27435** — hover utility that does not resolve:
   ```css
   .hover\:bg_ui\.button\.mutedBackground:is(:hover, [data-hover]) {
     background: ui.button.mutedBackground;
   }
   ```

8. **L811–814** — range track: `color-mix` nested in a `linear-gradient` driven by `--range-percent`, with duplicated `var(--x, var(--x))` fallbacks (see file; single declaration spans the gradient + `background-color`).

9. **L1735–1736** — Panda empty-token comments on every element:
   ```css
   *,::before,::after,::backdrop {
     --blur: /*-*/ /*-*/;
   ```

10. **L5123–5124** — `none` is not a `border-radius` value:
    ```css
    .bdr_none {
      border-radius: none;
    }
    ```

Honourable mentions: L2183 `--font-weights-serif-normal: 373;`; L1129 `.ref-progress { color-scheme: dark; }`; L4243 `.bg_colorPalette.50` → undefined `--colors-color-palette-50`; **entire utilities layer has no `@media` breakpoints**.

---

## Implications for a Neo parity test plan

- Prove **layer order** (including empty `base`/`recipes`) before atoms.
- Split cases: **(A)** token islands + rhythm + fonts/keyframes, **(B)** `.ref-*` global recipes + field `:has()`, **(C)** atomic grammar + `_hover` dual selectors + escaped `[&…]`, **(D)** `staticCss` colour/spacing cardinality, **(E)** native form-control vendors.
- Do **not** block on cloning Panda passthrough bugs unless a lib className currently depends on them; record them as “sheet contains invalid CSS”.
- Breakpoints, `@container` rules, group/peer, `dir=rtl`, `data-layer`, `data-color-mode`, and `prefers-color-scheme` are **not** in this ground-truth file — parity with *this* sheet means **not** requiring them, even if Panda *can* emit them.
