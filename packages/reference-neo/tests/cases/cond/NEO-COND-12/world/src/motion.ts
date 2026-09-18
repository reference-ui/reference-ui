// Motion for the NEO-COND-12 world. It takes no inputs and emits the one
// spin keyframe the motion case animates with, so the base animation
// names a real keyframe while the reduced-motion arm names none at all.
import { keyframes } from '@reference-ui/neo'

keyframes({
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
})
