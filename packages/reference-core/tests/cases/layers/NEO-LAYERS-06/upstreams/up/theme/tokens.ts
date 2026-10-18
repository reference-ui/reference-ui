// Token fragment for the NEO-LAYERS-06 upstream. It takes the author tokens()
// collector and emits one ink colour that the upstream utility paints. The spec
// edits that ink's value mid-run to prove a re-sync lands it in the consumer.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    upInk: { value: '#be185d' },
  },
})
