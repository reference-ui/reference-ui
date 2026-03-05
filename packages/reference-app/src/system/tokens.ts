/**
 * User-space design tokens for reference-app.
 * These are collected by ref sync and merged into the generated Panda config.
 */

import { tokens } from '@reference-ui/system'

/** Reference-app token color (single source of truth). */
export const REFERENCE_APP_TOKEN_RGB = 'rgb(168, 85, 247)'

tokens({
  colors: {
    referenceAppToken: { value: REFERENCE_APP_TOKEN_RGB },
  },
})
