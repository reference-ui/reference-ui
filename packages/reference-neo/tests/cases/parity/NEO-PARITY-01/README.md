# NEO-PARITY-01 — the mini-lib world syncs and paints in light and dark

Evidence: all groups (leans, owns no engine); R1 probes `/tmp/parity-r1/amp.test.ts`,
`/tmp/parity-r1/slash.test.ts`, `/tmp/parity-r1/probes.test.ts`,
`/tmp/parity-r1/followup.test.ts`, `/tmp/parity-r1/micro.test.ts`.

One world authored the way `packages/reference-lib/src` is: light/dark
tokens, one `font()`, one `keyframes()`, nine `.ref-*` tag recipes via
`globalCss()`, two `recipe()`s, primitives, a field bezel with `data-slot`,
one named `container` region, and a small `staticCss` map. Six components
paint in light and dark across a `data-color-mode` flip, and the W4 probe
roster asserts per probe: P1/P2/P3/P6/P7/P9/P10/P11/P12/P13/P16/P17/P18
plus F1 live here; P4 cites RS-25 (pair shorthands emit non-properties),
P5 cites RS-15, P8 cites RS-24 (the engine schema takes one `fontFace`),
P14 cites RS-22 (`textGradient` emits a non-property), P15 cites RS-23
(array `css` props extract nothing). No `createPortal` exists on
the generated entry, so P1 renders a second root into a body-child host —
same island semantics. No `PrimitiveVariantRegistry` exists in Neo types
(`variant?: unknown`), so P7 proves the matrix augment-and-use consumer file
typechecks green. Capital-W `WebkitBoxOrient` (whose Panda output is the
dashless non-property `webkit-box-orient`) is dropped; P18 pins the Neo
lowercase-w spelling that passes through with its dash.
