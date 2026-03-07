/**
 * Font system generator
 * 
 * Generates font tokens, @font-face rules, recipes, and patterns
 * from user font definitions collected during ref sync.
 */

import type { FontDefinition } from '../../collectors/extendFont'
import type { FontSystemOutput, ParsedFontFamily } from './types'

/**
 * Parse font family name from font value string
 * e.g., '"Inter", ui-sans-serif, sans-serif' -> { key: 'Inter', quoted: true }
 */
export function parseFontFamily(value: string): ParsedFontFamily {
  const match = value.match(/^["']([^"']+)["']/)
  if (match) {
    const name = match[1]
    return {
      key: name.includes(' ') ? `"${name}"` : name,
      quoted: true,
    }
  }
  const fallback = value.split(',')[0]?.trim() ?? 'unknown'
  return { key: fallback, quoted: false }
}

/**
 * Generate font system code from font definitions
 * 
 * This will eventually use Liquid templates, but for now returns
 * empty strings as a placeholder.
 * 
 * @param fonts - Array of font definitions collected from user code
 * @returns Generated code for tokens, fontface, recipe, and pattern
 */
export function generateFontSystem(fonts: FontDefinition[]): FontSystemOutput {
  if (fonts.length === 0) {
    return {
      tokens: '',
      fontface: '',
      recipe: '',
      pattern: '',
    }
  }

  return {
    tokens: '',
    fontface: '',
    recipe: '',
    pattern: '',
  }
}
