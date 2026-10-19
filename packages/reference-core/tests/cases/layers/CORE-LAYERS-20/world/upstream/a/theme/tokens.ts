// Token fragment for the CORE-LAYERS-20 base package, a. It takes the core token collector and emits `brand`,
// which package b and the app both redefine with other values, so the spec can tell whose value paints inside a's
// Badge at each composition.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#7e22ce' },
  },
})
