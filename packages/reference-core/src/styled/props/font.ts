/**
 * Font prop: Apply font presets (sans, serif, mono)
 */

import { patterns } from '../api/patterns.js'
import { PRIMITIVE_JSX_NAMES } from '../../primitives/tags.js'

// --- Type ---

export type FontProp = 'sans' | 'serif' | 'mono'

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
