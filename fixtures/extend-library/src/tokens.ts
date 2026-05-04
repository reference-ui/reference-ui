/**
 * Extend-library token values. Single source of truth for fixture tokens.
 * Used by components (tokens()) and imported by consumers for assertions.
 */

export const fixtureDemoBg = '#0f172a'
export const fixtureDemoText = '#f8fafc'
export const fixtureDemoAccent = '#14b8a6'

/**
 * Private token. Visible inside extend-library (e.g. resolved by DemoComponent
 * styles) but stripped from any downstream package that pulls extend-library
 * via `extends`. Hidden from the MCP token surface.
 */
export const fixtureDemoPrivateBrand = '#FF00FF'

export const lightDarkDemoBgLight = '#f8fafc'
export const lightDarkDemoBgDark = '#020617'
export const lightDarkDemoTextLight = '#020617'
export const lightDarkDemoTextDark = '#f8fafc'

/** RGB forms for getComputedStyle assertions */
export const fixtureDemoBgRgb = 'rgb(15, 23, 42)'
export const fixtureDemoTextRgb = 'rgb(248, 250, 252)'
export const fixtureDemoAccentRgb = 'rgb(20, 184, 166)'
export const fixtureDemoPrivateBrandRgb = 'rgb(255, 0, 255)'
export const lightDarkDemoBgLightRgb = 'rgb(248, 250, 252)'
export const lightDarkDemoBgDarkRgb = 'rgb(2, 6, 23)'
export const lightDarkDemoTextLightRgb = 'rgb(2, 6, 23)'
export const lightDarkDemoTextDarkRgb = 'rgb(248, 250, 252)'
