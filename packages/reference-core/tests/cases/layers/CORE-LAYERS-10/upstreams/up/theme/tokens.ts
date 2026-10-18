// Token fragment for the CORE-LAYERS-10 layered upstream. It takes the core token collector and
// emits one ink colour, probeInk, with a dark leaf. The consumer defines a token of the same name
// with other values, so the spec proves each scope paints its own system's value.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    probeInk: { value: '#be185d', dark: '#f9a8d4' },
  },
})
