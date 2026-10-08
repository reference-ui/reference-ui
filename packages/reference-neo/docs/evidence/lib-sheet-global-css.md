# Probe: `packages/reference-lib/.reference-ui/styled/global.css`

## 1. Executive summary

`global.css` is **Panda `cssgen({ type: 'global' })` output**, not the Andy Bell reset and not the full runtime sheet. It is a single `@layer base { … }` (1,744 lines) whose inner text is **byte-identical** (whitespace-normalized) to `@layer global` inside `styles.css` after Core postprocess **demotes** that base layer. Contents: Panda’s `--made-with-panda` signature, author `globalCss()` primitive rules (token/`r`/condition expansion), a Panda transform-utility CSS-variable dump on `*`, and three `@font-face` blocks from `font()`. There are **no** `@keyframes`, `@media`, `@container`, `:root` token palettes, `[data-theme]`, or `[data-panda-theme]` islands in this file. Apps never link it: they import `@reference-ui/react/styles.css` (a copy of `styled/styles.css`). Reset lives only in `styles.css` (`@layer reset`, Andy Bell, `preflight: false`). Neo’s collector is a typed copy that preserves fragments; it does not emit this file. Rust already lowers `GlobalStyleNode` into `@layer global`, but several Panda-only shapes (selector merge, vendor prefixes, transform-var dump, `--made-with-panda`, Andy Bell unless a `reset`/`preflight` fragment exists, `sizeAdjust`/`descentOverride`) are still gaps.

## 2. Block map

`global.css` has **one** `@layer` (`base`). There is no nested layer, no reset wrapper, no theme island. Block boundaries below are author-meaningful slices inside that layer.

