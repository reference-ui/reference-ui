# GLOBAL ledger

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| CORE-GLOBAL-01 | Trace A: token ref + literal `:focus-visible` selector in `globalCss` paints | done | ATM-LAYER-03 | — | focus element; computed outline colour | reference-lib global-css Trace A (`base.ts` 9–13 → `global.css` 21–24) |
| CORE-GLOBAL-02 | Trace B: rhythm aliases + `containerType` on `body` + `:root` var merge | done | ATM-LAYER-03, ATM-COND-16 | — | computed font-size; `container-type` | reference-lib global-css Trace B (`global.ts` 3–20) |
| CORE-GLOBAL-03 | Trace C: nested `&` + `_hover`/`_disabled`/`_focusVisible` twins on a tag recipe (`.ref-button`) | done | ATM-LAYER-03, ATM-COND-10 | — | hover/focus/disabled twins | reference-lib global-css Trace C; styles-css L461–475; bare/&-descendant/:not()/hover-nest/class-append corners verified (F1/F2/F3/H8/H10), css() bare parents fold to COND-05 |
| CORE-GLOBAL-04 | Trace D: `_before`/`_after` with token colour | done | ATM-LAYER-03 | — | `::before` computed | reference-lib global-css Trace D (`inline.ts` 60–69) |
| CORE-GLOBAL-05 | Trace E: `undefined` entries strip; `_placeholder`; rhythm token vs calc | done | ATM-LAYER-03 | none (JSON seam drops `undefined`; colocated test pins it) | no `display` rule; placeholder colour | reference-lib global-css Trace E (`inputs.ts` 19–31) |
| CORE-GLOBAL-06 | `'& ~ &'` under a comma selector becomes `:is()` siblings | done | ATM-LAYER-09 (RS-11) | — | second sibling margin | Panda v1 test "complex recursive nesting"; ATM-LAYER-09; single &~/&+ lower directly (E1/F4/H11), css() twins G3/G4 |
| CORE-GLOBAL-07 | Nested `@media` inside `globalCss` (and `@container`) wraps the rule | done | ATM-COND-11 | — | matching query paints, far query holds, container flips across widths | Panda v1 test "nested at-rule"; nested-@supports top-level + in-selector print correctly (H4/H5) |
| CORE-GLOBAL-08 | `font()` emits `@font-face` with `src` lists, `size-adjust`, `descent-override` | done | RS-2 is in place | `font.ts` (no change: fields already carried) | sheet text + `document.fonts` presence + computed families (loading not asserted) | reference-lib styles-css L1771–1801 (3 faces); Panda v1 global-fontface tests |
| CORE-GLOBAL-09 | No `--made-with-panda`, no `*` transform/filter var dump, no `global.css` file | done | none | `publish.ts` (no change: SYNC-02 already omits it) | negative sheet + fs assertions | |
| CORE-GLOBAL-10 | `:has()` selectors pass through and match | done | ATM-LAYER-03 | — | field bezel reacts to inner `aria-invalid` | reference-lib styles-css `:has(` ×8, L1044 |
| CORE-GLOBAL-11 | Vendor pseudo-elements (`::-webkit-slider-thumb`, `::file-selector-button`) pass through unchanged | done | ATM-LAYER-03 | — | sheet text + computed where Chromium exposes it | reference-lib styles-css vendor family (L811–1200); world authors lowercase-w `webkitAppearance` (P18 spelling, hyphenates to `-webkit-appearance` verbatim) — hyphen-prefixed keys warn+drop under N12; genuinely-unknown keys still drop |
| CORE-GLOBAL-12 | Colour mixes inside `globalCss` hover rules (`color-mix(in oklch, … 15.2%, …)`) paint | done | ATM-TOKEN-06 | — | hover computed | reference-lib styles-css L477–481; global-css Trace C |
| CORE-GLOBAL-13 | Bare token names in `globalCss` resolve through the property's category and paint | done | ATM-LAYER-15 (RS-35) | — | card computes resolved radius/ring/ink/family; global layer prints `var()` forms | ATM-LAYER-15; reference-lib `global.ts`, `disclosure.ts`, `shared.ts` |

## RS-35 — covered by ATM-LAYER-15

`globalCss` string values printed bare token spellings verbatim —
`fontFamily: 'sans'` → `font-family: sans`, `borderRadius: 'md'` → `md`,
`outlineColor: 'ui.focus.ring'` → `ui.focus.ring` — because the global value
lowering passed the kebab-case CSS prop to the shared token resolver, whose
font check, color check, and category map all key on the authored prop. Both
other resolver callers (atomic resolve, keyframe values) already passed the
authored form. Landing surfaced it as a whole-fixture font shift in every
Portal CT snapshot (`body` lost `var(--fonts-sans)`). Fix passes the
authored prop; plain literals still print verbatim and silently, dotted
misses warn.

