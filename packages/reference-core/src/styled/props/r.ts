/**
 * Responsive container query prop (r)
 */

import type { SystemStyleObject } from '../../system/types/index'
import { pattern } from '../api/pattern'

// --- Type ---

export type ResponsiveBreakpoints = {
  [breakpoint: number]: SystemStyleObject
}

export interface ResponsivePropDefinition {
  r?: ResponsiveBreakpoints
}

// --- Box Pattern Extension ---

pattern({
  properties: {
    r: { type: 'object' as const },
  },
  transform(props: Record<string, any>) {
    const { r, container } = props

    if (!r) return {}

    const prefix = container
      ? `@container ${container} (min-width:`
      : `@container (min-width:`

    return Object.fromEntries(
      Object.entries(r).map(([bp, styles]) => [`${prefix} ${bp}px)`, styles])
    )
  },
})
