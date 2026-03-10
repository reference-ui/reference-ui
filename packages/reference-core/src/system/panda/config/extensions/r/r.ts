/**
 * Responsive container query prop (r) for the box pattern.
 */

import { extendPattern } from '../../../../api/patterns'

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

    const containerName =
      typeof container === 'string' && container.length > 0 ? container : undefined
    const prefix = containerName
      ? `@container ${containerName} (min-width:`
      : '@container (min-width:'

    return Object.fromEntries(
      Object.entries(r as Record<string, unknown>).map(([bp, styles]) => [
        `${prefix} ${bp}px)`,
        styles,
      ])
    )
  },
})
