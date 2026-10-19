// Token fragment for the PRIM-07 world: declares the colors tokens through tokens(). Takes nothing
// and emits the fragment the sync evaluates into vars the entry consumes by name.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    ink: { value: '#111111', dark: '#f5f5f5' },
    brand: { value: '#7c3aed' },
    paper: { value: '#ffffff' },
  },
})
