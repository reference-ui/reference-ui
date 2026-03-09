import type * as React from 'react'
import type { SystemStyleObject } from '@reference-ui/styled/types'
import type { ReferenceBoxPatternProps, ReferenceSystemStyleObject } from '../types'

export interface PrimitiveLayerProps {
  layer?: string
}

export interface PrimitiveCssProps {
  css?: SystemStyleObject
}

export type PrimitiveProps<T extends keyof React.JSX.IntrinsicElements> =
  Omit<
    React.ComponentPropsWithoutRef<T>,
    keyof ReferenceBoxPatternProps | keyof PrimitiveLayerProps | keyof PrimitiveCssProps
  > &
  ReferenceBoxPatternProps &
  PrimitiveCssProps &
  ReferenceSystemStyleObject &
  PrimitiveLayerProps

export type PrimitiveElement<T extends keyof React.JSX.IntrinsicElements> = React.ComponentRef<T>
