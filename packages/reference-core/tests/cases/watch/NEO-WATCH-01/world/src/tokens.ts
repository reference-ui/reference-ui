// tokens.ts — the NEO-WATCH-01 token fragment. It takes the author tokens()
// collector and emits the brand and ink colors the paint legs flip between.
// The spec edits ink's value mid-run to prove a token change repaints, then
// restores the canonical spelling in a finally.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#1a1a2e' },
  },
})
