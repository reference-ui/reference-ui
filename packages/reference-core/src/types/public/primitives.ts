/// <reference lib="dom" />

import type * as React from 'react'
import type { Tag } from '../../system/primitives/tags'
import type { ColorModeProps } from './props'
import type { StyleProps } from './style-props'
import type { SystemStyleObject } from './system-style-object'

export type PrimitiveTag = Tag

export interface PrimitiveCssProps {
  css?: SystemStyleObject
}

/**
 * Public prop surface for a styled HTML primitive without polymorphic `as`.
 * Useful for extendable style bags that can be spread directly onto primitives.
 */
export type HTMLStyledProps<T extends PrimitiveTag> = PrimitiveProps<T>

type PrimitiveOwnProps = StyleProps & ColorModeProps & PrimitiveCssProps
type PrimitiveNativeProps<T extends PrimitiveTag> = React.ComponentPropsWithoutRef<T>

export type PrimitiveProps<T extends PrimitiveTag> = Omit<
  PrimitiveNativeProps<T>,
  keyof PrimitiveOwnProps
> & PrimitiveOwnProps

/**
 * React's `JSX.IntrinsicElements` types `caption` and `menu` with the generic
 * `HTMLElement` ref instead of the actual `HTMLTableCaptionElement` and
 * `HTMLMenuElement`. That mismatch breaks `forwardRef<PrimitiveElement<T>, …>`
 * when assigned to the curated `*Component` aliases (which use the correct
 * specific element types). Override the affected tags here so the runtime
 * primitives type-check against their real DOM element.
 */
interface PrimitiveElementOverrides {
  caption: HTMLTableCaptionElement
  menu: HTMLMenuElement
}

export type PrimitiveElement<T extends PrimitiveTag> =
  T extends keyof PrimitiveElementOverrides
    ? PrimitiveElementOverrides[T]
    : React.ComponentRef<T>

export type PrimitiveComponent<T extends PrimitiveTag> =
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<PrimitiveProps<T>> &
    React.RefAttributes<PrimitiveElement<T>>
  >
