// nested.mjs — the CORE-LAYERS-20 prebuilt package fixture: the shape the two packages' dists ship. It is plain JS
// that renders a's `ABadge` through a's bound runtime and b's `BCard` through b's, exactly as their sources declare
// them, so each element stamps its own package's `data-layer`. The app never scans this file.
import { createElement, Span as ASpan } from '../upstream/a/.reference-ui/react/react.mjs'
import { Span as BSpan } from '../upstream/b/.reference-ui/react/react.mjs'

export function ABadge({ id, children }) {
  return createElement(ASpan, { id, bg: 'brand' }, children)
}

export function BCard({ id, children }) {
  return createElement(BSpan, { id, bg: 'brand' }, children)
}
