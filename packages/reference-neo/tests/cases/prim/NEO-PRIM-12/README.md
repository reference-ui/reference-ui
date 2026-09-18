# NEO-PRIM-12 — Generated primitives render under a foreign `react-dom`, sharing one React

The world renders a bundle `Div` through `createRoot` imported from
`react-dom/client` — the consumer's copy, not the bundle's — the way
`@reference-ui/lib` renders through its own `react-dom`. The spec checks the
entry imports `react` externally with no bundled copy inside, then proves the
primitive paints its style props, stamps `data-layer`, and commits no
invalid-hook-call: one shared dispatcher, exactly the lib shape.

Evidence: `[lib]` landing regen (`Tabs.test.tsx` invalid-hook-call);
`[core]` `react.mjs` external `react`/`react/jsx-runtime` imports.

> Search terms: dedup, singleton react, peer dependency, externalized, duplicate react, prim/external-react, prim/shared-dispatcher
