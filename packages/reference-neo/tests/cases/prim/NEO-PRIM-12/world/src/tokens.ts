// Tokens for the NEO-PRIM-12 world. It takes no inputs and emits the brand
// color plus the sm spacing step, so the foreign-rendered Div resolves both
// its style props without reaching for any other system.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#111111' },
  },
  spacing: {
    sm: { value: '0.5rem' },
  },
})
