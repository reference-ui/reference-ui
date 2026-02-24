/**
 * Define a complete font system in one call.
 *
 * Registers font tokens, @font-face rules, weight tokens, recipe variants,
 * and pattern extensions. At build time, createFontSystem collects these
 * and generates styled/font/font.ts.
 *
 * @example
 * ```ts
 * font('sans', {
 *   value: '"Inter", ui-sans-serif, sans-serif',
 *   fontFace: {
 *     src: 'url(...) format("woff2")',
 *     fontWeight: '200 900',
 *     fontDisplay: 'swap',
 *   },
 *   weights: { thin: '200', normal: '400', bold: '700' },
 *   css: { letterSpacing: '-0.01em', fontWeight: 'normal' },
 * })
 * ```
 */

import type {
  FontFaceRule,
  FontWeightName,
} from '../../../cli/system/fontFace/extendFontFace'
import { extendFontCollector } from '../../../cli/system/fontFace/extendFontFace'

export type { FontFaceRule, FontWeightName }

export interface FontOptions {
  /** Font-family value - what the token resolves to */
  value: string
  /** @font-face rules - single or array for multiple variants (e.g. normal + italic) */
  fontFace: FontFaceRule | FontFaceRule[]
  /** Named font weights for this font */
  weights: Partial<Record<FontWeightName, string>>
  /** Default styles when using this font (letterSpacing, fontWeight, etc.) */
  css?: Record<string, string>
}

/**
 * Register a font with tokens, @font-face, recipe variant, and pattern support.
 * Collected at build time by createFontSystem.
 */
export function extendFont(name: string, options: FontOptions): void {
  extendFontCollector({ name, ...options })
}
