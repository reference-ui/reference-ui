import type * as React from 'react'
import type { SystemStyleObject } from '@reference-ui/styled/types'
import type { BoxProperties } from '@reference-ui/styled/patterns/box'

export interface PrimitiveLayerProps {
  layer?: string
}

export type PrimitiveProps<T extends keyof React.JSX.IntrinsicElements> =
  Omit<React.ComponentPropsWithoutRef<T>, keyof BoxProperties | keyof PrimitiveLayerProps> &
  BoxProperties &
  SystemStyleObject &
  PrimitiveLayerProps

export type PrimitiveElement<T extends keyof React.JSX.IntrinsicElements> = React.ComponentRef<T>
