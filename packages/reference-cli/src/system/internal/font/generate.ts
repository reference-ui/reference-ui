/**
 * Font system generator
 * 
 * Generates font tokens, @font-face rules, recipes, and patterns
 * from user font definitions collected during ref sync.
 */

import type { FontDefinition } from '../../api/font'
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

  // TODO: Implement Liquid template rendering
  // For now, return placeholders
  return {
    tokens: generateTokens(fonts),
    fontface: generateFontface(fonts),
    recipe: generateRecipe(fonts),
    pattern: generatePattern(fonts),
  }
}

function generateTokens(fonts: FontDefinition[]): string {
  // TODO: Use Liquid template
  return `// Font tokens for ${fonts.length} fonts\n`
}

function generateFontface(fonts: FontDefinition[]): string {
  // TODO: Use Liquid template
  return `// @font-face rules for ${fonts.length} fonts\n`
}

function generateRecipe(fonts: FontDefinition[]): string {
  // TODO: Use Liquid template
  return `// Font recipe for ${fonts.length} fonts\n`
}

function generatePattern(fonts: FontDefinition[]): string {
  // TODO: Use Liquid template
  return `// Font pattern for ${fonts.length} fonts\n`
}
