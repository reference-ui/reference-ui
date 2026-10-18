// Font fragment for the NEO-LAYERS-08 layered upstream. It registers one serif face
// with a @font-face rule, which the layer's global block must carry exactly once.

import { font } from '@reference-ui/neo'

font('upSerif', {
  value: '"Literata", ui-serif, serif',
  fontFace: {
    src: 'url(/fonts/up-literata.woff2) format("woff2")',
    fontWeight: '200 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
  },
  weights: { normal: '400', bold: '700' },
})
