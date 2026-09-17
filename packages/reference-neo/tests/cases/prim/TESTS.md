# PRIM ledger

Statuses: `open`, `in-progress`, `done`, `blocked-on-rs`, `approved-absence`, `retired`. Ids are append-only; never renumber.

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-PRIM-01 | A native primitive paints through the generated entry | done | none | `factory.ts`, `context.ts`, `generate.ts` | exactly 2 utilities in sheet; brand/spacing paint; `ref-div` marker; `data-layer` names the system; style props stay off the element | existing case |
| NEO-PRIM-02 | `css` prop and sibling StyleProps both paint; `css` slot wins on conflict | done | ATM-SITE-14 | — (split already merges; no change) | computed from both sources; conflict resolves to `css` | `[panda-v1]` `output.test.ts` L74–88 |
| NEO-PRIM-03 | `_hover={{ color }}` prop paints on hover | done | ATM-COND-02 | `split.ts` (condition arms route to resolution) | real `page.hover()` paints; twin `data-hover` paints | `[panda-v1]` `jsx.test.ts` conditions; `[lib]` `:is(:hover,[data-hover])` |
| NEO-PRIM-04 | Array StyleProp `p={['1r','2r']}` is responsive across the breakpoint scale | done | ATM-LEAF-05 | — | paints per container width; `null` holes skip | `[panda-v1]` `output.test.ts` L2441; `[atm]` P1 #10 |
| NEO-PRIM-05 | `data-layer`: first primitive stamps, nested inherit without restamp, a second system's primitive inside restamps its own name | done | none | — (no change; second tree stands in for the second system) | DOM attributes across a three-level tree | `DOMAIN.md` data-layer; Neo `context.test.ts` |
| NEO-PRIM-06 | `variant="x"` stamps `data-variant` and applies the recipe class; `variant` and `colorMode` are not style props | done | ATM-COND-06 | — (no change; tag recipe via `globalCss`) | DOM attr + class present; no utilities minted for either key | ABI §4.3 |
| NEO-PRIM-07 | `colorMode="dark"` stamps `data-color-mode="dark"`; token islands and `_dark` utilities beneath repaint; nested `colorMode="light"` island flips back | done | ATM-COND-03/08 | — (D1 already landed) | computed colours at three depths | `[decision D1]`; `[atm]` P0 #1 |
| NEO-PRIM-08 | DOM passthrough: `id`, `aria-*`, `data-*`, event handlers, `ref` reach the element; style props never leak as attributes | done | none | — (no change; plus `as` non-polymorphism proof) | attributes + a click handler fire; style keys absent | Neo PRIM-01 extends |
| NEO-PRIM-09 | Every one of the 101 tags renders its own element name | done | none | — (no change; `tags.ts` already core-identical) | `tagName` census in one world | `[core]` tag set |
| NEO-PRIM-10 | Generated entry exposes the 101 tags, `css`, `recipe`, and every type name consumers import today (`StyleProps`, `PrimitiveProps`, `PrimitiveElement`, `PrimitiveTag`, `RecipeVariantProps`, `SystemStyleObject`, `CssStyles`, font registry types) | done | none | `generate.ts` (+ stable surface) | import census node-side against the generated entry | generated-folder-shape §7 items 2–4; coverage-map rows 18/20; `[decision D5]` cross-ref SYNC-05 |
