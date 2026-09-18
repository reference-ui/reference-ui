# GLOBAL ledger

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-GLOBAL-01 | Trace A: token ref + literal `:focus-visible` selector in `globalCss` paints | done | ATM-LAYER-03 | — | focus element; computed outline colour | `[lib]` global-css Trace A (`base.ts` 9–13 → `global.css` 21–24) |
| NEO-GLOBAL-02 | Trace B: rhythm aliases + `containerType` on `body` + `:root` var merge | done | ATM-LAYER-03, ATM-COND-16 | — | computed font-size; `container-type` | `[lib]` global-css Trace B (`global.ts` 3–20) |
| NEO-GLOBAL-03 | Trace C: nested `&` + `_hover`/`_disabled`/`_focusVisible` twins on a tag recipe (`.ref-button`) | done | ATM-LAYER-03, ATM-COND-10 | — | hover/focus/disabled twins | `[lib]` global-css Trace C; styles-css L461–475 |
| NEO-GLOBAL-04 | Trace D: `_before`/`_after` with token colour | done | ATM-LAYER-03 | — | `::before` computed | `[lib]` global-css Trace D (`inline.ts` 60–69) |
| NEO-GLOBAL-05 | Trace E: `undefined` entries strip; `_placeholder`; rhythm token vs calc | done | ATM-LAYER-03 | none (JSON seam drops `undefined`; colocated test pins it) | no `display` rule; placeholder colour | `[lib]` global-css Trace E (`inputs.ts` 19–31) |
| NEO-GLOBAL-06 | `'& ~ &'` under a comma selector becomes `:is()` siblings | blocked-on-rs RS-11 | ATM-COND-14 | — | second sibling margin | `[panda-v1]` `core/__tests__/global-css.test.ts:243` "complex recursive nesting" |
| NEO-GLOBAL-07 | Nested `@media` inside `globalCss` (and `@container`) wraps the rule | done | ATM-COND-11 | — | matching query paints, far query holds, container flips across widths | `[panda-v1]` `core/__tests__/global-css.test.ts:285` "nested at-rule" |
| NEO-GLOBAL-08 | `font()` emits `@font-face` with `src` lists, `size-adjust`, `descent-override` | done | RS-2 landed | `font.ts` (no change: fields already carried) | sheet text + `document.fonts` presence + computed families (loading not asserted) | `[lib]` styles-css L1771–1801 (3 faces); `[panda-v1]` `core/__tests__/global-fontface.test.ts` |
| NEO-GLOBAL-09 | No `--made-with-panda`, no `*` transform/filter var dump, no `global.css` file | done | none | `publish.ts` (no change: SYNC-02 already omits it) | negative sheet + fs assertions | `[decision D2,D7]`; coverage-map row 11 |
| NEO-GLOBAL-10 | `:has()` selectors pass through and match | done | ATM-LAYER-03 | — | field bezel reacts to inner `aria-invalid` | `[lib]` styles-css `:has(` ×8, L1044 |
| NEO-GLOBAL-11 | Vendor pseudo-elements (`::-webkit-slider-thumb`, `::file-selector-button`) pass through unchanged | done | ATM-LAYER-03 | — | sheet text + computed where Chromium exposes it | `[lib]` styles-css vendor family (L811–1200) |
| NEO-GLOBAL-12 | Colour mixes inside `globalCss` hover rules (`color-mix(in oklch, … 15.2%, …)`) paint | done | ATM-TOKEN-06 | — | hover computed | `[lib]` styles-css L477–481; global-css Trace C |

## RS-11 — `&` substitution in the global walker distributes over comma members with `:is()` (blocks NEO-GLOBAL-06)

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
