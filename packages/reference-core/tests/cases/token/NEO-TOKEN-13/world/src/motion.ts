// Motion for the TOKEN-13 world. It takes the neo fragment collector and
// emits the grow keyframes with token refs and rhythm steps in both arms.
// The engine resolves refs to var() and rhythm to calc inside @keyframes.
import { keyframes } from '@reference-ui/neo'

keyframes({
  grow: {
    from: { backgroundColor: '{colors.ink}', width: '4r' },
    to: { backgroundColor: '{colors.brand}', width: '8r' },
  },
})
