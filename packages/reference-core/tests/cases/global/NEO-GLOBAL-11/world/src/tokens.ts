// Tokens for the GLOBAL-11 world. They take no input and emit the thumb blue
// plus the file-button ink and field the vendor rules reference with brace
// paths. Collected once at sync.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    ui: {
      progress: {
        bar: {
          foreground: { value: '#2563eb' },
        },
      },
      file: {
        button: { value: '#f8fafc' },
        field: { value: '#0f172a' },
      },
    },
  },
})
