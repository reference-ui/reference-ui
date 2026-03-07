/**
 * User-space design system config for reference-app.
 * tokens() from @reference-ui/system (see system/fragments.md).
 */

import { tokens } from '@reference-ui/system'

import './fonts'

/** Reference-app token color (single source of truth). */
export const REFERENCE_APP_TOKEN_RGB = 'rgb(168, 85, 247)'

tokens({
  colors: {
    referenceAppToken: { value: REFERENCE_APP_TOKEN_RGB },
  },
})
