# CORE-TOKEN — tokens, islands, refs

Proves the named design values authored in fragments and emitted as CSS custom properties in `@layer tokens`: colours, spacing/rhythm, radii, fonts, keyframes, animations. Utilities and recipes consume them by name, by `{path}` ref, or by rhythm sugar (`4r`, `0.5r`); colour leaves carry `{ light, dark }` and print as `data-color-mode` islands. Owns `src/collect/surface/{tokens,font,keyframes}.ts`. `SPEC.md` carries the token contract; `TESTS.md` is the case ledger.

> Search terms: design tokens, token refs, rhythm sugar, color islands, data-color-mode, semantic aliases, keyframes, font registry, spacing root

## Cases

- CORE-EDGE-02 — border radii resolve against radius tokens.
- CORE-TOKEN-01 — {colors.red.500} inside a multi-value border shorthand resolves to var(--colors-red-500).
- CORE-TOKEN-02 — a missing {colors.nope} ref fails sync with a located diagnostic (no escaped literal).
- CORE-TOKEN-03 — red.500/40 paints color-mix(in srgb, var(--colors-red-500) 40%, transparent).
- CORE-TOKEN-04 — {colors.pink.400/30} inside a box-shadow mixes inside the shadow.
- CORE-TOKEN-05 — { light, dark } leaves paint as data-color-mode islands on html and nested scopes.
- CORE-TOKEN-06 — semantic alias chains stay var() references, not inlined hex.
- CORE-TOKEN-07 — decimal and fraction rhythm (0.5r, 1/2r) paint through escaped classes, and decimal token keys print kebab vars.
- CORE-TOKEN-08 — negative spacing token (-sm) and negative rhythm (-1r, -4r) paint negated calc of the positive var.
- CORE-TOKEN-09 — _private.secret paints inside the owning system and stays in owner types.
- CORE-TOKEN-11 — keyframes() emits @keyframes in @layer global and animations tokens reference them.
- CORE-TOKEN-12 — multiple refs in one value all resolve.
- CORE-TOKEN-13 — keyframe bodies resolve token refs and rhythm.
- CORE-TOKEN-14 — camelCase token paths define kebab vars that hardcoded uses resolve.
- CORE-TOKEN-15 — the spacing-root rescale knob: one globalCss :root line doubles rhythm paint.

Parent: [tests/cases/](../README.md).
