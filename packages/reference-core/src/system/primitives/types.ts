import type * as React from 'react'
import type { SystemStyleObject } from '@reference-ui/styled/types'
import type {
  ReferenceBoxPatternProps,
  ReferenceColorModeProps,
  ReferenceSystemStyleObject,
} from '../types'

export interface PrimitiveCssProps {
  css?: SystemStyleObject
}

export type PrimitiveProps<T extends keyof React.JSX.IntrinsicElements> =
  Omit<
    React.ComponentPropsWithoutRef<T>,
    keyof ReferenceBoxPatternProps | keyof PrimitiveCssProps | keyof ReferenceColorModeProps
  > &
  ReferenceBoxPatternProps &
  ReferenceColorModeProps &
  PrimitiveCssProps &
  ReferenceSystemStyleObject

export type PrimitiveElement<T extends keyof React.JSX.IntrinsicElements> = React.ComponentRef<T>
