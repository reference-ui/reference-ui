// Fonts for the CSS-10 world. They take no input and emit the sans family
// the font macro names, the way the lib registers Inter. Collected once at sync.
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
