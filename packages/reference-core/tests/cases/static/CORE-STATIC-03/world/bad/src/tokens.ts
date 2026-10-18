// Tokens for the unsatisfiable sibling the CORE-STATIC-03 spec syncs. They
// take no inputs and emit one innocent leaf, so the failure blames the
// staticCss request alone rather than an empty system.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    ember: { value: '#ef4444' },
  },
})
