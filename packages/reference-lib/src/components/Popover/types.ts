/**
 * Popover's public prop contract: the Overlay surface minus isolation and
 * edge (a popover never traps), plus the hover-card vocabulary — the
 * `openOnHover` switch and its open/close delays. Kept free of JSX and
 * logic so stories, tests, and consumers can import the shape without
 * mounting anything.
 */
import type { OverlayProps } from '../Overlay'

export interface PopoverProps extends Omit<OverlayProps, 'isolation' | 'edge'> {
  openOnHover?: boolean
  openDelay?: number
  closeDelay?: number
}