| Lines | Block | Provenance (author + core module) | Notes |
| ---: | --- | --- | --- |
| 1, 1744 | `@layer base { … }` | Panda `cssgen` type `global` (`packages/reference-core/src/system/panda/gen/codegen.ts` `runGlobalCssgen`, outfile `styled/global.css`) | Core later **renames** this layer to `global` inside `styles.css` (`demotePandaGlobalCssLayer`). File on disk stays `base`. |
| 2–5 | `:root` custom properties | Panda injects `--made-with-panda: '🐼'`. `--spacing-root: 0.25rem` from **both** `packages/reference-lib/src/core/theme/global.ts` (`rootThemeVars`) **and** Core `rhythmGlobalCss` (`system/panda/config/extensions/rhythm/globals.ts`), merged via `extendGlobalCss` in generated `panda.config.ts` | Duplicate author/core keys deep-merge to one declaration. |
| 7–9 | `body { container-type }` | Lib `global.ts` `bodyStyles.containerType: 'inline-size'` | Not `container: true`. Split from typography because Panda grouped shared font decls onto `body,.ref-div`. |
| 11–19 | `body,.ref-div` typography + `.ref-div` color | `global.ts` `bodyStyles` + `primitives/base.ts` `baseTypography` | Panda **merges** identical decls across selectors. `fontSize: '4r'` → `var(--spacing-4r)` (rhythm **token** exists). Color stays on `.ref-div` only. |
| 21–29 | Focus-visible + `::selection` on `[class^="ref-"]` / `[class*=" ref-"]` | `primitives/base.ts` | `{colors.ui.*}` → `var(--colors-…)`. Literal `:focus-visible`, not `_focusVisible` (so no `:is(…, [data-focus-visible])` expansion). |
| 31–82 | Disclosure (`.ref-details`, `.ref-summary`, markers) | `primitives/disclosure.ts` + `shared.focusRingStyles` | `_focusVisible` → `:is(:focus-visible, [data-focus-visible])`. Outline shorthand split; extra `--transition-*` CSS vars. `4r`/`3r`/`2r`/`1r`/`md`. |
| 84–161 | Document landmarks, `hr`, `dialog`, ruby/time | `primitives/document.ts` | `marginBlock: '6r'`, `borderRadius: 'lg'`, token borders. Focus-ring split same as summary. |
| 162–204 | Figure / media / embed | `primitives/media.ts` | Continues immediately after document `rt`/`rp`. |
| 206–279 | Tables | `primitives/tables.ts` | `_hover` → `:is(:hover, [data-hover])`. |
| 281–327 | Fieldset / legend / label | `primitives/forms/base.ts` | `3.5r` is **not** a spacing token → `calc(3.5 * var(--spacing-root))`. |
| 328–440 | Buttons + variants | `primitives/forms/button.ts` | Nested `& > …` flattened; `_disabled`/`_hover`/`_active`/`_focusVisible`; `appearance` + `-webkit-appearance`; `8.5r` → `var(--spacing-8\.5r)`. |
| 442–496 | Checkbox | `primitives/forms/checkbox.ts` | Checked/before/focus-visible. |
| 497–843 | Text inputs, file, color, range, slider thumb, output, textarea | `primitives/forms/inputs.ts` (+ `field.ts` spread) | `display`/`alignItems`/`gap`/`minWidth`/`maxWidth: undefined` **omitted**. `_placeholder` → `::placeholder` **and** `[data-placeholder]`. `_file` → `::file-selector-button`. |
| 845–1051 | Field surface, number-field chrome | `forms/field.ts` via `globalCss(fieldSurfaceStyles)` | Second `globalCss()` in `inputs.ts`. |
| 1052–1142 | Progress / meter | `forms/meter.ts` | Vendor meter/progress pseudos. |
| 1144–1181 | Radio | `forms/radio.ts` | |
| 1183–1264 | Switch | `forms/switch.ts` | |
| 1265–1327 | `code`, kbd, pre, samp | `typography/code.ts` | Bare `code` selector (not `.ref-code`). `fontFamily: 'mono'` → `var(--fonts-mono)`. |
| 1329–1386 | Headings h1–h6 | `typography/headings.ts` | `fontWeight: 'sans.semibold'`; `9r`/`6r`/`5r`/`4.5r` mix of token vs calc. |
| 1388–1538 | Inline text (`a`, `q`, `b`, …) | `typography/inline.ts` | `_hover` on `.ref-a`; `_before`/`_after` on `.ref-q`; `fontWeight: 'sans.bold'` → `var(--font-weights-sans-bold)`. |
| 1540–1601 | Lists | `typography/lists.ts` | `::marker` colors. |
| 1602–1662 | Blockquote / cite / p / small / sub / sup | `typography/text.ts` | |
| 1664–1698 | Universal transform/filter CSS-variable defaults | **Panda**, not lib `globalCss()`, not Andy Bell | `*,::before,::after,::backdrop { --blur: /*-*/ /*-*/; … --scale-y: 1; }`. Present even with `preflight: false`. |
| 1700–1743 | `@font-face` Inter, Literata, JetBrains Mono | Lib `core/theme/fonts.ts` `font()` → Core `buildFontFaces` + `extendFontFaces` (`panda/config/extensions/api/font.ts`) | Emitted by **global cssgen**, not `globalCss()`. Includes `size-adjust` / `descent-override`. |

### Top 40 lines (verbatim)

```
     1|@layer base {
     2|  :root {
     3|    --made-with-panda: '🐼';
     4|    --spacing-root: 0.25rem;
     5|}
     6|
     7|  body {
     8|    container-type: inline-size;
     9|}
    10|
    11|  body,.ref-div {
    12|    font-family: var(--fonts-sans);
    13|    letter-spacing: -0.01em;
    14|    font-size: var(--spacing-4r);
    15|}
    16|
    17|  .ref-div {
    18|    color: var(--colors-design-text-base);
    19|}
    20|
    21|  [class^="ref-"]:focus-visible:not([role="option"]):not([role="menuitem"]):not([type="range"]),[class*=" ref-"]:focus-visible:not([role="option"]):not([role="menuitem"]):not([type="range"]) {
    22|    outline-color: var(--colors-ui-focus-ring);
    23|    outline-offset: 2px;
    24|}
    25|
    26|  [class^="ref-"]::selection,[class*=" ref-"]::selection {
    27|    background-color: var(--colors-ui-selection-background);
    28|    color: var(--colors-ui-selection-foreground);
    29|}
    30|
    31|  .ref-details {
    32|    padding: var(--spacing-4r);
    33|    border-width: 1px;
    34|    border-style: solid;
    35|    border-color: var(--colors-ui-disclosure-border);
    36|    border-radius: var(--radii-md);
    37|    line-height: 1.6;
    38|    margin-bottom: var(--spacing-4r);
    39|}
    40|
```

