import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    red: {
      500: { value: '#ef4444' },
    },
    danger: { value: '{colors.red.500}' },
    critical: { value: '{colors.danger}' },
  },
})
