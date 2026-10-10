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
  open?: boolean
  defaultOpen?: boolean
  onOpen?: () => void
  onOpenChange?: (open: boolean) => void
  openDelay?: number
  closeDelay?: number
}
