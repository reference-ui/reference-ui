// Token fragment for the CORE-LAYERS-20 middle package, b. It takes the core token collector and emits `brand`
// with b's value. Once b extends a, this overrides a's `brand` in b's vocabulary, so b's value should paint inside
// a's components wherever b's own token values hold.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#b45309' },
  },
})
