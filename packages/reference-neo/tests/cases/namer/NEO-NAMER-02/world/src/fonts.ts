// Fonts for the NEO-NAMER-02 world. They take no input and emit the family
// scales the font macro and bare `weight` names resolve against, the way the
// lib registers Inter/Literata/JetBrains Mono. The three shipped families
// mirror `packages/reference-lib/src/core/theme/fonts.ts` so the seam pins
// (`sans.thin`→200, `serif.normal`→373, `mono.normal`→393) match the static
// `ATM-COND-05` oracle. `display` carries one off-scale weight for the
// dynamic-string boundary probe, whose value only the runtime can see.
import { font } from '@reference-ui/neo'

font('sans', {
  value: '"Inter", ui-sans-serif, sans-serif',
  fontFace: {
    src: 'url(/fonts/inter.woff2) format("woff2")',
    fontWeight: '200 900',
    fontDisplay: 'swap',
  },
  weights: {
    thin: '200',
    light: '300',
    normal: '400',
    semibold: '600',
    bold: '700',
    black: '900',
  },
})

font('serif', {
  value: '"Literata", ui-serif, serif',
  fontFace: {
    src: 'url(/fonts/literata.woff2) format("woff2")',
    fontWeight: '200 900',
    fontDisplay: 'swap',
  },
  weights: {
    thin: '100',
    light: '300',
    normal: '373',
    semibold: '600',
    bold: '700',
    black: '900',
  },
})

font('mono', {
  value: '"JetBrains Mono", ui-monospace, monospace',
  fontFace: {
    src: 'url(/fonts/jetbrainsmono.woff2) format("woff2")',
    fontWeight: '100 800',
    fontDisplay: 'swap',
  },
  weights: {
    thin: '100',
    light: '300',
    normal: '393',
    semibold: '600',
    bold: '700',
  },
})

font('display', {
  value: '"Orbitron", ui-sans-serif, sans-serif',
  fontFace: {
    src: 'url(/fonts/orbitron.woff2) format("woff2")',
    fontWeight: '100 900',
    fontDisplay: 'swap',
  },
  weights: { thin: '250' },
})
