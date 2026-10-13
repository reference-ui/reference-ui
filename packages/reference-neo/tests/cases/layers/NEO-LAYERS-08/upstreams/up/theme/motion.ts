// Keyframes fragment for the NEO-LAYERS-08 layered upstream. It defines one named
// animation, which the layer's global block must carry exactly once.

import { keyframes } from '@reference-ui/neo'

keyframes({
  upPulse: {
    '0%': { opacity: '0.25' },
    '100%': { opacity: '1' },
  },
})
