/** Box/container pattern. jsx hint for Panda. */
import type { SystemStyleObject } from '../system/types/index.js'
import { PRIMITIVE_JSX_NAMES } from '../primitives/tags.js'
export type ResponsiveBreakpoints = {
  [breakpoint: number]: SystemStyleObject
}

export const responsivePatterns = {
  box: {
    jsx: ['Box', ...PRIMITIVE_JSX_NAMES],
    properties: {
      r: { type: 'object' as const },
      container: { type: 'string' as const },
    },
    blocklist: ['r', 'container'],
    transform(props: Record<string, any>) {
      const { r, container, ...rest } = props

      if (r) {
        const prefix = container
          ? `@container ${container} (min-width:`
          : `@container (min-width:`
        for (const [bp, styles] of Object.entries(r)) {
          rest[`${prefix} ${bp}px)`] = styles
        }
        return rest
      }

      if (container !== undefined) {
        rest.containerType = 'inline-size'
        if (typeof container === 'string' && container) {
          rest.containerName = container
        }
        return rest
      }

      return rest
    },
  },
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
}

export const responsiveGlobalCss = {
  ':root': {
    '--r-base': '16px',
    '--r-density': '1',
    '--spacing-r': 'calc(var(--r-base) * var(--r-density))',
  },
  body: {
    fontFamily: 'sans',
    fontSize: 'body',
  },
  '[data-density="compact"]': {
    '--r-density': '0.75',
  },
  '[data-density="comfortable"]': {
    '--r-density': '1',
  },
  '[data-density="spacious"]': {
    '--r-density': '1.25',
  },
}
