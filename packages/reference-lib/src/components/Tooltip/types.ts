/**
 * Tooltip's public prop contract: the open state a caller hands over
 * (controlled `open` or `defaultOpen`), the open/close delays that shape
 * hover intent, and the Overlay dismiss handlers the root forwards. Kept
 * free of JSX and logic so stories, tests, and consumers can import the
 * shape without mounting anything.
 */
import type * as React from 'react'
import type { OverlayDismissHandlers } from '../Overlay'

export interface TooltipProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  /** Controlled open state. Omit it to let Tooltip manage its own. */
  open?: boolean
  /**
   * Open state on first render when `open` is omitted.
   * @default false
   */
  defaultOpen?: boolean
  /** Called when the tooltip opens. */
  onOpen?: () => void
  /** Called on every open and close request. */
  onOpenChange?: (open: boolean) => void
  /**
   * Milliseconds the pointer must rest on the trigger before it opens.
   * @default 700
   */
  openDelay?: number
  /**
   * Milliseconds after the pointer leaves before it closes.
   * @default 300
   */
  closeDelay?: number
  /** Called when the tooltip closes. */
  onDismiss?: () => void
  /** Called on Escape. `preventDefault()` keeps it open. */
  onEscape?: (event: KeyboardEvent) => void
  /** Called on a press outside. `preventDefault()` keeps it open. */
  onOutsidePress?: (event: PointerEvent) => void
  /** Called with the same outside press. */
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void
}
