// Tokens for the NEO-SITE-17 world. It takes no inputs and emits the two
// color leaves the divider ternary names — ink for the dark arm the runtime
// picks by default, mist for the light arm — plus the md spacing step the
// divider pads with. Collected once at sync.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    ink: { value: '#1f2937' },
    mist: { value: '#e5e7eb' },
  },
  spacing: {
    md: { value: '1rem' },
  },
})
