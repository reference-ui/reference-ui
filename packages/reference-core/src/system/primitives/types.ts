import type * as React from 'react'
import type { SystemStyleObject } from '@reference-ui/styled/types'
import type { ReferenceProps, ColorModeProps, StrictColorProps, StyleProps } from '../../types'

export interface PrimitiveCssProps {
  css?: StrictColorProps<SystemStyleObject>
}

export type PrimitiveProps<T extends keyof React.JSX.IntrinsicElements> = Omit<
  React.ComponentPropsWithoutRef<T>,
  keyof ReferenceProps | keyof PrimitiveCssProps | keyof ColorModeProps
> &
  ColorModeProps &
  PrimitiveCssProps &
  StyleProps

export type PrimitiveElement<T extends keyof React.JSX.IntrinsicElements> =
  React.ComponentRef<T>
