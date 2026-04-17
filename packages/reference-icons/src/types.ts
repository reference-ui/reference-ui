import type { StyleProps } from '@reference-ui/react'
import type * as React from 'react'

export type IconVariant = 'outline' | 'filled'

/**
 * Material symbol icon: SVG attributes, Reference `StyleProps` (token-safe colors, spacing, etc.),
 * plus `variant` and optional `size` (maps to width/height when those are unset).
 */
export type MaterialSymbolIconProps = StyleProps &
  React.SVGProps<SVGSVGElement> & {
    variant?: IconVariant
    size?: number | string
  }
