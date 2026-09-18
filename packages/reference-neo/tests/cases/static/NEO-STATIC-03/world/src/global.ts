// Global base for the NEO-STATIC-03 world. It takes no inputs and emits the
// body ink the classless miss element inherits, so the empty class string
// reads as a painted resting color rather than a browser default.
import { globalCss } from '@reference-ui/neo'

globalCss({
  body: {
    color: '#111111',
  },
})
