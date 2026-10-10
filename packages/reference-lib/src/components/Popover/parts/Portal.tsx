/**
 * Popover portal: renders popover content into the Overlay portal host so
 * floating content escapes ancestor clipping. A thin pass-through —
 * placement and chrome belong to Content.
 */
import { Overlay } from '../../Overlay'
import { type PortalProps } from '../../Portal'

export function PopoverPortal({ children, container }: PortalProps) {
  return <Overlay.Portal container={container}>{children}</Overlay.Portal>
}
