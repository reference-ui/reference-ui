// Token fragment for the PRIM-02 world. It takes the neo fragment collector
// and emits the brand and ink colors plus the sm spacing step the probes use.
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
