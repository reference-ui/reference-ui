import type { FontDefinition } from '../../api/font'

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
