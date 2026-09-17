# NEO-PRIM-03 — `_hover` prop paints on hover; the `data-hover` twin paints without it

The world renders two Divs carrying the `_hover` style prop: a live probe
with a base color, and a twin with a `data-hover` attribute and no base
color. The spec checks the sheet carries one `:is()` wrap and two
utilities, the twin paints through its attribute, and the live probe rests
on its base, paints under a real hover, and releases back after.

Evidence: `[atm]` ATM-COND-02; `[panda-v1]`
`vendor/panda-v1/packages/parser/__tests__/jsx.test.ts:352` ("should extract
conditions"); `[lib]`
`packages/reference-lib/.reference-ui/styled/styles.css`
`:is(:hover, [data-hover])`.
