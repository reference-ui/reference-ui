// Global styles for the CORE-COND-08 world. It takes the core fragment
// collector and emits the body ink baseline, so the quote paragraph
// paints ink wherever the hover and pseudo-element rules do not reach.
import { globalCss } from '@reference-ui/core'

globalCss({
  body: {
    color: '#111111',
  },
})
