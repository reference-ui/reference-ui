// Tokens for the NEO-GLOBAL-13 world. It takes no inputs and emits the ink
// text leaf, the nested focus ring leaf, and the md radius step the card
// rule names with bare spellings. Collected once at sync.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    ink: { value: '#111111' },
    ui: {
      focus: {
        ring: { value: '#0066ff' },
      },
    },
  },
  radii: {
    md: { value: '0.375rem' },
  },
})
