# GLOBAL — `globalCss()` and reset

`globalCss()` is the authoring surface for unclassed CSS: `:root` vars, `body`,
the 90 `.ref-*` tag recipes (variants as `[data-variant]`, slots as
`[data-slot]`, machine state as `:is()` dual selectors), `:has()` field
compounds, and vendor pseudos — plus `@keyframes` and `@font-face`. The engine
lowers all of it into `@layer global` of the single `styles.css`; Neo proves in
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

## Engine stations

All confirmed present 2026-09-17 (`ls` + README in
`packages/reference-rs/modules/atomic/tests/cases/`): ATM-LAYER-03 (global
layer population, nested `&`, conditions via the walker), ATM-LAYER-05
(`@keyframes` in `global`), ATM-LAYER-06 (`@font-face` in `global`),
ATM-COND-10 (interaction pseudo catalog), ATM-COND-11 (`@media` presets as
at-rules), ATM-COND-14 (`&` composition, comma scoping), ATM-COND-16
(`container` forms), ATM-TOKEN-06 (slash/opacity parsing for `color-mix`
values). One row needs the RS lane: GLOBAL-08 waits on RS-2 (PLAN §5.3).

## Decisions

D2 (`styled/global.css` is not written; the one sheet is `styles.css`) and D7
(Panda chrome and bugs are not parity) both land here in NEO-GLOBAL-09.
Coverage-map row 11 is the input: `styled/global.css` is `covered-against-plan`
(SYNC-01 asserts the stub D2 forbids); SYNC-02 rewrites SYNC-01 while GLOBAL-09
pins the absence from the stylesheet side (no file, no banner, no var dump).

## Approved absences

- `--made-with-panda` banner and the `*` transform/filter var dump (D7).
- Panda's `@layer base` `global.css` file as a build artifact (D2): it was a
  compiler contract read only by `demotePandaGlobalCssLayer`, never a runtime
  import (evidence §4). Neo emits `@layer global` directly.
- `@keyframes` in the tokens layer: Panda puts its 31 keyframes there; Neo
  puts them in `global` per ATM-LAYER-05. Deliberate divergence, same paint.
- Panda selector comma-merging (`body,.ref-div`): Rust walks one rule per node;
  cascade-equal, formatting differs (evidence §6.5).
- `colorPalette` no-op atoms, `.size_md{width:md}`, the `{…}` leftover class,
  duplicated dark semantics in the default block (D7).
- Any `[data-theme]`/`[data-panda-theme]` rules inside the global layer: dark
  is token islands (evidence §6.11; proven by TOKEN-05, not here).

## Out of scope (Panda, not Reference)

| Feature | Reason |
| --- | --- |
| Panda `themes` JSON / `_themePrimary` | Brand packs, not colour mode (D1) |
| `:where(html)` vars + `@property` (`global-vars.test.ts`) | Panda global-vars shape; Neo token vars live on `:root,[data-color-mode=…]` |
| `@position-try` (`global-position-try.test.ts`) | Not in Reference authoring |
| `divideX`/`divideY` in global hover | Pattern pack, out (corpus §5) |
| Static colour/spacing cardinality | STATIC group, not globalCss |
| Viewport `@media` breakpoints in globals | D8: `@container` only; nested `@media` itself is still proven (GLOBAL-07) |
| `groupHover` / `peerFocus` | COND-11, not globalCss |
| Slot recipes / `sva` | D9: multi-part anatomy is global CSS + `data-slot` (Trace C is the proof) |
| `token()` string helper | D15: `{path}` refs only |
| Panda preflight | Preflight is off; reset is Reference's own (LAYER-04) |
