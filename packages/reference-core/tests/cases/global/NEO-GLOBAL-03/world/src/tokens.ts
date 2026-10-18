// Tokens for the GLOBAL-03 world. They take no input and emit the disabled,
// hover, and focus colours the button twins reference. Collected once.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    ui: {
      button: {
        disabled: {
          foreground: { value: '#6b7280' },
          background: { value: '#e5e7eb' },
        },
      },
      field: {
        borderHover: { value: '#3b82f6' },
      },
      focus: {
        ring: { value: '#7c3aed' },
      },
    },
  },
})
