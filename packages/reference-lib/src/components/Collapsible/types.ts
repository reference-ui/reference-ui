/**
 * Collapsible's public contract: the root disclosure props plus the trigger
 * and content part props. Kept free of JSX and logic so the parts, the
 * session hook, and consumers can import the shape without mounting the
 * disclosure.
 */
import type * as React from 'react'
import type { PrimitiveProps } from '@reference-ui/react'

export interface CollapsibleProps {
  children?: React.ReactNode
  /** The item's id inside an Accordion. */
  id?: string
  /** Controlled open state. Omit it to let Collapsible manage its own. */
  open?: boolean
  /**
   * Open state on first render when `open` is omitted.
   * @default false
   */
  defaultOpen?: boolean
  /** Same as `onOpenChange`. If you pass both, `onChange` runs first. */
  onChange?: (open: boolean) => void
  /** Called when the trigger toggles. */
  onOpenChange?: (open: boolean) => void
  /**
   * Disables the trigger.
   * @default false
   */
  disabled?: boolean
  /**
   * Default for `Content`'s `hiddenUntilFound`.
   * @default false
   */
  hiddenUntilFound?: boolean
}

export type CollapsibleTriggerProps = PrimitiveProps<'button'> & {
  /**
   * Removes the indicator icon.
   * @default false
   */
  hideIcon?: boolean
  /**
   * Replaces the indicator icon.
   * @default a chevron icon
   */
  icon?: React.ReactNode
  /**
   * Overrides the root's `disabled`.
   * @default the root's `disabled`
   */
  disabled?: boolean
}

export type CollapsibleContentProps = PrimitiveProps<'div'> & {
  /**
   * Keep closed content mounted as `hidden="until-found"`, so the browser's
   * find-in-page can reveal it. Wins over `forceMount`.
   * @default the root's `hiddenUntilFound`
   */
  hiddenUntilFound?: boolean
  /**
   * Keep closed content mounted and interactive, with no collapse motion.
   * @default false
   */
  forceMount?: boolean
  /**
   * Replaces the generated id the trigger points to.
   * @default generated
   */
  id?: string
}
