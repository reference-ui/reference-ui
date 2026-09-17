// Tokens for the TOKEN-12 world. It takes the neo fragment collector and
// emits the two named spacing tokens the multi-ref padding resolves to.
// Plain values keep the claim on ref expansion, not on rhythm sugar.
import { tokens } from '@reference-ui/neo'

tokens({
  spacing: {
    '1r': { value: '0.25rem' },
    '2r': { value: '0.5rem' },
  },
})
