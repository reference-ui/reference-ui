// acme.mjs — the CORE-LAYERS-19 prebuilt package fixture: the shape acme's published dist ships. It is plain JS
// that renders `Badge` and `Plain` through acme's own materialized, bound runtime
// (`upstream/.reference-ui/react/react.mjs`), exactly as `upstream/src/Badge.tsx` declares them, so every element
// stamps acme's `data-layer` and every class it mints is qualified with acme's name. The app never scans this file.
import { createElement, Span } from '../upstream/.reference-ui/react/react.mjs'

export function Badge({ children, ...rest }) {
  return createElement(Span, { bg: 'brand', color: 'acmeOnly', borderColor: '_private.seal', ...rest }, children)
}

export function Plain({ children, ...rest }) {
  return createElement(Span, rest, children)
}