### What library authors actually write (`globalCss(` in `packages/reference-lib/src`)

Nineteen call sites, all under `src/core/theme/`:

| File | Shape |
| --- | --- |
| `global.ts` | Two calls: `:root` CSS vars; `body` with alias `fontFamily: 'sans'`, rhythm `fontSize: '4r'`, `containerType` (not `container: true`). |
| `primitives/base.ts` | Attribute selectors, `{colors.ui.*}` tokens. |
| `disclosure`, `document`, `media`, `tables` | Class selectors, tokens, some `_hover`. |
| `forms/{base,button,inputs,field,checkbox,radio,switch,meter}` | Nested `&`, `_hover`/`_focus`/`_focusVisible`/`_disabled`/`_active`/`_placeholder`/`_file`, `undefined` to strip flex from field spread, numeric `opacity: 0.5`. |
| `typography/{headings,inline,lists,text,code}` | Aliases `sans.bold`, nested `_before`/`_after`, bare `code`. |

**Not present in lib `globalCss()`:** `_dark` / `_light`, responsive arrays, `container: true`. Color modes are `tokens()` `{ light, dark }` and appear in **`styles.css` `@layer tokens`**, not here. `data-panda-theme` appears twice in `styles.css` tokens only.

### Neo collector vs Core

`packages/reference-neo/src/fragments/api/globalCss.ts` is the same `createFragmentFunction` pattern (`globalKey: '__refGlobalCssCollector'`). Differences:

- Core types `GlobalCssConfig` as Panda `Config['globalCss']`; Neo uses a local `Record<string, GlobalCssRule>` (`unknown` values).
- Neo evaluate keeps an **array** of `{ source, rules }` (`fragments/base/index.ts` `toGlobalCssEntries`); Core **deepMerges** all fragments plus `rhythmGlobalCss` into one Panda config (`extendGlobalCss`).
- Neo does **not** inject `rhythmGlobalCss` itself (only mentioned in the example comment). Lib still authors `--spacing-root` in `global.ts`.
- Neo publish writes a **stub** `styled/global.css` comment; real rules are expected in `styles.css` `@layer global`.

## 3. Five author → output traces

### Trace A — token `{colors…}` + literal `:focus-visible` (no named condition)

**Author** `packages/reference-lib/src/core/theme/primitives/base.ts` 9–13:

```ts
  '[class^="ref-"]:focus-visible:not([role="option"]):not([role="menuitem"]):not([type="range"]), [class*=" ref-"]:focus-visible:not([role="option"]):not([role="menuitem"]):not([type="range"])':
    {
      outlineColor: '{colors.ui.focus.ring}',
      outlineOffset: '2px',
    },
```

**Output** `global.css` 21–24:

```
  [class^="ref-"]:focus-visible:not([role="option"]):not([role="menuitem"]):not([type="range"]),[class*=" ref-"]:focus-visible:not([role="option"]):not([role="menuitem"]):not([type="range"]) {
    outline-color: var(--colors-ui-focus-ring);
    outline-offset: 2px;
}
```

### Trace B — rhythm aliases + `containerType` + Panda `:root` merge

**Author** `packages/reference-lib/src/core/theme/global.ts` 3–20:

```ts
export const rootThemeVars = {
  '--spacing-root': '0.25rem',
} as const

export const bodyStyles = {
  fontFamily: 'sans',
  letterSpacing: '-0.01em',
  fontSize: '4r',
  containerType: 'inline-size',
} as const

globalCss({ ':root': rootThemeVars })
globalCss({ body: bodyStyles })
```

**Output** `global.css` 2–15 (plus Panda signature and selector merge with `.ref-div` from `base.ts`):

```
  :root {
    --made-with-panda: '🐼';
    --spacing-root: 0.25rem;
}

  body {
    container-type: inline-size;
}

  body,.ref-div {
    font-family: var(--fonts-sans);
    letter-spacing: -0.01em;
    font-size: var(--spacing-4r);
}
```

`4r` hits Core `rhythmSpacingTokens.spacing['4r']` → `var(--spacing-4r)`. `3.5r` (no token) becomes `calc(3.5 * var(--spacing-root))` (see Trace E).

### Trace C — nested `&` + named `_hover` / `_disabled` / `_focusVisible`

