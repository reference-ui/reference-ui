// Token fragment for the CORE-EDGE-01 world. It takes the author tokens()
// collector and emits the brand, ink, and paper colors the pseudo-state
// probes consume. The values are the fixture oracles the spec compares
// computed style against.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#111111' },
    paper: { value: '#ffffff' },
  },
})
