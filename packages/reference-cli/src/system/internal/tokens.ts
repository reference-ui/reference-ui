/**
 * Internal design tokens.
 * Scaffold — contributes to panda.config via the tokens() fragment.
 */

import { tokens } from '../api/tokens'

tokens({
  colors: {
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
})
