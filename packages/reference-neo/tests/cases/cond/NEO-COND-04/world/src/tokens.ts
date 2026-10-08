// Tokens for the NEO-COND-04 world. It takes no inputs and emits the three
// color leaves the color-mode case paints with, so the sheet and the browser
// resolve brand, ink, and paper without reaching for any other system.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#111111' },
    paper: { value: '#ffffff' },
  },
})
