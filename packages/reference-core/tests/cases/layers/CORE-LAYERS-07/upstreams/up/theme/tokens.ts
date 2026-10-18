// Token fragment for the CORE-LAYERS-07 layered upstream. It defines one token in
// each category the consumer names: a colour, a spacing step, a radius, a font
// family and a font size. The consumer must never resolve any of them under layers.

import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    upInk: { value: '#be185d' },
  },
  spacing: {
    upGap: { value: '13px' },
  },
  radii: {
    upRadius: { value: '9px' },
  },
  fonts: {
    upFont: { value: 'Georgia, serif' },
  },
  fontSizes: {
    upSize: { value: '21px' },
  },
})
