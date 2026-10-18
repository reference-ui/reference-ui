// Fonts for the PARITY-01 mini-lib world. They take no input and emit the one
// sans family the body rule and the font-macro probes consume. The two-entry
// fontFace array prints the style-distinguished normal and italic faces the
// way the lib faces do (P8, matrix font G8 shape); both carry the
// size-adjust extra. Collected once at sync.
import { font } from '@reference-ui/neo'

font('sans', {
  value: '"Inter", ui-sans-serif, sans-serif',
  fontFace: [
    {
      src: 'url(/fonts/inter.woff2) format("woff2")',
      fontWeight: '200 900',
      fontStyle: 'normal',
      fontDisplay: 'swap',
      sizeAdjust: '104%',
    },
    {
      src: 'url(/fonts/inter-italic.woff2) format("woff2")',
      fontWeight: '200 900',
      fontStyle: 'italic',
      fontDisplay: 'swap',
      sizeAdjust: '104%',
    },
  ],
  weights: { normal: '400', bold: '700' },
})
