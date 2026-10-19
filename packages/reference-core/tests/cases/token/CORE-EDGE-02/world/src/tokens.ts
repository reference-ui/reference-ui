// Token fragment for the EDGE-02 world: declares the radii tokens through tokens(). Takes nothing
// and emits the fragment the sync evaluates into vars the entry consumes by name.
import { tokens } from '@reference-ui/core'

tokens({
  radii: {
    md: { value: '12px' },
    full: { value: '9999px' },
  },
})
