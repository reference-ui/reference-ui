// Token fragment for the TOKEN-05 world: declares the colors tokens through tokens(). Takes nothing
// and emits the fragment the sync evaluates into vars the entry consumes by name.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { light: '#111111', dark: '#f5f5f5' },
  },
})
