/**
 * Layer-library token values. Single source of truth for fixture tokens.
 * Used by components (tokens()) and imported by consumers for assertions.
 */

export const lightDarkDemoBgLight = '#f8fafc'
export const lightDarkDemoBgDark = '#020617'
export const lightDarkDemoTextLight = '#020617'
export const lightDarkDemoTextDark = '#f8fafc'

/**
 * "Private" layer token — only used inside this library's own components.
 * When a consumer layers (not extends) this library, this token is NOT
 * injected into their global token namespace. Attempting to use it directly
 * on a primitive like <Div bg="layerPrivateAccent"> will NOT resolve.
 * Only components that live inside this layer (e.g. LayerPrivateDemo) can
 * reference it because they share the same CSS layer scope.
 */
export const layerPrivateAccent = '#6366f1'
export const layerPrivateAccentRgb = 'rgb(99, 102, 241)'

/** RGB forms for getComputedStyle assertions */
export const lightDarkDemoBgLightRgb = 'rgb(248, 250, 252)'
export const lightDarkDemoBgDarkRgb = 'rgb(2, 6, 23)'
export const lightDarkDemoTextLightRgb = 'rgb(2, 6, 23)'
export const lightDarkDemoTextDarkRgb = 'rgb(248, 250, 252)'
