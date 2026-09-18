# NEO-PARITY-01 — the mini-lib world syncs and paints in light and dark

Evidence: all groups (leans, owns no engine); R1 probes `/tmp/parity-r1/amp.test.ts`,
`/tmp/parity-r1/slash.test.ts`, `/tmp/parity-r1/probes.test.ts`,
`/tmp/parity-r1/followup.test.ts`, `/tmp/parity-r1/micro.test.ts`.

One world authored the way `packages/reference-lib/src` is: light/dark
tokens, one `font()` with a two-entry `fontFace` array, one `keyframes()`,
nine `.ref-*` tag recipes via `globalCss()`, two `recipe()`s, primitives, a
field bezel with `data-slot`, one named `container` region, and a small
`staticCss` map. Six components paint in light and dark across a
`data-color-mode` flip, and the W4 probe roster asserts per probe:
P1/P2/P3/P4/P5/P6/P7/P8/P9/P10/P11/P12/P13/P14/P15/P16/P17/P18/P19/P20/P21
plus F1 live here — P4 pair shorthands expand to corners (RS-25/SHORT-09),
P8 prints both faces (RS-24/LAYER-11), P14 emits the gradient clip trio
(RS-22/SHORT-08), P15 paints both array-prop elements (RS-23/SITE-19 plus
NEO-PRIM-11 through the split), P19 unitizes `globalCss` numerics
(RS-26/UNIT-03), P20 braces top-level at-rules (RS-27/LAYER-12), P21
lowers breakpoint keys through queries (RS-28/LAYER-13), and the P5 empty
arm is refused with a warning diagnostic (RS-29/COND-21). No
`createPortal` exists on the generated entry, so P1 renders a second root
into a body-child host — same island semantics. No
`PrimitiveVariantRegistry` exists in Neo types (`variant?: unknown`), so
P7 proves the matrix augment-and-use consumer file typechecks green.
Capital-W `WebkitBoxOrient` (whose Panda output is the dashless
non-property `webkit-box-orient`) is dropped; P18 pins the Neo lowercase-w
spelling that passes through with its dash.

> Search terms: theming, dual-theme, color-scheme, multi-root, vendor-prefix, line-clamp, minilib, mini lib paint, parity/world-sync, parity/light-dark, NEO-PARITY-02, NEO-PARITY-03, NEO-PARITY-04
