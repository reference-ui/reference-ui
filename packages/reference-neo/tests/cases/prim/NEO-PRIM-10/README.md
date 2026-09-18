# NEO-PRIM-10 — the generated entry exposes the 101 tags, `css`, `recipe`, and every consumer type name

The world is one styled Div over brand/ink/paper plus spacing and radii, so the
sync loop mints runtime plans and the styled named graph. The spec asserts
node-side, in three censuses: the `react.mjs` runtime exports all 101 tag
components (each naming its own tag) plus `css`/`recipe` and no `Box`/`Flex`/
`Grid`; the `react.d.mts` declarations type all 101 tags and declare the
react-owned names while re-exporting the styled graph; and a temp consumer
importing the whole surface — tags, `css`/`recipe`, `StyleProps`,
`PrimitiveProps`, `PrimitiveElement`, `PrimitiveTag`, `RecipeVariantProps`,
`SystemStyleObject`, `CssStyles`, and the font registry types — typechecks
with `tsc --noEmit`.

Evidence: generated-folder-shape §7 items 2–4; coverage-map rows 18/20;
`[decision D5]`; cross-ref NEO-SYNC-05.

> Search terms: public api, dts, entrypoint, api surface, surface audit, prim/entry-exports, prim/consumer-types, NEO-PRIM-09
