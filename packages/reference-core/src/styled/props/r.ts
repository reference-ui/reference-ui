/**
 * Responsive container query prop (r)
 */

import type { SystemStyleObject } from '../../system/types/index'
import { patterns } from '../api/patterns'
import { PRIMITIVE_JSX_NAMES } from '../../primitives/tags'

// --- Type ---

/**
 * Responsive breakpoints using container queries.
 * Keys are pixel values, values are style objects applied at that breakpoint.
 * 
 * @example
 * ```tsx
 * <Box r={{ 320: { fontSize: '14px' }, 768: { fontSize: '16px' } }}>
 * ```
 */
export type ResponsiveBreakpoints = {
  [breakpoint: number]: SystemStyleObject
}

export interface ResponsivePropDefinition {
  r?: ResponsiveBreakpoints
}

// --- Pattern ---

patterns({
  responsiveContainer: {
    jsx: [...PRIMITIVE_JSX_NAMES],
    properties: {
      r: { type: 'object' as const },
      container: { type: 'string' as const },
    },
    blocklist: ['r'],
    transform(props: Record<string, any>) {
      const { r, container, ...rest } = props

      if (!r) return rest

      const prefix = container
        ? `@container ${container} (min-width:`
        : `@container (min-width:`

      return {
        ...rest,
        ...Object.fromEntries(
          Object.entries(r).map(([bp, styles]) => [`${prefix} ${bp}px)`, styles])
        ),
      }
    },
  },
})
