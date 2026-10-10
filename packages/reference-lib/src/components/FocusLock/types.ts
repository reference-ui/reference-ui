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
  children?: React.ReactElement | null | false
  disabled?: boolean
  initialFocus?: FocusTarget | boolean
  restoreFocus?: FocusTarget | boolean
  defaultRestoreTarget?: FocusTarget
  shards?: Array<HTMLElement | React.RefObject<HTMLElement | null>>
}
