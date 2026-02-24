/**
 * Internal: collect font definitions from font() calls.
 *
 * Each font() call in styled/font/ registers here. At build time,
 * createFontSystem collects these and generates font.ts.
 */

export const FONT_COLLECTOR_KEY = '__fontCollector'

export interface FontFaceRule {
  src: string
  fontWeight?: string
  fontStyle?: string
  fontDisplay?: string
  sizeAdjust?: string
  descentOverride?: string
}

export type FontWeightName = 'thin' | 'light' | 'normal' | 'semibold' | 'bold' | 'black'

export interface FontDefinition {
  name: string
  value: string
  fontFace: FontFaceRule | FontFaceRule[]
  weights: Partial<Record<FontWeightName, string>>
  css?: Record<string, string>
}

if (!(globalThis as Record<string, unknown>)[FONT_COLLECTOR_KEY]) {
  ;(globalThis as Record<string, unknown>)[FONT_COLLECTOR_KEY] = []
}

export function extendFontCollector(def: FontDefinition): void {
  const collector = (globalThis as Record<string, unknown>)[
    FONT_COLLECTOR_KEY
  ] as FontDefinition[]
  collector.push(def)
}

export function getFontDefinitions(): FontDefinition[] {
  return (
    ((globalThis as Record<string, unknown>)[FONT_COLLECTOR_KEY] as FontDefinition[]) ||
    []
  )
}
