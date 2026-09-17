// Token fragment for the PRIM-09 world. It takes the neo fragment collector
// and emits the brand color and sm spacing every prim world declares. The
// census probes carry no style props, so these tokens mint no utilities.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
  },
  spacing: {
    sm: { value: '0.5rem' },
  },
})
