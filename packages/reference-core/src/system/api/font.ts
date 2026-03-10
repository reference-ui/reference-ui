import { createFragmentFunction } from '../../lib/fragments/collector'

/** @font-face rule shape used by font() */
export interface FontFaceRule {
  src: string
  fontWeight?: string
  fontStyle?: string
  fontDisplay?: string
  sizeAdjust?: string
  descentOverride?: string
}

export type FontWeightName =
  | 'thin'
  | 'light'
  | 'normal'
  | 'semibold'
  | 'bold'
  | 'black'

/** Options passed to font(name, options) */
export interface FontOptions {
  value: string
  fontFace: FontFaceRule | FontFaceRule[]
  weights: Partial<Record<FontWeightName, string>>
  css?: Record<string, string>
}

/** Collected shape: one entry per font() call */
export interface FontDefinition {
  name: string
  value: string
  fontFace: FontFaceRule | FontFaceRule[]
  weights: Partial<Record<FontWeightName, string>>
  css?: Record<string, string>
}

const { fn, collector } = createFragmentFunction<FontDefinition>({
  name: 'font',
  targetFunction: 'font',
  globalKey: '__refFontCollector',
})

/**
 * Register a font with tokens, @font-face, recipe variant, and pattern support.
 * Called from fragment files; collected at config generation time.
 * Downstream consumption (Panda config, pattern merge) is wired separately.
 *
 * @example
 * ```ts
 * font('sans', {
 *   value: '"Inter", ui-sans-serif, sans-serif',
 *   fontFace: {
 *     src: 'url(/fonts/inter.woff2) format("woff2")',
 *     fontWeight: '200 900',
 *     fontDisplay: 'swap',
 *   },
 *   weights: { thin: '200', normal: '400', bold: '700' },
 *   css: { letterSpacing: '-0.01em', fontWeight: 'normal' },
 * })
 * ```
 */
export function font(name: string, options: FontOptions): void {
  fn({ name, ...options })
}

/** Compatibility alias while docs and apps migrate to font(). */
export function extendFont(name: string, options: FontOptions): void {
  font(name, options)
}

/** Used by runConfig and build/styled to collect font fragments when running fragment files. */
export function createFontCollector() {
  return collector
}
