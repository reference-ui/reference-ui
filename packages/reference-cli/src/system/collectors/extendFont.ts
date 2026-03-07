import { createFragmentFunction } from '../../lib/fragments/collector'

export interface FontFaceRule {
  src: string
  fontWeight?: string
  fontStyle?: string
  fontDisplay?: string
  sizeAdjust?: string
  descentOverride?: string
}

export interface FontDefinition {
  name: string
  value: string
  fontFace?: FontFaceRule | FontFaceRule[]
  weights?: Record<string, string>
  css?: Record<string, string>
}

const { fn, collector } = createFragmentFunction<FontDefinition>({
  name: 'font',
  targetFunction: 'extendFont',
  globalKey: '__refFontCollector',
})

/**
 * Define a font family with weights and @font-face rules.
 * This is a user-facing API - fonts are collected during ref sync
 * and used to generate the font system.
 *
 * @example
 * ```ts
 * extendFont('sans', {
 *   value: '"Inter", ui-sans-serif, sans-serif',
 *   fontFace: {
 *     src: 'url(...) format("woff2")',
 *     fontWeight: '100 900',
 *   },
 *   weights: {
 *     thin: '200',
 *     normal: '400',
 *     bold: '700',
 *   },
 *   css: {
 *     letterSpacing: '-0.01em',
 *   },
 * })
 * ```
 */
export function extendFont(
  name: string,
  definition: Omit<FontDefinition, 'name'>,
): void {
  fn({ name, ...definition })
}

/**
 * Get the font collector for the CLI runtime.
 * @internal
 */
export function createFontCollector() {
  return collector
}
