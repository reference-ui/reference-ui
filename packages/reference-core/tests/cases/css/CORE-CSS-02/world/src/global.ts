// Global stylesheet for the CORE-CSS-02 world. It takes the author globalCss()
// collector and emits a single body color rule. It pins the unlayered global
// floor the responsive probes paint above.
import { globalCss } from '@reference-ui/core'

globalCss({
  body: {
    color: '#111111',
  },
})
