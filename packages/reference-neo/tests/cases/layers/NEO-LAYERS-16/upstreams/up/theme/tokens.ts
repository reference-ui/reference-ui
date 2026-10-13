// Token fragment for the NEO-LAYERS-16 layered upstream. It takes the neo token collector and emits
// one ink colour, upInk. Under layers the token reaches the cascade but never the consumer's typed
// vocabulary, which is the boundary the spec checks against strict colours.

import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    upInk: { value: '#be185d' },
  },
})
