/**
 * Font definition shape (was from extendFont collector; collector removed per fragments.md).
 */
export interface FontDefinition {
  name: string
  value: string
  fontFace?: {
    src: string
    fontWeight?: string
    fontStyle?: string
    fontDisplay?: string
    sizeAdjust?: string
    descentOverride?: string
  } | Array<{
    src: string
    fontWeight?: string
    fontStyle?: string
    fontDisplay?: string
    sizeAdjust?: string
    descentOverride?: string
  }>
  weights?: Record<string, string>
  css?: Record<string, string>
}

/**
 * Context object passed to Liquid templates for font generation
 */
export interface FontGenerationContext {
  fonts: FontDefinition[]
}

/**
 * Generated font system output
 */
export interface FontSystemOutput {
  tokens: string
  fontface: string
  recipe: string
  pattern: string
}

/**
 * Font family key parsed from font value
 */
export interface ParsedFontFamily {
  key: string
  quoted: boolean
}
