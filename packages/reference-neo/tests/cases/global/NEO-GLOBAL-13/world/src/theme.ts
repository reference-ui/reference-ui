// Global rules for the NEO-GLOBAL-13 world. They take no inputs and emit
// the lib tag-recipe spellings: a body font family plus a card with a
// bare radius, a dotted ring path, and a bare ink — all resolved through
// their property categories, never printed verbatim.
import { globalCss } from '@reference-ui/neo'

globalCss({
  body: {
    fontFamily: 'sans',
  },
  '.card': {
    borderRadius: 'md',
    outlineColor: 'ui.focus.ring',
    outlineStyle: 'solid',
    outlineWidth: '2px',
    color: 'ink',
  },
})
