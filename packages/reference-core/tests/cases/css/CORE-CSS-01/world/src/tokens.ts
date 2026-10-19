// Token fragment for the CORE-CSS-01 world. It takes the author tokens()
// collector and emits the brand and ink colors plus the sm spacing step the
// base probe consumes. The values are the fixture oracles the spec compares
// computed style against.
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
