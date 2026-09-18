// Tokens for the GLOBAL-07 world. They take no input and emit the three
// at-rule colours the nested declarations reference with brace paths.
// Collected once at sync.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    ui: {
      note: {
        match: { value: '#7c3aed' },
        far: { value: '#dc2626' },
        wide: { value: '#3b82f6' },
      },
    },
  },
})
