/**
 * @reference-ui/system entry
 * Build-time design system extension APIs.
 * Canonical API is tokens() only (see system/fragments.md); keyframes/globalCss
 * are re-exported for compat when fragment bundle aliases @reference-ui/cli/config here.
 */

export { tokens } from '../system/api'
export { keyframes } from '../system/panda/api/keyframes'
export { globalCss } from '../system/panda/api/globalCss'
