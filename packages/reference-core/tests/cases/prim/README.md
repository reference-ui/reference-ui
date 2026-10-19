# CORE-PRIM — native primitives

Proves the generated `@reference-ui/react` entry: the 101 tag components, the `css`/`recipe` bindings over compiled plans, and the DOM contract (`data-layer`, `data-variant`, `data-color-mode`). Style values lower in the engine; this group proves they paint through a primitive and that metadata and DOM props land where they should. Owns `src/primitives/**` and `src/sync/react.ts`. `SPEC.md` carries the entry contract; `TESTS.md` is the case ledger.

> Search terms: native primitives, tag components, generated entry, data-layer, data-variant, colorMode islands, StyleProps paint, css prop

## Cases

- CORE-PRIM-01 — a native primitive paints through the generated entry.
- CORE-PRIM-02 — `css` prop and sibling StyleProps both paint; `css` wins on conflict.
- CORE-PRIM-03 — `_hover` prop paints on hover; the `data-hover` twin paints without it.
- CORE-PRIM-04 — array StyleProp `p` is responsive across the breakpoint scale; `null` holes skip.
- CORE-PRIM-05 — first primitive stamps `data-layer`, nested inherits, inner tree restamps.
- CORE-PRIM-06 — `variant` stamps `data-variant` and selects the tag recipe; neither it nor `colorMode` is a style prop.
- CORE-PRIM-07 — colorMode islands repaint token and _dark utilities at three depths.
- CORE-PRIM-08 — `id`, `aria-*`, `data-*`, handlers, and `ref` reach the element; style props never leak; `as` never polymorphs.
- CORE-PRIM-09 — every one of the 101 tags renders its own element name.
- CORE-PRIM-10 — the generated entry exposes the 101 tags, `css`, `recipe`, and every consumer type name.
- CORE-PRIM-11 — array `css` props flow through the split to `css()` merge and paint.
- CORE-PRIM-12 — generated primitives render under a foreign `react-dom`, sharing one React.
- CORE-PRIM-13 — category-prefixed `colors.*` style props paint the token and leak no raw path.
- CORE-PRIM-14 — a dark island portaled outside the light host keeps dark resolution.
- CORE-PRIM-15 — corner-pair radius shorthands resolve to both addressed corners.

Parent: [tests/cases/](../README.md).
