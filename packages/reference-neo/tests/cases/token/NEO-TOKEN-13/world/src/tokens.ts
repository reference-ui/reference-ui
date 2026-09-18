// Tokens for the TOKEN-13 world. It takes the neo fragment collector and
// emits the ink/brand leaves the keyframes reference plus one animation
// token whose negative-delay shorthand holds the end state on first paint.
// The probe consumes the animation token by name through css().
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    ink: { value: '#111111' },
    brand: { value: '#7c3aed' },
  },
  animations: {
    grow: {
      once: { value: 'grow 1s linear -1s forwards' },
    },
  },
})
