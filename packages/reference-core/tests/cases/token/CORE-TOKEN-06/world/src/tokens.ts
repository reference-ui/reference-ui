// Token fragment for the TOKEN-06 world: declares the colors tokens through tokens(). Takes nothing
// and emits the fragment the sync evaluates into vars the entry consumes by name.
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
