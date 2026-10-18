// Tokens for the TOKEN-09 world. It takes the core fragment collector and
// emits a package-private secret the owner-world probes resolve by name.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    _private: {
      secret: { value: '#ff00ff' },
    },
    brand: { value: '#7c3aed' },
  },
})
