// Token fragment for the RECIPE-01 world: declares the colors, spacing tokens through tokens().
// Takes nothing and emits the fragment the sync evaluates into vars the entry consumes by name.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#111111' },
    paper: { value: '#ffffff' },
  },
  spacing: {
    sm: { value: '0.5rem' },
    lg: { value: '2rem' },
  },
})
