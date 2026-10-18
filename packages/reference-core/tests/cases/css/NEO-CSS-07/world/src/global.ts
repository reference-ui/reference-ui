// Global base for the NEO-CSS-07 world. It takes no inputs and emits the
// body ink the color-mix probe resolves currentColor against, so the
// translucent mix reads as a painted background rather than a default.
import { globalCss } from '@reference-ui/neo'

globalCss({
  body: {
    color: '#111111',
  },
})
