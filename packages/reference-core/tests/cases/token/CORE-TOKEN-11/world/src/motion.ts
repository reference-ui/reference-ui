// Motion for the TOKEN-11 world. It takes the core fragment collector and
// emits the fadeIn keyframes the animation token references by name.
// The engine prints these as @keyframes inside @layer global.
import { keyframes } from '@reference-ui/core'

keyframes({
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
})
