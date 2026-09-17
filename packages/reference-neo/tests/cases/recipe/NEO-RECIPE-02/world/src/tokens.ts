// Tokens for the NEO-RECIPE-02 world. It takes no inputs and emits the color
// and spacing leaves the card recipe paints with, so defaulted and explicit
// selections resolve without reaching for any other system.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#111111' },
    paper: { value: '#ffffff' },
  },
  spacing: {
    sm: { value: '0.5rem' },
    lg: { value: '2rem' },
  },
})
