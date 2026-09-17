// Global styles for the NEO-COND-06 world. It takes the neo fragment
// collector and emits the body ink baseline, so every paragraph that
// the child rule does not reach paints ink by inheritance.
import { globalCss } from '@reference-ui/neo'

globalCss({
  body: {
    color: '#111111',
  },
})
