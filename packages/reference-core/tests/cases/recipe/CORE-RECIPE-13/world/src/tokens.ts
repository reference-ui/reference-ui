// Token fragment for the RECIPE-13 world: declares the colors tokens through tokens(). Takes
// nothing and emits the fragment the sync evaluates into vars the entry consumes by name.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    ink: { value: '#111111' },
    paper: { value: '#ffffff' },
    brand: { value: '#7c3aed' },
  },
})
