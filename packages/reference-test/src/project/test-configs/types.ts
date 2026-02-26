/**
 * Test configuration types.
 * Standard token/font/keyframe configs for ui.config.ts fixtures.
 */

/** Minimal token config for MVP */
export interface MinimalTokenConfig {
  colors: Record<string, { value: string }>
  spacing?: Record<string, { value: string }>
}

/** Font config for testing font-family generation */
export interface FontConfig {
  fontFamily: Record<string, { value: string }>
  fontWeight?: Record<string, { value: string }>
}

/** Keyframe config for animation testing */
export interface KeyframeConfig {
  keyframes: Record<string, { value: Record<string, Record<string, string>> }>
}