- Input: `body { fontFamily: 'sans' }`, `.card { borderRadius: 'md',
  outlineColor: 'ui.focus.ring', display: 'flex' }` against fonts/radii/colors
  fixtures.
- Expected: `var(--fonts-sans)`, `var(--radii-md)`,
  `var(--colors-ui-focus-ring)`, verbatim `display: flex`, zero diagnostics.
- Waiting Core case: CORE-GLOBAL-13 (done).

## RS-11 — covered by ATM-LAYER-09

the global walker substitutes `&` textually without comma
distribution or `:is()` wrapping, so every multi-`&` or comma-parent nest is
cascade-wrong. Probes 
(direct `compile()` calls, `globalCss` entries only):

- `globalCss({ '.ref-stack > p, .ref-stack > ul': { margin: 0, '& ~ &': { marginTop: '10px' } } })`
  emits `.ref-stack > p, .ref-stack > ul ~ .ref-stack > p, .ref-stack > ul`
  — three selectors, the first and third matching every first child too.
- Single combinator parent `.ref-stack > p` + `'& ~ &'` emits
  `.ref-stack > p ~ .ref-stack > p`, which parses as
  `.ref-stack > (p ~ .ref-stack) > p` and never matches siblings.
- Comma of simple selectors `.ref-a, .ref-b` + `'& .ref-kid'` emits
  `.ref-a, .ref-b .ref-kid` — the bare first member matches everything.

Input style object (waiting case CORE-GLOBAL-06): `globalCss({ 'body > p,
body > ul': { margin: 0, '& ~ &': { marginTop: 10 } } })`, the panda shape.

Expected CSS: per-member distribution with `:is()` around members that
contain a combinator —
`:is(body > p) ~ :is(body > p), :is(body > ul) ~ :is(body > ul) {
margin-top: … }`. Comma members without a combinator distribute bare
(`.ref-a ~ .ref-a, .ref-b ~ .ref-b`); plain descendant nests distribute too
(`.ref-a .ref-kid, .ref-b .ref-kid`). Note the contrast: Panda's own
snapshot wraps only the first member (`:is(body > p) ~ :is(body > p), body >
ul ~ body > ul`) — the unwrapped second member is a Panda bug, not parity;
Core wraps every combinator member.

Suggested reference-rs case: ATM-LAYER-09 (global-walker family) — ATM-COND-14 already pins this contract for `css()` utilities, and
its gauges pass here (only its golden is stale).

## RS-26 — globalCss bare numerics unitize like css()

**RS-26** is covered by ATM-UNIT-03.

Current behaviour: a bare number in `globalCss` unitizes like `css()`.
`globalCss({ 'body > p, body > ul': { '& ~ &': { marginTop: 10 } } })`
(Panda shape) emits `margin-top: 10px` with zero
diagnostics. Unitless-stay props (`zIndex`, `lineHeight`, …) stay bare
(Panda v1 test "unitless"), and so do custom props and a literal
`0`. ATM-UNIT-03 asserts this; CORE-PARITY-01 probe P19 pins the unitized
output live on the Core side.

## RS-27 — top-level at-rules brace their inner selectors

**RS-27** is covered by ATM-LAYER-12.

Current behaviour: a top-level at-rule key in `globalCss` prints a braced
block. `globalCss({ '@media (min-width: 640px)': { body: { … } } })` (Panda shape) emits `@media (min-width: 640px) { body { … } }`,
and valid at-rule keys raise no diagnostic. Stacked at-rules nest in author
order, and nested at-rules are proven by GLOBAL-07. A bare at-rule key with
no query, such as `@supports`, is refused with an "Empty at-rule query"
diagnostic and is never printed. ATM-LAYER-12 asserts this; CORE-PARITY-01
probe P20 pins the braced output live on the Core side.

## RS-28 — breakpoint keys + conditional values lower through @media

**RS-28** is covered by ATM-LAYER-13.

Current behaviour: breakpoint keys and conditional values in `globalCss`
lower through the scale's `@media` queries. Input `globalCss` `.btn` with an
`sm:` key and `width: { base, lg }` (Panda shape)
prints `width: 40px` bare for `base` and `width: 90px` under
`@media (min-width: 1024px)` for `lg`, with zero diagnostics. An unknown
conditional key such as `nope` refuses with an "Unknown conditional key"
diagnostic and prints nothing, never a descendant selector. ATM-LAYER-13
asserts this; CORE-PARITY-01 probe P21 pins the breakpoint lowering live on
the Core side.
