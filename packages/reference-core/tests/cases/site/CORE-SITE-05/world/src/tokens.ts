// Tokens for the CORE-SITE-05 world. It takes no inputs and emits one color
// leaf the local call names but cannot reach, so the spec proves the token
// alone mints no utility when no Reference css site exists.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    cherry: { value: '#dc2626' },
  },
})
