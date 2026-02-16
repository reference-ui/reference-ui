/**
 * Font prop: Apply font presets (sans, serif, mono)
 */

import { recipe } from '../api/recipe'
import { pattern } from '../api/pattern'

// --- Type ---

export type FontProp = 'sans' | 'serif' | 'mono'

export interface FontPropDefinition {
  font?: FontProp
}

// --- Recipe ---

recipe({
  fontStyle: {
    className: 'r_font',
    variants: {
      font: {
        sans: {
          fontFamily: 'sans',
          letterSpacing: '-0.01em',
          fontWeight: '400',
        },
        serif: {
          fontFamily: 'serif',
          letterSpacing: 'normal',
          fontWeight: '373',
        },
        mono: {
          fontFamily: 'mono',
          letterSpacing: '-0.04em',
          fontWeight: '393',
        },
      },
    },
  },
})

// --- Box Pattern Extension ---

pattern({
  properties: {
    font: { type: 'string' as const },
  },
  transform(props: Record<string, any>) {
    const { font } = props

    if (!font) return {}

    const FONT_PRESETS = {
      sans: { fontFamily: 'sans', letterSpacing: '-0.01em', fontWeight: '400' },
      serif: { fontFamily: 'serif', letterSpacing: 'normal', fontWeight: '373' },
      mono: { fontFamily: 'mono', letterSpacing: '-0.04em', fontWeight: '393' },
    }

    return FONT_PRESETS[font as keyof typeof FONT_PRESETS] || {}
  },
})
