// Global styles for the NEO-COND-08 world. It takes the neo fragment
// collector and emits the body ink baseline, so the quote paragraph
// paints ink wherever the hover and pseudo-element rules do not reach.
import { globalCss } from '@reference-ui/neo'

globalCss({
  body: {
    color: '#111111',
  },
})
