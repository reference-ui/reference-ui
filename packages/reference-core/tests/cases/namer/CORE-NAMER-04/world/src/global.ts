// Global base for the CORE-NAMER-04 world. It takes no inputs and emits the
// body ink the miss element inherits, so the miss class reads as a painted
// resting color rather than a browser default.
import { globalCss } from '@reference-ui/core'

globalCss({
  body: {
    color: '#111111',
  },
})
