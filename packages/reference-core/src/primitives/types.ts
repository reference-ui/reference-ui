import type * as React from 'react'
import type { HTMLStyledProps } from '../system/types/jsx.js'
import type { DistributiveOmit } from '../system/types/system-types.js'
import type { ResponsiveBreakpoints, ContainerProp, FontProp } from '../styled/props/index.js'

/** Primitive props: HTML + Panda + r, container, font. No 'as'. */
export type PrimitiveProps<T extends keyof React.JSX.IntrinsicElements> =
  DistributiveOmit<HTMLStyledProps<T>, 'as'> & {
    r?: ResponsiveBreakpoints
    container?: ContainerProp
    font?: FontProp
  }

export type PrimitiveElement<
  T extends keyof React.JSX.IntrinsicElements
> = React.ComponentRef<T>
