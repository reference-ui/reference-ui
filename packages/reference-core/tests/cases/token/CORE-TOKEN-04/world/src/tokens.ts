// Token fragment for the TOKEN-04 world: declares the colors tokens through tokens(). Takes nothing
// and emits the fragment the sync evaluates into vars the entry consumes by name.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    pink: {
      400: { value: '#f472b6' },
    },
  },
})
