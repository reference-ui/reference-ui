# LAYER — cascade layers and packages

This group proves the cascade skeleton everything else paints inside: the
six-layer order statement, which bodies may be omitted, where reset,
keyframes, font-faces, recipes, and utilities live, and how two systems nest
without clobbering each other. Layer order — not specificity — decides who
wins; every row here asserts a computed-style consequence of that order, never
sheet text alone. This group owns `src/sync/publish.ts` (CSS assembly only).

## Dialect

Authors write almost nothing about layers directly. They write `tokens()`,
`keyframes()`, `font()`, `globalCss()`, `recipe()`, `css()`, and the
`normalizeCss` flag in `ui.config.ts`; the engine assigns each product to its
layer. The order statement always names all six —
`reset, global, base, tokens, recipes, utilities` (PLAN §4.4; lib sheet L70) —
and empty layers still occupy their rank even when their bodies are omitted.
`global` holds `globalCss()` output plus `@keyframes` and `@font-face`;
`tokens` holds `:root` vars and `[data-color-mode=…]` islands (D1); recipes
precede utilities so host overrides win. Two systems nest as
`@layer <name>` packages; the portable form scopes tokens by `[data-layer]`.

## Engine stations

All confirmed present 2026-09-17 (`ls` + README in
`packages/reference-rs/modules/atomic/tests/cases/`): ATM-LAYER-02..08 and
ATM-RECIPE-03. (ATM-LAYER-01 is a standing gauge over every station, not a
folder.) Key leans: LAYER-02 (empty layers omitted, preamble always present),
LAYER-03 (globalCss + token islands populate their layers), LAYER-04
(utilities and their at-rule wrappers stay in `utilities`), LAYER-05/06
(keyframes and font-faces print in `global`), LAYER-07 (shared at-rule
grouping — cited for information, no dedicated Neo row), LAYER-08 (reset dump
prints first in `reset`), RECIPE-03 (utilities layer follows recipes, so host
overrides win). One row needs the RS lane: LAYER-02 waits on RS-4
(base-system `BAS-EXTEND-*` fragment adoption, still unproven).

## Ownership split with TOKEN

Keyframes are claimed twice, on purpose, without overlap: **LAYER-03 owns
layer-membership** — `@keyframes` and `@font-face` print in `@layer global`,
exactly once, and an animation runs. **TOKEN-11 owns the registry claim** —
`keyframes()` registers names and `animations` tokens reference them
(PLAN §8.3). TOKEN-13 owns token/rhythm resolution inside keyframe bodies.
A cook proving LAYER-03 asserts placement and paint, not the registry.

## Decisions that apply

D1 (colour-mode islands are `[data-color-mode=…]`; engine retarget landed —
goldens and the portable fixture emit it). D2 (`styled/global.css` is not
written; `@layer global` lives inside `styles.css`). D7 (Panda chrome is not
parity: `--made-with-panda`, the `*` transform-var dump — see GLOBAL-09).
D9 (slot recipes out; multi-part anatomy is authored global CSS + `data-slot`).
D17 defers the `layers` *config surface*, not the two-system package nesting
that LAYER-02 proves via RS-4.

## Approved absences

| Absent | Reason |
| --- | --- |
| Empty `base` / `recipes` bodies in the lib sheet | Deliberate: the rank is kept by the order statement, the bodies omitted (LAYER-01 proves the rank still holds). |
| Panda `recipes._base` / `recipes.slots` inner layers | `layers.ts` inner-layer spelling; Reference emits flat `@layer recipes` and lib authors no slot recipes (D9). |
| Panda `compositions` layer | `layers.ts` has one; the lib sheet has no `textStyle`/`layerStyle` classes and no such layer. |
| `--made-with-panda`, `*` transform-var dump | Panda cssgen chrome (D7); GLOBAL-09 asserts their absence. |
| `colorPalette.*` virtual atoms | 1.6k staticCss no-ops pointing at undefined vars (D14). |
| W4 F7: scoped reset (`preflight: { scope }`) | No lib author scopes the reset; LAYER-04 covers the `normalizeCss` flag (w4-synthesis A-F7). |

## Out of scope (Panda, not Reference's dialect)

| Panda feature | Reason |
| --- | --- |
| Custom `CascadeLayers` config names | No config table in Neo; the six names are fixed. |
| LightningCSS / Panda five-layer list | Their list lacks `global`; ours is six (atomic SPEC). |
| Static recipe expansion (`staticCss` recipes) | Production spec always carries the default table; recipes compile from `recipe()` calls. |
| `panda.config.ts` / `styled/global.css` as inputs | Panda machinery; forbidden paths (§4.1). |
