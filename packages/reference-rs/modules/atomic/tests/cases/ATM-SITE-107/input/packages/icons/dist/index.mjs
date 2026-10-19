/**
 * Built `@acme/icons` for ATM-SITE-107: a workspace icon package not built on
 * Reference UI. `color` is the SVG stroke and `size` its box; nothing here
 * imports a Reference runtime.
 */
import { jsx } from 'react/jsx-runtime'

export function StarIcon({ color = 'currentColor', size = 24 }) {
  return jsx('svg', { width: size, height: size, stroke: color, viewBox: '0 0 24 24' })
}
