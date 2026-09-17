// Fonts for the PARITY-01 mini-lib world. They take no input and emit the one
// sans family the body rule and the font-macro probes consume. The single
// fontFace object carries a size-adjust extra the way the lib faces do
// (GLOBAL-08 shape); the two-entry array form is RS-24 (the engine schema
// takes one face, so P8 cites blocked). Collected once at sync.
import { font } from '@reference-ui/neo'

font('sans', {
  value: '"Inter", ui-sans-serif, sans-serif',
  fontFace: {
    src: 'url(/fonts/inter.woff2) format("woff2")',
    fontWeight: '200 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    sizeAdjust: '104%',
  },
  weights: { normal: '400', bold: '700' },
})
