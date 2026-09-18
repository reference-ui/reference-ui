// Fonts for the TOKEN-10 world. They take no input and emit the Inter sans
// family with thin, normal, and bold registry weights, the way the lib
// registers its text face. Collected once at sync.
import { font } from '@reference-ui/neo'

font('sans', {
  value: '"Inter", ui-sans-serif, sans-serif',
  fontFace: {
    src: 'url(/fonts/inter.woff2) format("woff2")',
    fontWeight: '200 900',
    fontDisplay: 'swap',
  },
  weights: { thin: '200', normal: '400', bold: '700' },
})
