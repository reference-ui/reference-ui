/**
 * Reference UI Primitive Types
 *
 * Primitive components are fixed to their HTML element - no polymorphic 'as' prop.
 * This guards against Panda's polymorphic API and keeps the system transparent:
 * Div always renders <div>, Span always renders <span>.
 *
 * Type design is future-proof: we explicitly omit 'as' so that when TypeScript
 * (or stricter type checkers) evolve, they won't infer unwanted polymorphism.
 *
 * All primitives use the box pattern: r (responsive) and container props.
 */

import type * as React from 'react'
import type { HTMLStyledProps } from '../system/types/jsx.js'
import type { DistributiveOmit } from '../system/types/system-types.js'
import type { ResponsiveBreakpoints } from '../styled/responsive'

/**
 * Props for a primitive component.
 * - Extends the native HTML element's props
 * - Includes Panda's style props (margin, padding, color, etc.)
 * - Includes r and container from the box pattern (container queries)
 * - Explicitly OMITS 'as' - Reference UI primitives are not polymorphic
 *
 * Each primitive is a 1:1 wrapper: Div → div, Span → span, etc.
 */
export type PrimitiveProps<T extends keyof React.JSX.IntrinsicElements> =
  DistributiveOmit<HTMLStyledProps<T>, 'as'> & {
    r?: ResponsiveBreakpoints
    container?: string | boolean
  }

/**
 * Mapping from HTML tag name to its DOM element type.
 * Used for forwardRef generic – ensures refs match the actual DOM node.
 */
export type PrimitiveElement<
  T extends keyof React.JSX.IntrinsicElements
> = React.ComponentRef<T>
