// Tokens for the CORE-RECIPE-08 world. It takes no inputs and emits the color
// leaves the swatch recipe paints with, so the solid and outline variants
// resolve without reaching for any other system.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#111111' },
    paper: { value: '#ffffff' },
  },
})
