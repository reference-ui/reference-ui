// Brand and ink color tokens for the NEO-WATCH-14 world. The spec saves a new brand value into this file while the
// watch is running; the dropped batch that carries that save must still reach the generated sheet.

import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#1a1a2e' },
  },
})