**Author** `packages/reference-lib/src/core/theme/primitives/forms/button.ts` 20–27, 45–59:

```ts
    '& > [data-slot="icon"], & > svg': {
      fontSize: 'inherit',
    },
    '& > [data-slot="icon"]:first-child:not(:only-child), & > svg:first-child:not(:only-child)': {
      marginInlineStart: 'var(--reference-icon-offset, -0.25em)',
    },
    _disabled: {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      color: '{colors.ui.button.disabled.foreground}',
      backgroundColor: '{colors.ui.button.disabled.background}',
    },
  // …
    _hover: {
      backgroundColor:
        'color-mix(in oklch, {colors.ui.table.row.mutedBackground} 80%, {colors.gray.300})',
      borderColor: '{colors.ui.field.borderHover}',
    },
```

(`_focusVisible` comes from spread `focusRingStyles` in `shared.ts` 21–26.)

**Output** `global.css` 371–407:

```
  .ref-button > [data-slot="icon"],.ref-button > svg {
    font-size: inherit;
}

  .ref-button > [data-slot="icon"]:first-child:not(:only-child),.ref-button > svg:first-child:not(:only-child) {
    margin-inline-start: var(--reference-icon-offset, -0.25em);
}

  .ref-button:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
    pointer-events: none;
    cursor: not-allowed;
    color: var(--colors-ui-button-disabled-foreground);
    background-color: var(--colors-ui-button-disabled-background);
}

  .ref-button:is(:focus-visible, [data-focus-visible]) {
    outline-width: 2px;
    outline-style: solid;
    outline-color: var(--colors-ui-focus-ring);
    outline-offset: 2px;
    box-shadow: none;
}

  .ref-button:where([data-variant="default"], :not([data-variant])):is(:hover, [data-hover]) {
    border-color: var(--colors-ui-field-border-hover);
    background-color: color-mix(in oklch, var(--colors-ui-table-row-muted-background) 80%, var(--colors-gray-300));
}
```

Brace tokens inside `color-mix()` resolve to `var(--…)`. Nested `color-mix` is preserved.

### Trace D — `_before` / `_after` + token color

**Author** `packages/reference-lib/src/core/theme/primitives/typography/inline.ts` 60–69:

```ts
  '.ref-q': {
    ...baseTypography,
    color: '{colors.ui.q.foreground}',
    fontStyle: 'italic',
    _before: {
      content: '"\\201C"',
    },
    _after: {
      content: '"\\201D"',
    },
  },
```

**Output** `global.css` 1493–1504:

```
  .ref-q {
    color: var(--colors-ui-q-foreground);
    font-style: italic;
}

  .ref-q::before {
    content: "\201C";
}

  .ref-q::after {
    content: "\201D";
}
```

(Shared `baseTypography` was merged onto `.ref-mark,.ref-q` at 1487–1491.)

### Trace E — `undefined` strip, `_placeholder`, rhythm token vs calc

**Author** `packages/reference-lib/src/core/theme/primitives/forms/inputs.ts` 19–31, 63–69 (spread from `field.ts` includes `display: 'inline-flex'` etc.):

```ts
  '.ref-input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), .ref-select, .ref-textarea': {
    ...fieldBase,
    display: undefined,
    alignItems: undefined,
    gap: undefined,
    minWidth: undefined,
    maxWidth: undefined,
    width: '100%',
    _hover: { borderColor: '{colors.ui.field.borderHover}' },
    _placeholder: {
      color: '{colors.ui.field.placeholder}',
    },
  },
```

**Output** `global.css` 497–542 — no `display`/`align-items`/`gap`/`min-width`/`max-width`; `width: 100%` kept; `3.5r` → calc; `3r` → token var; `_placeholder` dual selector:

```
  .ref-input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]),.ref-select,.ref-textarea {
    padding-block: calc(0.75 * var(--spacing-root));
    padding-inline: var(--spacing-3r);
    …
    font-size: calc(3.5 * var(--spacing-root));
    appearance: none;
    -webkit-appearance: none;
    …
    height: var(--spacing-8\.5r);
    width: 100%;
}

  .ref-input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"])::placeholder,.ref-input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"])[data-placeholder],.ref-select::placeholder,.ref-select[data-placeholder],.ref-textarea::placeholder,.ref-textarea[data-placeholder] {
    color: var(--colors-ui-field-placeholder);
}
```

