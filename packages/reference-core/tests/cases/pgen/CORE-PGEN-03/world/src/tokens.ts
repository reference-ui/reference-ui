// Token fragment for the PGEN-03 world. It takes the core fragment collector
// and emits the brand color the form probes paint, plus the spacing scale
// the worlds share.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#111111' },
  },
  spacing: {
    sm: { value: '0.5rem' },
  },
})
