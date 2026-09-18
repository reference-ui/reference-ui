// Fonts for the NEO-GLOBAL-13 world. It takes no inputs and emits the sans
// family stack the body rule names bare. Collected once at sync.
import { font } from '@reference-ui/neo'

font('sans', {
  value: '"Inter", sans-serif',
  fontFace: {
    src: 'url(/fonts/inter.woff2) format("woff2")',
    fontWeight: '100 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
  },
  weights: { normal: '400', bold: '700' },
})
