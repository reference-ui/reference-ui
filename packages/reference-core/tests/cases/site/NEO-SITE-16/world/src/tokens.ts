// Tokens for the NEO-SITE-16 world. It takes no inputs and emits the brand
// text leaf, the paper backdrop leaf, and the sm spacing step the member
// and twin panels name. Collected once at sync.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    paper: { value: '#ffffff' },
  },
  spacing: {
    sm: { value: '0.5rem' },
  },
})
