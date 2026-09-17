// Global rules for the GLOBAL-09 world. They take no input and emit one
// token-coloured rule so the global layer is provably non-empty. The case
// asserts what the sheet omits, so this rule is the witness that the layer
// the chrome would ride in was actually compiled.
import { globalCss } from '@reference-ui/neo'

globalCss({
  '.ref-plain': {
    color: '{colors.ui.plain.ink}',
  },
})