PLAN JSON normalisation dropping `undefined` matches this. Rust `GlobalStyleNode` likewise has no `undefined`.

**Bonus alias (not counted as a sixth required trace):** `fontWeight: 'sans.bold'` (`inline.ts` 24–26) → `global.css` 1435–1437 `font-weight: var(--font-weights-sans-bold);`.

## 4. Load-order and duplication

### Who links what

| Consumer | Sheet |
| --- | --- |
| `packages/reference-lib` Book, Playwright CT (`book/decorator`, `playwright/main.tsx`, Vite alias) | `@reference-ui/react/styles.css` only |
| `matrix/**/src/main.tsx` (chain, system, font, css, …) | `@reference-ui/react/styles.css` only |
| `apps/` | **no** `global.css` / `styles.css` hits |
| Packager `REACT_PACKAGE.copyFrom` | `styled/styles.css` → `react/styles.css`. **Does not copy `global.css`.** |
| Neo `publish.ts` | writes real `styles.css` + **stub** `global.css` |

Repo-wide `global.css` as a **runtime import** does not exist in lib/apps/matrix. It is a **compiler contract file**: `postprocess/helpers.ts` reads it so `demotePandaGlobalCssLayer` can assert `styles.css` `@layer base` matches `global.css` exactly, then rename that layer to `global` and insert `global` into `@layer reset, global, base, tokens, recipes, utilities`.

### Intended order (user-space `styles.css`)

1. `@layer reset { Andy Bell modern reset }` — **Core** `stylesheet/reset.ts`, gated by `normalizeCss !== false`. **Not** in `global.css`. **Not** Panda preflight (`baseConfig.preflight: false` and styled-build config too).
2. `@layer reset, global, base, tokens, recipes, utilities;`
3. `@layer global {` = **entire `global.css` inner**, layer name changed `base` → `global`
4. `@layer tokens {` token `:root` / `[data-panda-theme=…]` **and**, in this Panda emit, **`@keyframes` (31 names)** — **not** copied into `global.css`
5. `@layer utilities {` atomic utilities (~27k-line remainder)

`@layer base` and `@layer recipes` are absent from the **postprocessed** lib sheet (base was demoted; recipes empty).

### Duplication

- **Yes, on purpose:** `global.css` is verbatim equal to `styles.css` `@layer global` (1,744 lines, normalized CSS equal).
- **No:** reset, token palette, keyframes, utilities.
- Native engine path (`REF_SYSTEM_ENGINE=native`) still runs Panda **global** cssgen for `global.css`, then writes Rust `styles.css` **without** Core postprocess (no Andy Bell prepend, no demote). Rust is supposed to emit reset/global itself.

## 5. Reset

Panda **preflight is off**. `global.css` does **not** contain Andy Bell.

The reset that **does** ship is Reference’s own (`stylesheet/reset.ts`, comment cites Andy Bell / piccalil): `box-sizing`, zero margins on headings/body, `ul[role=list]`, `html:focus-within` smooth scroll, `body { min-height: 100vh; container-type: inline-size; … }`, media `prefers-reduced-motion`. Wrapped in **`@layer reset { }`** for user-space; portable form nests `@layer <system> { @layer reset { } }`.

The `*,::before,::after,::backdrop` block at `global.css` 1664–1698 is **Panda utility CSS-variable initialization**, not that reset.

Rust `append_reset_css` only prints fragments whose `source` contains `"reset"` or `"preflight"`. Lib authors never name files that way, so **Andy Bell will not appear from `GlobalStyleNode` walking of lib `globalCss()`**. Core injects it in TypeScript postprocess; Neo config still has `normalizeCss?: boolean` but sync/publish does not implement the inject.

## 6. Gap list for Neo (with test ideas)

Frozen contract: `PLAN.md` §3.1 `GlobalStyleNode` + recursive declarations; `container: true` / responsive arrays / `undefined` drop / `_dark`→`[data-theme=dark]`. Atomic walker (`modules/atomic/src/stylesheet/global/walker.rs`) already lowers nested `&`, `_` conditions via `BaseSystem`, lists→`@media`, `container` macro. Remaining gaps vs **this** `global.css`:

