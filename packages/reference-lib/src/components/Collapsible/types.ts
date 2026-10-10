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
  id?: string
  open?: boolean
  defaultOpen?: boolean
  onChange?: (open: boolean) => void
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  /**
   * CO-MOUNT: default `hidden` passthrough for Content. Closed content stays
   * mounted but hidden (`hidden="until-found"`), so browser find can reveal
   * it. A Content-level `hiddenUntilFound` prop wins over this default.
   */
  hiddenUntilFound?: boolean
}

export type CollapsibleTriggerProps = PrimitiveProps<'button'> & {
  hideIcon?: boolean
  icon?: React.ReactNode
}

export type CollapsibleContentProps = PrimitiveProps<'div'> & {
  /**
   * CO-MOUNT: keep closed content mounted but hidden (`hidden="until-found"`)
   * so browser find can reveal it. Wins over `forceMount` (hidden content
   * must actually hide) and over the root default. Closed content still
   * animates shut instantly and stays inert; a `beforematch` reveal opens
   * the Collapsible with enter motion skipped.
   */
  hiddenUntilFound?: boolean
  /**
   * CO-MOUNT: keep closed content mounted AND interactive (no `hidden`, no
   * inert, no collapse styles) — the escape hatch for measured/pre-mounted
   * content. Focus is never evacuated on close. Loses to `hiddenUntilFound`.
   */
  forceMount?: boolean
}
