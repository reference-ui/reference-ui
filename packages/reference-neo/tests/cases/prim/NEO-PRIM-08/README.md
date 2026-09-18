# NEO-PRIM-08 — `id`, `aria-*`, `data-*`, handlers, and `ref` reach the element; style props never leak; `as` never polymorphs

The world renders a Div carrying DOM props, a click handler, and a ref
callback alongside style props through both the sibling and `css` paths,
plus a second Div with an `as` prop. The spec clicks the first, checks the
handler fired, the ref callback saw the host, every DOM prop landed, no
style key leaked as an attribute, and the styles still paint — then checks
the second still renders its own tag, proving there is no polymorphic `as`.

Evidence: `[core]` `packages/reference-core/src/types/public/primitives.ts`
("without polymorphic `as`"); Neo PRIM-01 extends.

> Search terms: spread, forwarding, useRef, event-handlers, prop leaking, prim/dom-props, prim/ref-forwarding, NEO-PRIM-01
