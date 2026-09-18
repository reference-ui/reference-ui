# GLOBAL ledger

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-GLOBAL-01 | Trace A: token ref + literal `:focus-visible` selector in `globalCss` paints | done | ATM-LAYER-03 | — | focus element; computed outline colour | `[lib]` global-css Trace A (`base.ts` 9–13 → `global.css` 21–24) |
| NEO-GLOBAL-02 | Trace B: rhythm aliases + `containerType` on `body` + `:root` var merge | done | ATM-LAYER-03, ATM-COND-16 | — | computed font-size; `container-type` | `[lib]` global-css Trace B (`global.ts` 3–20) |
| NEO-GLOBAL-03 | Trace C: nested `&` + `_hover`/`_disabled`/`_focusVisible` twins on a tag recipe (`.ref-button`) | done | ATM-LAYER-03, ATM-COND-10 | — | hover/focus/disabled twins | `[lib]` global-css Trace C; styles-css L461–475; bare/&-descendant/:not()/hover-nest/class-append corners verified (F1/F2/F3/H8/H10), css() bare parents fold to COND-05 |
| NEO-GLOBAL-04 | Trace D: `_before`/`_after` with token colour | done | ATM-LAYER-03 | — | `::before` computed | `[lib]` global-css Trace D (`inline.ts` 60–69) |
| NEO-GLOBAL-05 | Trace E: `undefined` entries strip; `_placeholder`; rhythm token vs calc | done | ATM-LAYER-03 | none (JSON seam drops `undefined`; colocated test pins it) | no `display` rule; placeholder colour | `[lib]` global-css Trace E (`inputs.ts` 19–31) |
| NEO-GLOBAL-06 | `'& ~ &'` under a comma selector becomes `:is()` siblings | done | ATM-LAYER-09 (RS-11 landed) | — | second sibling margin | `[panda-v1]` `core/__tests__/global-css.test.ts:243` "complex recursive nesting"; `[atm]` ATM-LAYER-09; single &~/&+ lower directly (E1/F4/H11), css() twins G3/G4 |
| NEO-GLOBAL-07 | Nested `@media` inside `globalCss` (and `@container`) wraps the rule | done | ATM-COND-11 | — | matching query paints, far query holds, container flips across widths | `[panda-v1]` `core/__tests__/global-css.test.ts:285` "nested at-rule"; nested-@supports top-level + in-selector print correctly (H4/H5) |
| NEO-GLOBAL-08 | `font()` emits `@font-face` with `src` lists, `size-adjust`, `descent-override` | done | RS-2 landed | `font.ts` (no change: fields already carried) | sheet text + `document.fonts` presence + computed families (loading not asserted) | `[lib]` styles-css L1771–1801 (3 faces); `[panda-v1]` `core/__tests__/global-fontface.test.ts` |
| NEO-GLOBAL-09 | No `--made-with-panda`, no `*` transform/filter var dump, no `global.css` file | done | none | `publish.ts` (no change: SYNC-02 already omits it) | negative sheet + fs assertions | `[decision D2,D7]`; coverage-map row 11 |
| NEO-GLOBAL-10 | `:has()` selectors pass through and match | done | ATM-LAYER-03 | — | field bezel reacts to inner `aria-invalid` | `[lib]` styles-css `:has(` ×8, L1044 |
| NEO-GLOBAL-11 | Vendor pseudo-elements (`::-webkit-slider-thumb`, `::file-selector-button`) pass through unchanged | done | ATM-LAYER-03 | — | sheet text + computed where Chromium exposes it | `[lib]` styles-css vendor family (L811–1200); N12 repair 2026-09-18: world authors lowercase-w `webkitAppearance` (P18 spelling, hyphenates to `-webkit-appearance` verbatim) — hyphen-prefixed keys warn+drop under N12; genuinely-unknown keys still drop |
| NEO-GLOBAL-12 | Colour mixes inside `globalCss` hover rules (`color-mix(in oklch, … 15.2%, …)`) paint | done | ATM-TOKEN-06 | — | hover computed | `[lib]` styles-css L477–481; global-css Trace C |

## RS-11 — landed as ATM-LAYER-09 (unblocked NEO-GLOBAL-06)

