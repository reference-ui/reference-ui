import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    red: {
      500: { value: '#ef4444' },
    },
    danger: { value: '{colors.red.500}' },
    critical: { value: '{colors.danger}' },
  },
})
