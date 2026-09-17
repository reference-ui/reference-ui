// Fonts for the GLOBAL-08 world. They take no input and emit the two lib
// metric-override faces in local-URL form: serif with a two-entry src list
// plus both overrides, mono with size-adjust only. Mirrors the Literata and
// JetBrains Mono entries in the lib fonts file. Collected once at sync.
import { font } from '@reference-ui/neo'

font('serif', {
  value: '"Literata", ui-serif, serif',
  fontFace: {
    src: 'url(/fonts/literata.woff2) format("woff2"), url(/fonts/literata.woff) format("woff")',
    fontWeight: '200 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    sizeAdjust: '104%',
    descentOverride: '47%',
  },
  weights: { normal: '373', bold: '700' },
})

font('mono', {
  value: '"JetBrains Mono", ui-monospace, monospace',
  fontFace: {
    src: 'url(/fonts/jetbrains-mono.woff2) format("woff2")',
    fontWeight: '100 800',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    sizeAdjust: '101%',
  },
  weights: { normal: '393', bold: '700' },
})
