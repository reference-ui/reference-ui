/** Custom Panda patterns and global CSS. */
import type { SystemStyleObject } from '../system/types/index.js'
import { PRIMITIVE_JSX_NAMES } from '../primitives/tags.js'
import { patterns } from './api/patterns'

// --- Types -------------------------------------------------------------------

export type ResponsiveBreakpoints = {
  [breakpoint: number]: SystemStyleObject
}

// --- Box pattern --------------------------------------------------------------
// Base primitive props: container queries (r, container) + font presets (font).

patterns({
  box: {
    jsx: [...PRIMITIVE_JSX_NAMES],
    properties: {
      r: { type: 'object' as const },
      container: { type: 'string' as const },
      font: { type: 'string' as const },
    },
    blocklist: ['r', 'container', 'font'],
    transform(props: Record<string, any>) {
      const { r, container, font, ...rest } = props

      // Apply font preset styles (inlined for bundling)
      let fontStyles = {}
      if (font === 'sans') {
        fontStyles = { fontFamily: 'sans', letterSpacing: '-0.01em', fontWeight: '400' }
      } else if (font === 'serif') {
        fontStyles = { fontFamily: 'serif', letterSpacing: 'normal', fontWeight: '373' }
      } else if (font === 'mono') {
        fontStyles = { fontFamily: 'mono', letterSpacing: '-0.04em', fontWeight: '393' }
      }

      if (r) {
        const prefix = container
          ? `@container ${container} (min-width:`
          : `@container (min-width:`
        return {
          ...fontStyles,
          ...rest,
          ...Object.fromEntries(
            Object.entries(r).map(([bp, styles]) => [`${prefix} ${bp}px)`, styles])
          ),
        }
      }

      if (container !== undefined) {
        return {
          ...fontStyles,
          ...rest,
          containerType: 'inline-size',
          ...(typeof container === 'string' && container && { containerName: container }),
        }
      }

      // Just font or pass-through
      return {
        ...fontStyles,
        ...rest,
      }
    },
  },
})

// --- Container pattern -------------------------------------------------------

patterns({
  jsx: [...PRIMITIVE_JSX_NAMES],
  container: {
    properties: {
      name: { type: 'string' },
      type: { type: 'enum', value: ['inline-size', 'size', 'normal'] },
      density: { type: 'enum', value: ['compact', 'comfortable', 'spacious'] },
    },
    defaultValues: {
      type: 'inline-size',
    },
    transform(props: Record<string, any>) {
      const { name, type, density, ...rest } = props
      return {
        containerType: type,
        ...(name && { containerName: name }),
        ...(density && { 'data-density': density }),
        ...rest,
      }
    },
  },
})

// --- Global CSS: rhythm tokens -----------------------------------------------

const rhythmTokens = {
  ':root': {
    '--r-base': '16px',
    '--r-density': '1',
    '--spacing-r': 'calc(var(--r-base) * var(--r-density))',
  },
}

// --- Global CSS: body defaults ------------------------------------------------

const bodyDefaults = {
  body: {
    fontFamily: 'sans',
    letterSpacing: '-0.01em',
    fontSize: 'body',
  },
}

// --- Global CSS: density variants ---------------------------------------------

const densityVariants = {
  '[data-density="compact"]': { '--r-density': '0.75' },
  '[data-density="comfortable"]': { '--r-density': '1' },
  '[data-density="spacious"]': { '--r-density': '1.25' },
}

// --- Global CSS export -------------------------------------------------------

export const patternsGlobalCss = {
  ...rhythmTokens,
  ...bodyDefaults,
  ...densityVariants,
}
