// Brand and ink color tokens for the CORE-WATCH-15 world. The spec saves a new brand value into this file while the
// watch is still booting; the generated sheet must carry that value once the watch is ready.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#1a1a2e' },
  },
})
