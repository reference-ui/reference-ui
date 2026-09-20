// Global base for the NEO-NAMER-03 world. It takes no inputs and emits the
// body ink the miss element inherits, so the miss class reads as a painted
// resting color rather than a browser default.
import { globalCss } from '@reference-ui/neo'

globalCss({
  body: {
    color: '#111111',
  },
})
