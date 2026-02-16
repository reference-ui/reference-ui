/**
 * Font prop: Apply font presets (sans, serif, mono)
 */

import { patterns } from '../api/patterns'
import { recipe } from '../api/recipe'
import { PRIMITIVE_JSX_NAMES } from '../../primitives/tags'

// --- Type ---

export type FontProp = 'sans' | 'serif' | 'mono'

export interface FontPropDefinition {
  font?: FontProp
}

// --- Recipe ---

/**
 * Font preset recipe. Applied via font prop; use cx() at runtime.
 * Full static CSS emission—color, etc. work because recipes are precompiled.
 */
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

// --- Pattern ---

patterns({
  fontPreset: {
    jsx: [...PRIMITIVE_JSX_NAMES],
    properties: {
      font: { type: 'string' as const },
    },
    blocklist: ['font'],
    transform(props: Record<string, any>) {
      const { font, ...rest } = props

      // Font presets (defined inline for Panda codegen)
      const FONT_PRESETS = {
        sans: { fontFamily: 'sans', letterSpacing: '-0.01em', fontWeight: '400' },
        serif: { fontFamily: 'serif', letterSpacing: 'normal', fontWeight: '373' },
        mono: { fontFamily: 'mono', letterSpacing: '-0.04em', fontWeight: '393' },
      }

      const fontStyles = font ? FONT_PRESETS[font as keyof typeof FONT_PRESETS] || {} : {}

      return {
        ...fontStyles,
        ...rest,
      }
    },
  },
})
