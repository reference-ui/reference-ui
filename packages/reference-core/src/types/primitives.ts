import type * as React from 'react'
import type { Tag } from '../system/primitives/tags'
import type { ColorModeProps } from './props'
import type { StrictColorProps } from './colors'
import type { StyleProps } from './style-props'
import type { SystemStyleObject } from './system-style-object'

export type PrimitiveTag = Tag

export interface PrimitiveCssProps {
  css?: StrictColorProps<SystemStyleObject>
}

type PrimitiveOwnProps = StyleProps & ColorModeProps & PrimitiveCssProps
type PrimitiveNativeProps<T extends PrimitiveTag> = React.ComponentPropsWithoutRef<T>

export type PrimitiveProps<T extends PrimitiveTag> = Omit<
  PrimitiveNativeProps<T>,
  keyof PrimitiveOwnProps
> & PrimitiveOwnProps

export type PrimitiveElement<T extends PrimitiveTag> =
  React.ComponentRef<T>

export type PrimitiveComponent<T extends PrimitiveTag> =
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<PrimitiveProps<T>> &
    React.RefAttributes<PrimitiveElement<T>>
  >
