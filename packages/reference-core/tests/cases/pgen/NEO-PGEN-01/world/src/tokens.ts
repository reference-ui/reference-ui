// Token fragment for the PGEN-01 world. It takes the neo fragment collector
// and emits the brand and ink colors the flow probes paint their two style
// paths from, plus the spacing scale the worlds share.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#111111' },
  },
  spacing: {
    sm: { value: '0.5rem' },
  },
})
