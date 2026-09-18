// Tokens for the TOKEN-11 world. It takes the neo fragment collector and
// emits one animation token whose value names the fadeIn keyframes.
// The probe consumes this token by name through the animation property.
import { tokens } from '@reference-ui/neo'

tokens({
  animations: {
    fade: {
      quick: { value: 'fadeIn 0.2s ease-out' },
    },
  },
})
