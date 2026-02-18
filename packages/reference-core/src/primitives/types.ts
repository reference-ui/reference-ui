import type * as React from 'react'
import type { HTMLStyledProps } from '../system/types/jsx'
import type { DistributiveOmit } from '../system/types/system-types'
import type { StrictColorProps } from '../styled/types'
import type { SystemProps } from '../styled/props/index'

/** Primitive props: HTML + Panda + system props. No 'as'. Color props exclude deprecated system colors. */
export type PrimitiveProps<T extends keyof React.JSX.IntrinsicElements> =
  DistributiveOmit<StrictColorProps<HTMLStyledProps<T>>, 'as'> & SystemProps

export type PrimitiveElement<
  T extends keyof React.JSX.IntrinsicElements
> = React.ComponentRef<T>
