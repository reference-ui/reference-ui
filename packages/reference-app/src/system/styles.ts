/**
 * User-space design system config for reference-app.
 * All from @reference-ui/system (tokens is canonical API; keyframes/globalCss compat — see fragments.md).
 */

import { tokens, keyframes, globalCss } from '@reference-ui/system'

// Import font definitions
import './fonts'

/** Reference-app token color (single source of truth). */
export const REFERENCE_APP_TOKEN_RGB = 'rgb(168, 85, 247)'

tokens({
  colors: {
    referenceAppToken: { value: REFERENCE_APP_TOKEN_RGB },
  },
})

keyframes({
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
})

globalCss({
  ':root': {
    '--ref-app-test-var': '42px',
  },
})
