// Tokens for the GLOBAL-01 world. They take no input and emit the focus-ring
// colour token the global rule references with a brace path. Collected once.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    ui: {
      focus: {
        ring: { value: '#7c3aed' },
      },
    },
  },
})
