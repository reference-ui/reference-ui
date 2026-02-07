import type * as React from 'react'
import type { HTMLStyledProps } from '../system/types/jsx.js'
import type { DistributiveOmit } from '../system/types/system-types.js'
import type { ResponsiveBreakpoints } from '../styled/responsive'

/** Primitive props: HTML + Panda + r, container. No 'as'. */
export type PrimitiveProps<T extends keyof React.JSX.IntrinsicElements> =
  DistributiveOmit<HTMLStyledProps<T>, 'as'> & {
    r?: ResponsiveBreakpoints
    container?: string | boolean
  }

export type PrimitiveElement<
  T extends keyof React.JSX.IntrinsicElements
> = React.ComponentRef<T>
