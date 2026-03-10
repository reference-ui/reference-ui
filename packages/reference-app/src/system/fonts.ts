import { font } from '@reference-ui/system'

font('sans', {
  value: '"Inter", ui-sans-serif, sans-serif',
  fontFace: {
    src: 'url(/fonts/inter.woff2) format("woff2")',
    fontWeight: '200 900',
    fontDisplay: 'swap',
  },
  weights: {
    normal: '400',
    bold: '700',
  },
  css: {
    letterSpacing: '-0.01em',
  },
})
