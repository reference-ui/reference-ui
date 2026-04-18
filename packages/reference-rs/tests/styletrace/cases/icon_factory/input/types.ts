import type * as React from 'react'

export type IconProps = React.SVGProps<SVGSVGElement> & {
  variant?: 'outline' | 'filled'
  size?: number | string
  color?: string
  css?: { color?: string }
  weight?: string
}