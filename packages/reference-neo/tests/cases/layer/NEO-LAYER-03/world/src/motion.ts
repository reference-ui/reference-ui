// Motion and type for the LAYER-03 world. They take no input and emit one
// fadeSlide keyframe with literal bodies plus the display family the way
// the lib registers Inter. Collected once at sync.
import { font, keyframes } from '@reference-ui/neo'

keyframes({
  fadeSlide: {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
})

font('display', {
  value: '"Display", ui-sans-serif, sans-serif',
  fontFace: {
    src: 'url(/fonts/display.woff2) format("woff2")',
    fontWeight: '400 700',
    fontDisplay: 'swap',
  },
  weights: { normal: '400', bold: '700' },
})
