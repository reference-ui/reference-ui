// Global rules for the CORE-LAYERS-08 layered upstream. It takes literal values only, so
// the rules print verbatim: one probe selector the consumer also styles, and one selector
// only the layer styles, so the spec can prove both the own-wins and the layer-paints legs.

import { globalCss } from '@reference-ui/core'

globalCss({
  '.up-probe': {
    color: '#be185d',
  },
  '.up-only': {
    color: '#0f766e',
  },
})
