/** Public API for styled system extensions */

// Runtime APIs (browser-safe)
export * from './runtime'

// Build-time config extension APIs
export { extendTokens } from './internal/extendTokens'
export { extendRecipe, extendSlotRecipe } from './internal/extendRecipe'
export { extendUtilities } from './internal/extendUtilities'
export { extendGlobalCss } from './internal/extendGlobalCss'
export { extendStaticCss } from './internal/extendStaticCss'
export { extendGlobalFontface } from './internal/extendGlobalFontface'
export { extendFont } from './internal/extendFont'
export { extendKeyframes } from './internal/extendKeyframes'
export { extendPattern } from './internal/extendPattern'
