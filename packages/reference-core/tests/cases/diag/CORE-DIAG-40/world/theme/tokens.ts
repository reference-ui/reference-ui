// Tokens for the CORE-DIAG-40 world. It takes no inputs and emits the one
// brand leaf every diag compile resolves against, so token lookups
// behave exactly as they do in the shared repro suite.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
  },
})
