// Tokens for the NEO-MERGE-03 world. It takes no inputs and emits the two
// spacing leaves the shorthand case paints with, so the sheet and the browser
// resolve sm and lg without reaching for any other system.
import { tokens } from '@reference-ui/neo'

tokens({
  spacing: {
    sm: { value: '0.5rem' },
    lg: { value: '1rem' },
  },
})
