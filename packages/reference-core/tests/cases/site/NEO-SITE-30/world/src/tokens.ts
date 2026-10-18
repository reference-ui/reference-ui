// Tokens for the NEO-SITE-30 world. It takes no inputs and emits the ring
// color leaf the selected tab's indicator names, so the extractor resolves
// the selected arm through the token table while the plain arm stays the
// `transparent` keyword. Collected once at sync.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    ring: { value: '#1d4ed8' },
  },
})
