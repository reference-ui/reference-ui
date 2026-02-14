import type * as React from 'react'
import type { HTMLStyledProps } from '../system/types/jsx.js'
import type { DistributiveOmit } from '../system/types/system-types.js'
import type { ResponsiveBreakpoints } from '../styled/patterns'

/** Primitive props: HTML + Panda + r, container, font. No 'as'. */
export type PrimitiveProps<T extends keyof React.JSX.IntrinsicElements> =
  DistributiveOmit<HTMLStyledProps<T>, 'as'> & {
    r?: ResponsiveBreakpoints
    container?: string | boolean
    font?: 'sans' | 'serif' | 'mono'
  }

export type PrimitiveElement<
  T extends keyof React.JSX.IntrinsicElements
> = React.ComponentRef<T>
