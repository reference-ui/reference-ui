/**
 * Responsive container query prop (r)
 */

import { extendPattern } from '../../collectors/extendPattern'

export interface ResponsiveProp {
  r?: {
    [breakpoint: number]: Record<string, unknown>
  }
}

extendPattern({
  properties: {
    r: { type: 'object' },
  },
  transform(props: Record<string, unknown>) {
    const { r, container } = props

    if (!r) return {}

    const prefix = container
      ? `@container ${container} (min-width:`
      : `@container (min-width:`

    return Object.fromEntries(
      Object.entries(r as Record<string, unknown>).map(([bp, styles]) => [
        `${prefix} ${bp}px)`,
        styles,
      ])
    )
  },
})
