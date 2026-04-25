/**
 * User-space design system config for reference-unit.
 */

import { globalCss, keyframes, tokens } from '@reference-ui/system'

import './fonts'

/** Reference-unit token color (single source of truth). */
export const REFERENCE_UNIT_TOKEN_RGB = 'rgb(168, 85, 247)'
export const REFERENCE_UNIT_MODE_LIGHT_RGB = 'rgb(219, 234, 254)'
export const REFERENCE_UNIT_MODE_DARK_RGB = 'rgb(30, 41, 59)'

tokens({
  colors: {
    referenceUnitToken: { value: REFERENCE_UNIT_TOKEN_RGB },
    referenceUnitColorModeToken: {
      value: REFERENCE_UNIT_MODE_LIGHT_RGB,
      dark: REFERENCE_UNIT_MODE_DARK_RGB,
    },
  },
  radii: {
    lg: { value: '1rem' },
  },
})

globalCss({
  ':root': {
    '--ref-unit-test-var': '42px',
  },
})

keyframes({
  fadeIn: {
    from: {
      opacity: '0',
    },
    to: {
      opacity: '1',
    },
  },
})
