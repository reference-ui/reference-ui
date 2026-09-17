// Tokens for the unsatisfiable sibling the NEO-STATIC-03 spec syncs. They
// take no inputs and emit one innocent leaf, so the failure blames the
// staticCss request alone rather than an empty system.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    ember: { value: '#ef4444' },
  },
})
