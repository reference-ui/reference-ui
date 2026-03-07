/**
 * Font prop: Apply font family and weight presets
 */

import { extendPattern } from '../../api/patterns'

export interface FontProps {
  font?: 'sans' | 'serif' | 'mono'
  weight?: string
}

extendPattern({
  properties: {
    font: { type: 'string' },
    weight: { type: 'string' },
  },
  transform(props: Record<string, unknown>) {
    const { font, weight } = props

    const FONT_PRESETS: Record<string, Record<string, string>> = {
      sans: {
        fontFamily: 'sans',
        fontWeight: 'normal',
        letterSpacing: '-0.01em',
      },
      serif: {
        fontFamily: 'serif',
        fontWeight: 'normal',
        letterSpacing: 'normal',
      },
      mono: {
        fontFamily: 'mono',
        fontWeight: 'normal',
        letterSpacing: '-0.04em',
      },
    }

    const WEIGHT_TOKENS: Record<string, string> = {
      'sans.thin': '200',
      'sans.light': '300',
      'sans.normal': '400',
      'sans.semibold': '600',
      'sans.bold': '700',
      'sans.black': '900',
      'serif.thin': '100',
      'serif.light': '300',
      'serif.normal': '373',
      'serif.semibold': '600',
      'serif.bold': '700',
      'serif.black': '900',
      'mono.thin': '100',
      'mono.light': '300',
      'mono.normal': '393',
      'mono.semibold': '600',
      'mono.bold': '700',
    }

    const result: Record<string, unknown> = {}

    if (font && typeof font === 'string' && FONT_PRESETS[font]) {
      Object.assign(result, FONT_PRESETS[font])
    }

    if (weight && typeof weight === 'string' && WEIGHT_TOKENS[weight]) {
      result.fontWeight = WEIGHT_TOKENS[weight]
    }

    return result
  },
})
