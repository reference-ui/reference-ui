// Tokens for the NEO-DIAG-38 world. It takes no inputs and emits the one
// brand leaf every diag compile resolves against, so token lookups
// behave exactly as they do in the shared repro suite.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
  },
})
