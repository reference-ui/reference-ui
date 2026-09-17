# TOKEN — tokens, islands, refs

Tokens are the named design values (colours, spacing/rhythm, radii,
fonts, keyframes, animations) authored in fragments and emitted as CSS
custom properties in `@layer tokens`. Utilities and recipes consume
them by name, by `{path}` ref, or by rhythm sugar (`4r`, `0.5r`).
Colour leaves carry `{ light, dark }` and print as `data-color-mode`
islands. This group owns `src/fragments/api/{tokens,font,keyframes}.ts`.
Existing: `NEO-EDGE-02` (radii, done).

## Dialect

Authors write `tokens()` trees with `value` leaves and `{ light, dark }`
colour leaves; `{colors.x}` refs (including `/opacity` and multi-ref
strings) inside any value; slash opacity (`red.500/40`); rhythm keys
(`r`, `0.5r`, `1/2r`, `4r`, `12r`) and negatives (`-4r`); `_private`
subtrees for package-internal tokens; `font()` / `keyframes()`
registries plus the `font: 'sans'` macro. Not dialect: `colorPalette`,
`token()`, semantic-token objects, composite token objects (write
strings), Panda `themes` JSON.

## Engine stations

All confirmed present 2026-09-17 (`ls` + README in
`packages/reference-rs/modules/atomic/tests/cases/`): ATM-TOKEN-01..11,
ATM-RHYTHM-01..05, ATM-COND-03/05/08, ATM-LAYER-05, ATM-NAME-01..07.
Key leans: TOKEN-08 (multi-ref expansion), TOKEN-03/06 (`color-mix`),
TOKEN-07 (negation prints `calc(-1 * var(…))`), TOKEN-11 (alias stays
`var()`), TOKEN-01/09 (lookup breadth), RHYTHM-02 (decimal `0.5r`) /
RHYTHM-03 (fractions) / RHYTHM-05 (negatives), COND-03/08 (colour mode;
RS-7 landed, READMEs say `data-color-mode`), COND-05 (`font`/`weight`/
`size` macros), LAYER-05 (`@keyframes` in `global`), NAME-07 (escape
allowlist). Caveats: TOKEN-09 proves category breadth, not `_private`
(TOKEN-09 runs on host + typegen, engine `none`); LAYER-05 has no
token-ref bodies (TOKEN-13 cook verifies ref expansion at R1);
COND-16 is container-scoped, so TOKEN-10 cites COND-05 only; no
station diagnoses a missing `{ref}` — that is RS-3.

## Decisions

D1 (`data-color-mode` islands; RS-7 done; TOKEN-05 proves alongside
PRIM-07/COND-04). D13 (missing `{ref}` is a sync error, never an
escaped literal; TOKEN-02 → RS-3). D14 (`colorPalette` out), D15
(`token()` out). D7 as contrast: `.size_md{width:md}`, the leftover
`{colors.…}` class, and `--made-with-panda` must not be reproduced.

## Approved absences

- `colorPalette` virtual tokens (D14): no lib author writes the
  `colorPalette` prop; the 1.6k atoms are staticCss noise pointing at
  vars the sheet never defines.
- `token()` string helper (D15): neither core nor lib exports it;
  `{path}` refs only.
- Composite token objects (shadow/gradient/border/asset): lib declares
  zero `--shadows-`/`--gradients-` vars; authors write strings.
  Revisit only if a fragment author asks.
- Panda `themes` JSON (`[data-panda-theme=<name>]` brand packs): brand
  packs are not colour mode; Reference colour mode is `data-color-mode`
  islands (D1).
- `:where(html)` token-layer spelling: Neo emits
  `:root,[data-color-mode=light]` / `[data-color-mode=dark]` (§4.4).
- Hashed var names (`--jolVMp`) and `formatTokenName` (`$` prefixes):
  Panda opt-ins; Reference naming is dotted paths → `--kebab`.
- W4 F2: `red/0.33`-style decimal slash opacity printing `0.33%`
  (`color-mix.test.ts:89`). Panda bug; bugs are not parity (D7).
  (w4-synthesis A-F2.)
- W4 F3: named opacity tokens (`red/half` with `opacity.half`).
  `tokens()` has no opacity category. (w4-synthesis A-F3.)
- W4 OOD-1: breakpoint-conditioned token values (semantic spacing,
  gutter `@media (min-width: 64rem)`). No breakpoint axis on leaves.
  (w4-synthesis A-OOD.)
- W4 OOD-2: nested token conditions (`osDark:highCon`). No condition
  axis on leaves. (w4-synthesis A-OOD.)
- W4 OOD-3: forced-colors token islands. No engine preset, no lib
  author. (w4-synthesis A-OOD.)
- W4 OOD-4: `token()` nested fallbacks (beyond D15). (w4-synthesis A-OOD.)
- W4 OOD-5: percent cssVar (`--sizes-100%`). No `sizes` category.
  (w4-synthesis A-OOD.)

## Out of scope (Panda, not Reference)

| Feature | Reason |
| --- | --- |
| `semanticTokens` + `_dark`/`@light`/`@hover` inside `value` | Reference leaves use `light`/`dark` keys on the token object |
| Multi-block `@slot` cartesian + selector-only OR blocks | Engine test shape, not author API |
| `DEFAULT` keyword flattening | No `DEFAULT` in the `tokens()` surface |
| `strictTokens` / `WithEscapeHatch` / `ImportantMark` types | D17: deferred past this voyage |
| `token.var` JS map, `globalVars` unions | No `token()` runtime (D15) |
| `textStyles` / `layerStyles` / `animationStyles` | Zero matches in lib/core sources |
| Asset tokens (SVG data-URL) | Not in the `tokens()` surface |
| Circular refs | No Panda test; do not invent behaviour |
