/** Custom Panda patterns and global CSS. */
import type { SystemStyleObject } from '../system/types/index.js'
import { PRIMITIVE_JSX_NAMES } from '../primitives/tags.js'

// --- Types -------------------------------------------------------------------

export type ResponsiveBreakpoints = {
  [breakpoint: number]: SystemStyleObject
}

// --- Box pattern --------------------------------------------------------------
// Modes: (1) r = expand breakpoint map to @container queries. (2) container = set
// containment context. (3) font = apply font preset (sans|serif|mono).

const boxPattern = {
  jsx: ['Box', ...PRIMITIVE_JSX_NAMES],
  properties: {
    r: { type: 'object' as const },
    container: { type: 'string' as const },
    font: { type: 'string' as const },
  },
  blocklist: ['r', 'container', 'font'],
  transform(props: Record<string, any>) {
    const { r, container, font, ...rest } = props

    if (r) {
      const prefix = container
        ? `@container ${container} (min-width:`
        : `@container (min-width:`
      return {
        ...rest,
        ...Object.fromEntries(
          Object.entries(r).map(([bp, styles]) => [`${prefix} ${bp}px)`, styles])
        ),
      }
    }

    if (container !== undefined) {
      return {
        ...rest,
        containerType: 'inline-size',
        ...(typeof container === 'string' && container && { containerName: container }),
      }
    }

    if (font != null && typeof font === 'string') {
      const fontPresets: Record<string, SystemStyleObject> = {
        sans: { fontFamily: 'sans', letterSpacing: '-0.01em' },
        serif: { fontFamily: 'serif', letterSpacing: 'normal' },
        mono: { fontFamily: 'mono', letterSpacing: '-0.08em' },
      }
      const styles = fontPresets[font]
      if (styles) return { ...rest, ...styles }
    }

    return rest
  },
}

// --- Container pattern -------------------------------------------------------

const containerPattern = {
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
}

// --- Patterns export ---------------------------------------------------------

export const patterns = {
  box: boxPattern,
  container: containerPattern,
}

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
