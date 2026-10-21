# GLOBAL — `globalCss()` and reset

`globalCss()` is the authoring surface for unclassed CSS: `:root` vars, `body`,
the 90 `.ref-*` tag recipes (variants as `[data-variant]`, slots as
`[data-slot]`, machine state as `:is()` dual selectors), `:has()` field
compounds, and vendor pseudos — plus `@keyframes` and `@font-face`. The engine
lowers all of it into `@layer global` of the single `styles.css`; Core proves in
a browser that it paints. Reset itself (Reference's own Andy Bell layer,
`normalizeCss` flag) belongs to LAYER-04; this group proves what lives in
`global` and that no Panda chrome leaks alongside it.

## Dialect

Authors write `globalCss({ selector: { … } })` with token refs (`{colors.x}`),
rhythm (`4r`, `3.5r`), nested `&` selectors, named conditions (`_hover`,
`_disabled`, `_focusVisible`, `_placeholder`, `_before`/`_after`), nested
`@media`/`@container`, `color-mix()` strings with brace tokens, and `undefined`
to strip spread keys — plus `font()` and `keyframes()` fragments. Selectors are
literal (commas, `:has()`, vendor pseudos pass through); dark mode is token
islands, never `[data-*]` rules in this layer.

### Breakpoints and top-level at-rules

- Viewport `@media` breakpoints in globals print as `@media`, not `@container`.
  A scale key (`sm`, `lg`) lowers to `@media (min-width: …px)`, and `base` prints
  bare. CORE-PARITY-01 (P21) proves the `sm` and `lg` arms on `#p21` at two
  viewport widths. A responsive array (`width: ['40px', '90px']`) prints entry 0
  bare and entry 1 under the first named breakpoint (`sm`), entry 2 under `md`,
  and so on; no reference-core case yet proves arrays in globals. Range keys (`mdDown`, `mdOnly`, `<from>To<to>`) keep their
  `@container` bounds, rewritten as `@media`; no reference-core case yet proves
  them in globals.
- Top-level at-rules brace their inner selectors inside `@layer global`.
  CORE-PARITY-01 (P20) proves `@media (min-width: 1px)` around `#p20`.
  `@position-try` takes the same top-level branch, so
  `globalCss({ '@position-try --x': { top: '0' } })` is authorable: the
  `GlobalCssConfig` key type accepts any selector string. No case yet proves a
  `@position-try` block paints. There is no `positionTry()` factory; positioning
  belongs to lib's Overlay (ruled 2026-10-21).
- Literal nested `@media` and `@container` keys print as written; CORE-GLOBAL-07
  proves both wrap their rule in `@layer global`.

## Reference-rs cases

All confirmed present (`ls` + README in
`packages/reference-rs/modules/atomic/tests/cases/`): ATM-LAYER-03 (global
layer population, nested `&`, conditions via the walker), ATM-LAYER-05
(`@keyframes` in `global`), ATM-LAYER-06 (`@font-face` in `global`),
ATM-COND-10 (interaction pseudo catalog), ATM-COND-11 (`@media` presets as
at-rules), ATM-COND-14 (`&` composition, comma scoping), ATM-COND-16
(`container` forms), ATM-TOKEN-06 (slash/opacity parsing for `color-mix`
values). One row needs a reference-rs change: GLOBAL-08 waits on RS-2 (PLAN §5.3).

## Decisions

(`styled/global.css` is not written; the one sheet is `styles.css`) and (Panda chrome and bugs are not parity) both land here in CORE-GLOBAL-09.
Coverage-map row 11 is the input: `styled/global.css` is `covered-against-plan`
(SYNC-01 asserts the stub forbids); SYNC-02 rewrites SYNC-01 while GLOBAL-09
pins the absence from the stylesheet side (no file, no banner, no var dump).

## Approved absences

- `--made-with-panda` banner and the `*` transform/filter var dump.
- Panda's `@layer base` `global.css` file as a build artifact: it is a
  compiler contract read only by `demotePandaGlobalCssLayer`, never a runtime
  import. Core emits `@layer global` directly.
- `@keyframes` in the tokens layer: Panda puts its 31 keyframes there; Core
  puts them in `global` per ATM-LAYER-05. Deliberate divergence, same paint.
- Panda selector comma-merging (`body,.ref-div`): Rust walks one rule per node;
  cascade-equal, formatting differs.
- `colorPalette` no-op atoms, `.size_md{width:md}`, the `{…}` leftover class,
  duplicated dark semantics in the default block.
- Any `[data-theme]`/`[data-panda-theme]` rules inside the global layer: dark
  is token islands (proven by TOKEN-05, not here).

## Out of scope (Panda, not Reference)

| Feature | Reason |
| --- | --- |
| Panda `themes` JSON / `_themePrimary` | Brand packs, not colour mode |
| `:where(html)` vars + `@property` (Panda global-vars tests) | Panda global-vars shape; Core token vars live on `:root,[data-color-mode=…]` |
| `divideX`/`divideY` in global hover | Pattern pack, out (corpus §5) |
| Static colour/spacing cardinality | STATIC group, not globalCss |
| `groupHover` / `peerFocus` | COND-11, not globalCss |
| Slot recipes / `sva` | not globalCss: slots are a `recipe()` key (RECIPE group); lib parts use global CSS + `data-slot` (Trace C) |
| `token()` string helper | `{path}` refs only |
| Panda preflight | Preflight is off; reset is Reference's own (LAYER-04) |
