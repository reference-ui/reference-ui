// Token fragment for the TOKEN-03 world: declares the colors tokens through tokens(). Takes nothing
// and emits the fragment the sync evaluates into vars the entry consumes by name.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    red: {
      500: { value: '#ef4444' },
    },
  },
})
