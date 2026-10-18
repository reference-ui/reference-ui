// Keyframes fragment for the CORE-LAYERS-08 layered upstream. It defines one named
// animation, which the layer's global block must carry exactly once.

import { keyframes } from '@reference-ui/core'

keyframes({
  upPulse: {
    '0%': { opacity: '0.25' },
    '100%': { opacity: '1' },
  },
})
