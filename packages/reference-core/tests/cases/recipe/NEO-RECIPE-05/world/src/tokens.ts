// Tokens for the NEO-RECIPE-05 world. It takes no inputs and emits the color
// and spacing leaves the panel recipe paints with, so class-fed and raw-fed
// nodes resolve the same tokens without reaching for any other system.
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
