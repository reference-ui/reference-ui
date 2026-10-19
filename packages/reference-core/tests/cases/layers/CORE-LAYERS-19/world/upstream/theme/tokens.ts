// Token fragment for the CORE-LAYERS-19 upstream package, acme. It takes the core token collector and emits
// three colours, each with a dark leaf: `brand`, which the app defines too with other values; `acmeOnly`, a
// public token only acme defines; and `_private.seal`, which no consumer ever sees. The spec reads which value
// each one paints inside acme's components under extends and under layers.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#be185d', dark: '#f9a8d4' },
    acmeOnly: { value: '#1d4ed8', dark: '#93c5fd' },
    _private: {
      seal: { value: '#7c3aed', dark: '#c4b5fd' },
    },
  },
})
