// Global styles for the CORE-COND-07 world. It takes the core fragment
// collector and emits the body ink baseline, so every node the
// attribute and expanded rules do not reach paints ink by inheritance.
import { globalCss } from '@reference-ui/core'

globalCss({
  body: {
    color: '#111111',
  },
})
