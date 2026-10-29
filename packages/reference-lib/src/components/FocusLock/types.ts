/**
 * FocusLock's public contract: the FocusTarget union a caller hands over
 * (element, ref, or resolver) and the FocusLockProps the root accepts. Kept
 * free of JSX and logic so Overlay, the type tests, and consumers can import
 * the shape without mounting anything.
 */
import type * as React from 'react'

export type FocusTarget =
  | HTMLElement
  | React.RefObject<HTMLElement | null>
  | (() => HTMLElement | null)

export interface FocusLockProps {
  /** The one element that holds focus. FocusLock adds no wrapper. */
  children?: React.ReactElement | null | false
  /**
   * Turns the lock off.
   * @default false
   */
  disabled?: boolean
  /**
   * Where focus goes when the lock starts. `false` leaves focus where it is.
   * @default the first tabbable element
   */
  initialFocus?: FocusTarget | boolean
  /**
   * Where focus goes when the lock ends. `false` leaves it.
   * @default true
   */
  restoreFocus?: FocusTarget | boolean
  /** Where focus returns if nothing outside the lock had focus when it started. */
  defaultRestoreTarget?: FocusTarget
  /** Elements outside the child that belong to the lock, such as a portalled popover. */
  shards?: Array<HTMLElement | React.RefObject<HTMLElement | null>>
}
