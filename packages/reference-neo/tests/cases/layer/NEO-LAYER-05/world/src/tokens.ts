// Tokens for the LAYER-05 world. They take no input and emit the ink base
// colour, the brand override colour, and the small spacing step the size
// variant pads with. Collected once.
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
