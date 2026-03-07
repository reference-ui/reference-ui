/**
 * Internal design tokens.
 * Scaffold — contributes to panda.config via the tokens() fragment.
 */

import { tokens } from '../api/tokens'

tokens({
  colors: {
    mySpecialToken: { value: 'red' },
    brand: {
      primary: { value: '#0066cc' },
      secondary: { value: '#ff6600' },
    },
  },
  spacing: {
    r: { value: '1rem' },
    sm: { value: '0.5rem' },
    md: { value: '1rem' },
    lg: { value: '1.5rem' },
  },
  fonts: {
    sans: { value: 'ui-sans-serif, system-ui, sans-serif' },
    serif: { value: 'ui-serif, Georgia, serif' },
    mono: { value: 'ui-monospace, monospace' },
  },
  fontWeights: {
    normal: { value: '400' },
    semibold: { value: '600' },
    bold: { value: '700' },
  },
  letterSpacings: {
    tight: { value: '-0.04em' },
    normal: { value: 'normal' },
    snug: { value: '-0.01em' },
  },
})
