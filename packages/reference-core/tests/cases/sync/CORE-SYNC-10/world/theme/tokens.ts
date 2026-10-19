// Token fragment for the SYNC-10 world: declares the colors tokens through tokens(). Takes nothing
// and emits the fragment the sync evaluates into vars the entry consumes by name.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    shared: { value: '#222222' },
  },
})
