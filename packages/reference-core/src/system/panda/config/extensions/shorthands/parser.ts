import { resolveRhythm } from '../rhythm/helpers'
import { resolveColorToken } from '../color/utilities'

export const CSS_GLOBAL_KEYWORDS = new Set([
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
])

export const BORDER_STYLES = new Set([
  'none',
  'hidden',
  'dotted',
  'dashed',
  'solid',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
])

/**
 * CSS Basic User Interface Module Level 4 § 3.1:
 * outline-style accepts `auto | <'border-style'>`
 */
export const OUTLINE_STYLES = new Set([
  ...BORDER_STYLES,
  'auto',
])

export function isGlobalCssKeyword(val: string): boolean {
  return CSS_GLOBAL_KEYWORDS.has(val.trim().toLowerCase())
}

export function isBorderStyle(val: string): boolean {
  return BORDER_STYLES.has(val.trim().toLowerCase())
}

export function isOutlineStyle(val: string): boolean {
  return OUTLINE_STYLES.has(val.trim().toLowerCase())
}

export function isLengthWidth(val: string): boolean {
  const lower = val.trim().toLowerCase()
  // Bare rhythm unit (r, +r, -r)
  if (lower === 'r' || lower === '+r' || lower === '-r') {
    return true
  }
  // Units with leading digit or decimal (e.g. 1px, 0.5rem, .5px, 2r)
  if (/^(\d+(\.\d+)?|\.\d+)(px|rem|em|r|%|vh|vw|ch|vmin|vmax|cqw|cqh|pt|pc|ex|dvh|lvh|svh)$/.test(lower)) {
    return true
  }
  // Rhythm fractions (e.g. 1/2r, 2/3r, -1/2r)
  if (/^[-+]?(\d+(\.\d+)?|\.\d+)\/[-+]?(\d+(\.\d+)?|\.\d+)r$/.test(lower)) {
    return true
  }
  // CSS line-width keywords
  if (lower === 'thin' || lower === 'medium' || lower === 'thick') {
    return true
  }
  // Unitless numbers (e.g. 0, 1, 2.5, .5)
  if (/^(\d+(\.\d+)?|\.\d+)$/.test(lower)) {
    return true
  }
  // CSS math functions (e.g. calc(...), min(...), max(...), clamp(...))
  if (/^(calc|min|max|clamp)\(/i.test(lower) && lower.endsWith(')')) {
    return true
  }
  return false
}

export function resolveWidth(val: string): string {
  const trimmed = val.trim()
  const lower = trimmed.toLowerCase()
  if (lower === 'r' || lower === '+r') {
    return 'var(--spacing-root)'
  }
  if (lower === '-r') {
    return 'calc(-1 * var(--spacing-root))'
  }
  if (trimmed.endsWith('r')) {
    return String(resolveRhythm(trimmed))
  }
  if (/^(\d+(\.\d+)?|\.\d+)$/.test(trimmed)) {
    return `${trimmed}px`
  }
  return trimmed
}

export function splitShorthandTokens(str: string): string[] {
  const tokens: string[] = []
  let current = ''
  let depth = 0

  for (const char of str.trim()) {
    if (char === '(') depth++
    else if (char === ')') depth--

    if (/\s/.test(char) && depth === 0) {
      if (current) {
        tokens.push(current)
        current = ''
      }
    } else {
      current += char
    }
  }

  if (current) {
    tokens.push(current)
  }

  return tokens
}

export function isWholeShorthandValue(val: string): boolean {
  const trimmed = val.trim().toLowerCase()
  if (isGlobalCssKeyword(trimmed)) return true
  if (trimmed.startsWith('var(') && trimmed.endsWith(')')) return true
  if (trimmed.startsWith('borders.') || trimmed.startsWith('outlines.')) return true
  return false
}

export interface ParsedShorthand {
  width?: string
  style?: string
  color?: string
}

export function parseShorthandTokens(
  tokens: string[],
  options?: { isOutline?: boolean }
): ParsedShorthand {
  let width: string | undefined
  let style: string | undefined
  let color: string | undefined
  const isStyle = options?.isOutline ? isOutlineStyle : isBorderStyle

  for (const t of tokens) {
    const lower = t.toLowerCase()
    if (isStyle(lower)) {
      if (!style) {
        style = lower
      }
    } else if (isLengthWidth(t)) {
      if (!width) {
        width = resolveWidth(t)
      }
    } else if (!color) {
      color = t
    }
  }

  return { width, style, color }
}

export interface TransformContext {
  token: (path: string) => string | undefined
  raw?: unknown
  utils?: {
    colorMix?: (val: unknown) => { invalid: boolean; value: string; color: string }
  }
}

export function resolveShorthandColor(color: string, args: TransformContext): string {
  if (color.includes('/') && args?.utils?.colorMix) {
    const normalized = color.startsWith('colors.') ? color.slice(7) : color
    const mix = args.utils.colorMix(normalized)
    if (mix && !mix.invalid) {
      return mix.value
    }
  }

  const resolved = resolveColorToken(color, args)
  return typeof resolved === 'string' ? resolved : color
}
