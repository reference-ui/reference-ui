// Token fragment for the PRIM-08 world. It takes the core fragment collector
// and emits the brand color and sm spacing the passthrough probe paints.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
  },
  spacing: {
    sm: { value: '0.5rem' },
  },
})
