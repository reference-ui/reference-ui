// Tokens for the TOKEN-09 world. It takes the neo fragment collector and
// emits a package-private secret the owner-world probes resolve by name.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    _private: {
      secret: { value: '#ff00ff' },
    },
    brand: { value: '#7c3aed' },
  },
})
