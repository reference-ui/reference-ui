// Global rules for the GLOBAL-01 world. They take no input and emit one literal
// `:focus-visible` rule with a token outline colour. Written the way the lib
// base primitive authors it: literal pseudo, no named condition, no twin.
import { globalCss } from '@reference-ui/neo'

globalCss({
  '.ref-probe:focus-visible': {
    outlineColor: '{colors.ui.focus.ring}',
    outlineOffset: '2px',
  },
})
