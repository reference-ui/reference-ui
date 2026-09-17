// Tokens for the GLOBAL-12 world. They take no input and emit the muted row
// field plus the gray mixer the hover and press-ring mixes reference with
// brace paths. Collected once at sync.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    gray: {
      300: { value: '#d1d5db' },
    },
    ui: {
      table: {
        row: {
          muted: { value: '#f3f4f6' },
        },
      },
    },
  },
})
