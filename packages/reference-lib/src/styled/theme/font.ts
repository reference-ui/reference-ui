import { font } from '@reference-ui/system'
import { REF_LIB_FONT_FAMILY } from '../../colors.js'

font('refLibSans', {
  value: `"${REF_LIB_FONT_FAMILY}", ui-sans-serif, sans-serif`,
  fontFace: {
    src: 'url(/fonts/ref-lib-sans.woff2) format("woff2")',
    fontWeight: '400 700',
    fontDisplay: 'swap',
  },
  weights: {
    normal: '400',
    bold: '700',
  },
  css: {
    letterSpacing: '-0.015em',
  },
})