R1 2026-09-17: the global walker substitutes `&` textually without comma
distribution or `:is()` wrapping, so every multi-`&` or comma-parent nest is
cascade-wrong. Probes `/tmp/neo-global-r1.mjs`, `/tmp/neo-global-r1b.mjs`
(direct `compile()` calls, `globalCss` entries only):

- `globalCss({ '.ref-stack > p, .ref-stack > ul': { margin: 0, '& ~ &': { marginTop: '10px' } } })`
  emits `.ref-stack > p, .ref-stack > ul ~ .ref-stack > p, .ref-stack > ul`
  — three selectors, the first and third matching every first child too.
- Single combinator parent `.ref-stack > p` + `'& ~ &'` emits
  `.ref-stack > p ~ .ref-stack > p`, which parses as
  `.ref-stack > (p ~ .ref-stack) > p` and never matches siblings.
- Comma of simple selectors `.ref-a, .ref-b` + `'& .ref-kid'` emits
  `.ref-a, .ref-b .ref-kid` — the bare first member matches everything.

Input style object (waiting case NEO-GLOBAL-06): `globalCss({ 'body > p,
body > ul': { margin: 0, '& ~ &': { marginTop: 10 } } })`, the panda
`global-css.test.ts:243` shape.

Expected CSS: per-member distribution with `:is()` around members that
contain a combinator —
`:is(body > p) ~ :is(body > p), :is(body > ul) ~ :is(body > ul) {
margin-top: … }`. Comma members without a combinator distribute bare
(`.ref-a ~ .ref-a, .ref-b ~ .ref-b`); plain descendant nests distribute too
(`.ref-a .ref-kid, .ref-b .ref-kid`). Note the D7 contrast: Panda's own
snapshot wraps only the first member (`:is(body > p) ~ :is(body > p), body >
ul ~ body > ul`) — the unwrapped second member is a Panda bug, not parity;
Neo wraps every combinator member.

Suggested station: ATM-LAYER-09 (global-walker family) at the liaison's
call — ATM-COND-14 already pins this contract for `css()` utilities, and
its gauges pass here (only its golden is stale, see the cook report).

## RS-26 — globalCss bare numerics print unitless (S1 sweep N1)

**RS-26 — LANDED as ATM-UNIT-03 (NEO-PARITY-01 P19 live; gap text below kept for provenance).**

Input `globalCss({ 'body > p, body > ul': { '& ~ &': { marginTop: 10 } } })`
(Panda `global-css.test.ts:243` shape) should emit `margin-top: 10px` — the
`css()` path unitizes (probe A1) — but the global path prints `margin-top:
10`, which browsers drop, with zero diagnostics. Probe `/tmp/s1-sweep/b1.mjs`
E2 (H11 control: literal `0` correctly prints `0`). Unitless-stay props
(`zIndex`, `lineHeight`, …) must NOT unitize (Panda
`rule-processor.test.ts:1215`). Waiting: PARITY-01 sub-probe (number at the
N3 cook's call). Station at the liaison's call.

## RS-27 — top-level at-rules print braceless (S1 sweep N2)

**RS-27 — LANDED as ATM-LAYER-12 (NEO-PARITY-01 P20 live; gap text below kept for provenance).**

Input `globalCss({ '@media (min-width: 640px)': { body: { … } } })` (Panda
`global-css.test.ts:266`) should emit a braced `@media` block but prints
`@media (min-width: 640px) body { … }` — invalid CSS, dropped — with zero
diagnostics. Probes F5/H1/H12 (`/tmp/s1-sweep/b{1,2}.mjs`); nested
at-rules are proven (GLOBAL-07). Waiting: PARITY-01 sub-probe. Station at
the liaison's call.

## RS-28 — breakpoint keys + conditional values print as descendants (S1 sweep N3)

**RS-28 — LANDED as ATM-LAYER-13 (NEO-PARITY-01 P21 live; gap text below kept for provenance).**

Input `globalCss` `.btn` with an `sm:` key and `width: { base, lg }`
(Panda `global-css.test.ts:13`) should lower through breakpoints but prints
garbage descendant selectors (`.btn width { base: 40px }`, `.btn sm { … }`)
with zero diagnostics. Probe H6 (`/tmp/s1-sweep/b2.mjs`). Waiting:
PARITY-01 sub-probe. Station at the liaison's call.