1. **Panda `@layer base` file vs Rust `@layer global` in `styles.css`.** Neo currently writes a comment stub for `styled/global.css`. Core’s demote contract expects a real matching file if anything still reads it.  
   `NEO-GLOBAL-01: panda-shaped global.css is either omitted on purpose or byte-matches styles.css @layer global after compile.`

2. **`--made-with-panda` and the `*` transform/filter CSS-variable dump** are Panda chrome, not `GlobalStyleNode`. Parity with Panda v1 “what Panda generates” vs Neo simplicity: decide drop vs emulate.  
   `NEO-GLOBAL-02: compiled global layer has no --made-with-panda and no --blur: /*-*/ dump unless explicitly specified.`

3. **Andy Bell `@layer reset` is not a `globalCss()` fragment.** Rust only emits reset if source path says reset/preflight. `normalizeCss` is unused in Neo sync.  
   `NEO-GLOBAL-03: with normalizeCss default true, styles.css opens with @layer reset { box-sizing: border-box; … prefers-reduced-motion } before global.`

4. **`@font-face` extras.** Panda global cssgen prints `size-adjust` and `descent-override` from `font()`. Rust `FontFaceDefinition` has no those fields; `append_font_faces` skips them. Keyframes: Panda puts them in **`@layer tokens`**; Rust PLAN/SPEC put `@keyframes` in **`@layer global`**.  
   `NEO-GLOBAL-04: Inter/Literata/JetBrains faces include size-adjust/descent-override; keyframes are not inside the global.css-equivalent slice.`

5. **Panda selector merging** (`body,.ref-div`, `.ref-a,.ref-a:is(:focus-visible,…)`) vs Rust one-rule-per-walk. Cascade should match; formatting will not.  
   `NEO-GLOBAL-05: body and .ref-div both get sans/4r/letter-spacing even if rules are not comma-merged.`

6. **Vendor prefixes and shorthand explosion.** `appearance: none` → also `-webkit-appearance`; `user-select` → `-webkit-user-select`; `outline: '2px solid transparent'` → width/style/color plus `--transition-prop` / `--transition-duration` / `--transition-easing`.  
   `NEO-GLOBAL-06: .ref-button computed appearance/user-select/outline/transition match Panda even if extra --transition-* vars are omitted.`

7. **Named-condition templates must match Panda’s `:is()` lists** (`_disabled` includes `[aria-disabled=true]`; `_placeholder` includes `[data-placeholder]`; `_file` → `::file-selector-button`). Walker uses `system.get_condition`; wrong catalog = wrong selectors. PLAN `_dark` is `[data-theme=dark]` but live `styles.css` tokens still use `[data-panda-theme]` (not in `global.css`).  
   `NEO-GLOBAL-07: _hover/_disabled/_placeholder/_file/_before on a globalCss fixture emit the same :is()/pseudo list as lib global.css.`

8. **Rhythm token vs calc.** Integer keys in `rhythmSpacingTokens` become `var(--spacing-4r)`; `3.5r`/`0.75r` become `calc`. Rust lowering may always calc.  
   `NEO-GLOBAL-08: fontSize 4r is var(--spacing-4r) or equal calc; 3.5r is calc(3.5 * var(--spacing-root)).`

9. **`container: true` and responsive arrays** are in the frozen node and walker, **unused by lib globalCss**. Lib uses `containerType: 'inline-size'` on `body` (required for `@container` utilities — ATM-COND-15).  
   `NEO-GLOBAL-09: globalCss({ body: { container: true } }) equals container-type: inline-size; array padding [1, null, 4] emits base + @media (or @container per profile) skipping the hole.`

10. **`undefined` entries** (inputs stripping field flex) must disappear before Rust (PLAN JSON drop). Nested `color-mix(… {colors.x} …)` must resolve inside functions.  
    `NEO-GLOBAL-10: spreading a flex field then display: undefined yields no display; color-mix with brace tokens becomes var() inside the function.`

11. **No `_dark` in global.css.** Dark is token islands. Do not invent `[data-theme]` rules in the global layer for lib parity.  
    `NEO-GLOBAL-11: lib-shaped compile leaves [data-theme]/[data-panda-theme] out of the global layer; they belong in tokens.`
