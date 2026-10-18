// Fonts for the GLOBAL-02 world. They take no input and emit the sans family the
// body rule names, the way the lib registers Inter. Collected once at sync.
import { font } from '@reference-ui/neo'

font('sans', {
  value: '"Inter", ui-sans-serif, sans-serif',
  fontFace: {
    src: 'url(/fonts/inter.woff2) format("woff2")',
    fontWeight: '200 900',
    fontDisplay: 'swap',
  },
  weights: { normal: '400', bold: '700' },
})
